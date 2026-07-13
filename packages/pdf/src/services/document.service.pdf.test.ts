/**
 * Integration test: `DocumentService.generate({ format: "pdf" })` renders a
 * Typst visual PDF (ADR-0082). Uses a fake template registered in the shared
 * registry so no DB is needed.
 */
import { ok } from "neverthrow";
import { beforeAll, describe, expect, it } from "vitest";
import forge from "node-forge";
import { DocumentRegistry } from "../engine/document-registry.js";
import { renderTypst } from "../engine/typst-renderer.js";
import { DocumentService } from "./document.service.js";
import { isFormatSupported } from "../engine/yaml-serializer.js";
import { Pkcs12Signer } from "../sign/pkcs12-signer.js";
import { FakeTimestampAuthority } from "../sign/timestamp.js";

/**
 * Network probe. The Typst WASM compiler opportunistically fetches default
 * font assets from `cdn.jsdelivr.net`; when that host is unreachable (offline
 * CI / sandbox) the render fails. Use this to gate the integration tests so
 * the suite stays green offline — the deterministic PAdES-LTV sign/verify
 * logic is covered by `pades-cms.test.ts` without any network dependency.
 */
let networkOk = false;
try {
  await fetch("https://cdn.jsdelivr.net/", { method: "HEAD", signal: AbortSignal.timeout(4000) });
  networkOk = true;
} catch {
  networkOk = false;
}

const FAKE_TYPE = "test-pdf-doc";

/** Self-signed PKCS#12 for the signed/verify path (no HSM needed in tests). */
function makeP12(password: string): Buffer {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 365 * 86_400_000);
  const attrs = [
    { name: "commonName", value: "Rocky Test Signer" },
    { name: "countryName", value: "MK" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, password);
  return Buffer.from(forge.asn1.toDer(p12Asn1).getBytes(), "binary");
}

beforeAll(() => {
  DocumentRegistry.getInstance().register({
    type: FAKE_TYPE,
    name: "Test PDF Document",
    modelPath: "models/test-pdf.yaml",
    modelVersion: "1.0.0",
    availableFormats: ["yaml", "pdf"],
    async fetchData() {
      // Cyrillic + nested object to prove script coverage + JSON model passing.
      return ok({ farm: "Фарма Козјак", count: 12, lineage: { sire: "A", dam: "B" } });
    },
    async mapToModel(data) {
      return data as Record<string, unknown>;
    },
  });
});

function pdfHeader(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, 5));
}

describe.skipIf(!networkOk)("DocumentService.generate — pdf branch", () => {
  it("reports pdf as a supported format", () => {
    expect(isFormatSupported("pdf")).toBe(true);
  });

  it("renders a Typst PDF/A-3 hybrid (base64) for format: 'pdf'", async () => {
    const service = new DocumentService();
    const result = await service.generate({ type: FAKE_TYPE, refId: "x", format: "pdf" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const r = result.value;
      expect(r.format).toBe("pdf");
      expect(r.documentName).toBe("Test PDF Document");
      const pdf = Buffer.from(r.content, "base64");
      expect(pdfHeader(pdf)).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(0);

      const text = pdf.toString("latin1");
      // PDF/A-3 hybrid contract: embedded source + AF + XMP pdfaid + OutputIntent
      expect(text).toContain("/EmbeddedFile");
      expect(text).toContain("/AF");
      expect(text).toContain("pdfaid:part");
      expect(text).toContain(">3<");
      expect(text).toContain("OutputIntent");
      // No signer configured in this test → left unsigned (NoOp default).
      expect(text).not.toContain("/Sig");
    }
  }, 120_000);

  it("applies the configured signer to the wrapped PDF/A-3 buffer", async () => {
    const service = new DocumentService();
    let sealed = false;
    service.useSigner({
      name: "marker",
      async sign(input) {
        sealed = true;
        return Buffer.concat([Buffer.from(input), Buffer.from("SEALED-BY-" + this.name)]);
      },
    });
    const result = await service.generate({ type: FAKE_TYPE, refId: "x", format: "pdf" });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const pdf = Buffer.from(result.value.content, "base64");
      expect(sealed).toBe(true);
      expect(pdf.toString("latin1")).toContain("SEALED-BY-marker");
    }
  }, 120_000);

  it("passes the model to Typst via JSON in sys.inputs", async () => {
    const pdf = await renderTypst({
      template: `#let d = json.decode(sys.inputs.at("model", default: "{}"))\n= #d.at("name", default: "?")`,
      inputs: { model: JSON.stringify({ name: "Фарма Козјак" }) },
    });
    expect(pdfHeader(pdf)).toBe("%PDF-");
  }, 120_000);

  it("verify reads back PAdES-LTV facts from a signed document", async () => {
    const service = new DocumentService();
    service.useSigner(
      new Pkcs12Signer({ p12: makeP12("pw"), passphrase: "pw", timestampAuthority: new FakeTimestampAuthority() }),
    );
    const result = await service.verify({ type: FAKE_TYPE, refId: "x" });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const v = result.value;
      expect(v.valid).toBe(true);
      expect(v.hasTimestamp).toBe(true);
      expect(v.signerSubject).toContain("Rocky Test Signer");
      expect(v.signedAt).not.toBeNull();
      expect(v.documentType).toBe(FAKE_TYPE);
    }
  }, 120_000);

  it("verify reports invalid when the document is unsigned", async () => {
    const service = new DocumentService(); // NoOpSigner default
    const result = await service.verify({ type: FAKE_TYPE, refId: "x" });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.valid).toBe(false);
      expect(result.value.message).toContain("No /Sig CMS");
    }
  }, 120_000);
});
