/**
 * Tests for the universal sign stage (ADR-0082 §2):
 *   - NoOpSigner (unsigned, deterministic)
 *   - Pkcs12Signer (local/dev PAdES seal via node-signpdf)
 *   - HsmSigner (delegates the seal to an air-gapped appliance; SSRF guard)
 */
import { PDFDocument } from "@cantoo/pdf-lib";
import forge from "node-forge";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { HsmSigner } from "./hsm-signer.js";
import { NoOpSigner } from "./noop-signer.js";
import { Pkcs12Signer } from "./pkcs12-signer.js";
import { wrapPdfA3 } from "../engine/pdfa3.js";

/** Generate a self-signed PKCS#12 keystore for the Pkcs12Signer test. */
function makeSelfSignedP12(password: string): Buffer {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 365 * 86_400_000);
  const attrs = [
    { name: "commonName", value: "Rocky Test Signer" },
    { name: "organizationName", value: "Rocky" },
    { name: "countryName", value: "MK" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, password);
  return Buffer.from(forge.asn1.toDer(p12Asn1).getBytes(), "binary");
}

let p12: Buffer;

beforeAll(() => {
  p12 = makeSelfSignedP12("password");
});

async function wrappedVisual(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const visual = await doc.save();
  return wrapPdfA3({
    pdf: visual,
    attachments: [
      { filename: "x.yaml", buffer: new TextEncoder().encode("a: 1"), mimeType: "application/yaml" },
    ],
    meta: { title: "T", subject: "S", documentId: "r1" },
  });
}

function decode(pdf: Uint8Array): string {
  return new TextDecoder("latin1").decode(pdf);
}

describe("NoOpSigner", () => {
  it("returns the buffer unchanged", async () => {
    const pdf = await wrappedVisual();
    const out = await new NoOpSigner().sign(pdf);
    expect(out).toEqual(pdf);
    expect(decode(out)).not.toContain("/Sig");
  });
});

describe("Pkcs12Signer", () => {
  it("adds a PAdES /Sig with a ByteRange to the PDF/A-3", async () => {
    const pdf = await wrappedVisual();
    const signed = await new Pkcs12Signer({ p12, passphrase: "password" }).sign(pdf);
    const text = decode(signed);

    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("/Sig");
    expect(text).toContain("/ByteRange");
    // The embedded source file survives the seal.
    expect(text).toContain("/EmbeddedFile");
    // A CMS signature is present in the /Sig Contents.
    expect(text).toContain("/Contents");
  });
});

describe("HsmSigner", () => {
  it("rejects non-https endpoints (SSRF guard)", () => {
    expect(() => new HsmSigner({ endpoint: "http://hsm.local/sign" })).toThrow();
  });

  it("rejects hosts outside the trusted allowlist", () => {
    expect(
      () => new HsmSigner({ endpoint: "https://evil.example/sign", trustedHosts: ["hsm.rocky.mk"] }),
    ).toThrow();
  });

  it("delegates the seal to the appliance and returns its bytes", async () => {
    const fetchMock = vi.fn(
      async (_url: RequestInfo, _init?: RequestInit): Promise<Response> => {
        const body = Buffer.from((_init?.body as Buffer) ?? Buffer.alloc(0));
        const out = Buffer.concat([body, Buffer.from("SIGNED-BY-HSM")]);
        return new Response(out, { status: 200, headers: { "content-type": "application/pdf" } });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const signer = new HsmSigner({
        endpoint: "https://hsm.rocky.mk/sign",
        trustedHosts: ["hsm.rocky.mk"],
      });
      const pdf = await wrappedVisual();
      const out = await signer.sign(pdf);

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(Buffer.from(out).toString("latin1")).toContain("SIGNED-BY-HSM");
      // The appliance's signed bytes still carry the original hybrid container.
      expect(Buffer.from(out).toString("latin1")).toContain("/EmbeddedFile");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
