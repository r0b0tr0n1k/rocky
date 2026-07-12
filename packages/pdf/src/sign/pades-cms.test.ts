import { PDFDocument } from "@cantoo/pdf-lib";
import forge from "node-forge";
import { describe, expect, it, vi } from "vitest";
import { buildPadesCms, embedCms, prepareSignature, type RevocationData } from "./pades-cms.js";
import {
  FakeTimestampAuthority,
  HttpTsaClient,
  SIGNATURE_TIMESTAMP_OID,
} from "./timestamp.js";
import { wrapPdfA3 } from "../engine/pdfa3.js";

const A = forge.asn1;
type Asn1 = forge.asn1.Asn1;
const REVOCATION_INFO_ARCHIVAL_OID = "1.2.840.113549.1.9.16.2.24";

function makeSelfSignedP12(password: string): Buffer {
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

const p12 = makeSelfSignedP12("password");

function children(node: Asn1): Asn1[] {
  return (node.value as Asn1[]) ?? [];
}

/** Walk the CMS to the first SignerInfo's `unauthenticatedAttributes` ([1]). */
function getUnsignedAttrs(cmsDer: Buffer): Asn1 | null {
  const ci = A.fromDer(cmsDer.toString("binary"));
  const signedData = children(children(ci)[1]!)[0]!;
  const signerInfos = children(signedData)[children(signedData).length - 1]!;
  const signerInfo = children(signerInfos)[0]!;
  const found = children(signerInfo).find(
    (n) => n.tagClass === A.Class.CONTEXT_SPECIFIC && n.type === 1,
  );
  return found ?? null;
}

function findAttribute(unsignedAttrs: Asn1, oid: string): Asn1 | null {
  for (const attr of children(unsignedAttrs)) {
    const oidNode = children(attr)[0];
    if (oidNode && (oidNode.value as string) === oid) return attr;
  }
  return null;
}

function extractCms(pdf: Uint8Array): Buffer {
  const text = new TextDecoder("latin1").decode(pdf);
  const m = text.match(/\/Contents\s*<([0-9A-Fa-f]+)>/);
  if (!m || !m[1]) throw new Error("no /Contents in signed PDF");
  // The /Contents slot is zero-padded to the placeholder length. Trim exactly
  // to the DER length so forge can parse without "unparsed bytes remain".
  const bytes = Buffer.from(m[1], "hex");
  let len = bytes[1] ?? 0;
  let header = 2;
  if (len & 0x80) {
    const num = len & 0x7f;
    len = 0;
    for (let i = 0; i < num; i++) len = (len << 8) | (bytes[header + i] ?? 0);
    header += num;
  }
  return bytes.subarray(0, header + len);
}

async function wrappedVisual(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return wrapPdfA3({
    pdf: await doc.save(),
    attachments: [{ filename: "x.yaml", buffer: new TextEncoder().encode("a: 1"), mimeType: "application/yaml" }],
    meta: { title: "T", subject: "S", documentId: "r1" },
  });
}

describe("FakeTimestampAuthority", () => {
  it("mints a DER TimeStampToken (ContentInfo -> signedData -> TSTInfo)", async () => {
    const tsa = new FakeTimestampAuthority();
    const token = await tsa.timestamp(Buffer.from("imprint-bytes"), "sha256");
    const ci = A.fromDer(Buffer.from(token).toString("binary"));
    // ContentInfo: [0] OID (signedData), [1] [0] EXPLICIT SignedData
    expect(forge.asn1.derToOid(children(ci)[0]!.value as string)).toBe(
      forge.pki.oids.signedData,
    );
    const sd = children(children(ci)[1]!)[0]!;
    // encapContentInfo is the 3rd child; its eContent OCTET STRING carries the TSTInfo.
    const encap = children(sd)[2]!;
    const eContent = children(encap)[1]!;
    expect(eContent.type === A.Type.OCTETSTRING || eContent.tagClass === A.Class.CONTEXT_SPECIFIC).toBe(
      true,
    );
    expect((eContent.value as string).length).toBeGreaterThan(0);
  });
});

describe("buildPadesCms + unsigned attributes (LTV)", () => {
  it("embeds the RFC 3161 signature timestamp when a TSA is configured", async () => {
    const { pdf, signedContent } = prepareSignature(Buffer.from(await wrappedVisual()), 32768);
    const cms = await buildPadesCms({
      p12,
      passphrase: "password",
      content: signedContent,
      timestampAuthority: new FakeTimestampAuthority(),
    });
    const parsed = extractCms(embedCms(pdf, cms));

    const unsignedAttrs = getUnsignedAttrs(parsed);
    expect(unsignedAttrs).not.toBeNull();
    const tsAttr = findAttribute(unsignedAttrs!, SIGNATURE_TIMESTAMP_OID);
    expect(tsAttr).not.toBeNull();
    // The attribute value is a TimeStampToken (ContentInfo) -> signedData.
    const token = children(children(tsAttr!)[1]!)[0]!;
    const tokenCi = A.fromDer(A.toDer(token).getBytes());
    expect(forge.asn1.derToOid(children(tokenCi)[0]!.value as string)).toBe(
      forge.pki.oids.signedData,
    );
  });

  it("embeds revocationInfoArchival when OCSP/CRL are supplied", async () => {
    const revocation: RevocationData = {
      ocsp: [new TextEncoder().encode("OCSP-DER-FAKE")],
      crl: [new TextEncoder().encode("CRL-DER-FAKE")],
    };
    const { pdf, signedContent } = prepareSignature(Buffer.from(await wrappedVisual()), 32768);
    const cms = await buildPadesCms({
      p12,
      passphrase: "password",
      content: signedContent,
      revocation,
    });
    const unsignedAttrs = getUnsignedAttrs(extractCms(embedCms(pdf, cms)));
    expect(unsignedAttrs).not.toBeNull();
    expect(findAttribute(unsignedAttrs!, REVOCATION_INFO_ARCHIVAL_OID)).not.toBeNull();
  });

  it("omits unsigned attributes when neither TSA nor revocation is set (BES)", async () => {
    const { pdf, signedContent } = prepareSignature(Buffer.from(await wrappedVisual()), 32768);
    const cms = await buildPadesCms({ p12, passphrase: "password", content: signedContent });
    expect(getUnsignedAttrs(extractCms(embedCms(pdf, cms)))).toBeNull();
  });
});

describe("HttpTsaClient", () => {
  it("refuses non-https and untrusted hosts", () => {
    expect(() => new HttpTsaClient("http://tsa.local/")).toThrow();
    expect(() => new HttpTsaClient("https://tsa.local/", ["tsa.rocky.mk"])).toThrow();
  });

  it("builds an RFC 3161 request and returns the token from the TSA", async () => {
    let sentBody = Buffer.alloc(0);
    const fetchMock = (async (_url: any, init: any) => {
      sentBody = Buffer.from(init.body as Buffer);
      const tsa = new FakeTimestampAuthority();
      const token = await tsa.timestamp(Buffer.from("x"), "sha256");
      return new Response(Buffer.from(token), { status: 200 });
    }) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);
    try {
      const client = new HttpTsaClient("https://tsa.rocky.mk/", ["tsa.rocky.mk"]);
      const out = await client.timestamp(Buffer.from("imprint"), "sha256");
      expect(out.length).toBeGreaterThan(0);
      expect(sentBody.length).toBeGreaterThan(0); // a TimeStampReq was POSTed
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
