import forge from "node-forge";
import { findByteRange, plainAddPlaceholder } from "node-signpdf";
import { SIGNATURE_TIMESTAMP_OID, type TimestampAuthority } from "./timestamp.js";

/**
 * PAdES CMS construction + PDF byte-range embedding (ADR-0082 §3).
 *
 * forge's `pkcs7` can *sign* but cannot emit the `unsignedAttrs` SET that
 * carries the RFC 3161 signature timestamp and archived revocation data — the
 * core of PAdES-LTV. So we build the detached PAdES CMS with forge (which
 * correctly emits the authenticated/signed attributes), then perform targeted
 * ASN.1 surgery to append the unsigned attributes, and finally embed the CMS
 * into the PDF via `node-signpdf`'s placeholder + byte-range math (bypassing
 * `node-signpdf`'s own `sign`, which would build its own CMS).
 */

const A = forge.asn1;
const REVOCATION_INFO_ARCHIVAL_OID = "1.2.840.113549.1.9.16.2.24";

export interface RevocationData {
  /** DER-encoded OCSP responses. */
  ocsp?: Uint8Array[];
  /** DER-encoded CRLs. */
  crl?: Uint8Array[];
}

export interface PadesBuildOptions {
  /** PKCS#12 (p12) container (DER) holding the signing key + cert chain. */
  p12: Buffer;
  passphrase: string;
  /** The bytes the signature mathematically covers (the PDF minus /Contents). */
  content: Buffer;
  /** When set, a signature timestamp is requested and archived (PAdES-LTV). */
  timestampAuthority?: TimestampAuthority;
  /** When set, OCSP/CRL are archived as `revocationInfoArchival` (full LTV). */
  revocation?: RevocationData;
}

/** @types/node-forge types OIDs as `string | undefined`. */
function oid(value: string | undefined): string {
  return value as string;
}

/** @types/node-forge rejects `Date` for `signingTime`; forge accepts it. */
function dateAttr(value: Date): string {
  return value as unknown as string;
}

function binaryString(value: Uint8Array): string {
  return Buffer.from(value as Buffer).toString("binary");
}

/**
 * Build a detached PAdES CMS with optional timestamp + revocation unsigned
 * attributes. Returns the DER-encoded SignedData (ContentInfo).
 */
export async function buildPadesCms(opts: PadesBuildOptions): Promise<Buffer> {
  const p12Asn1 = A.fromDer(opts.p12.toString("binary"));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, opts.passphrase);

  const certBags =
    p12.getBags({ bagType: oid(forge.pki.oids.certBag) })[oid(forge.pki.oids.certBag)] ?? [];
  const keyBags =
    p12.getBags({ bagType: oid(forge.pki.oids.pkcs8ShroudedKeyBag) })[
      oid(forge.pki.oids.pkcs8ShroudedKeyBag)
    ] ?? [];

  const cert = certBags[0]?.cert;
  const key = keyBags[0]?.key;
  if (!cert || !key) throw new Error("P12 missing certificate or private key");
  const caCerts = certBags.slice(1).map((b) => b.cert).filter((c): c is forge.pki.Certificate => !!c);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(opts.content.toString("binary"));
  p7.addCertificate(cert);
  caCerts.forEach((c) => p7.addCertificate(c));
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: oid(forge.pki.oids.sha256),
    authenticatedAttributes: [
      { type: oid(forge.pki.oids.contentType), value: oid(forge.pki.oids.data) },
      { type: oid(forge.pki.oids.messageDigest) },
      { type: oid(forge.pki.oids.signingTime), value: dateAttr(new Date()) },
    ],
  });
  p7.sign({ detached: true });

  let cmsAsn1 = p7.toAsn1();

  // revocationInfoArchival: SET { SEQUENCE { OCTET STRING (ocsp/crl) ... } }
  const revocationDers = [...(opts.revocation?.ocsp ?? []), ...(opts.revocation?.crl ?? [])];
  if (revocationDers.length) {
    const revocationSeq = A.create(A.Class.UNIVERSAL, A.Type.SEQUENCE, true, revocationDers.map((d) =>
      A.create(A.Class.UNIVERSAL, A.Type.OCTETSTRING, false, binaryString(d)),
    ));
    cmsAsn1 = addUnsignedAttribute(cmsAsn1, REVOCATION_INFO_ARCHIVAL_OID, revocationSeq);
  }

  // signatureTimeStampToken: the DER TimeStampToken (a ContentInfo).
  if (opts.timestampAuthority) {
    const signers = p7 as unknown as { signers: Array<{ signature?: unknown }> };
    const sigVal = signers.signers[0]?.signature;
    if (!sigVal) throw new Error("CMS signer missing signature value");
    // forge stores the signature as a ByteBuffer OR a binary string depending
    // on version; normalize to the raw octets before hashing the imprint.
    const rawSig =
      typeof (sigVal as { getBytes?: () => string }).getBytes === "function"
        ? (sigVal as { getBytes: () => string }).getBytes()
        : String(sigVal);
    const imprint = forge.md
      .sha256
      .create()
      .update(rawSig)
      .digest()
      .getBytes();
    const token = await opts.timestampAuthority.timestamp(Buffer.from(imprint, "binary"), "sha256");
    const tokenAsn1 = A.fromDer(Buffer.from(token).toString("binary"));
    cmsAsn1 = addUnsignedAttribute(cmsAsn1, SIGNATURE_TIMESTAMP_OID, tokenAsn1);
  }

  return Buffer.from(A.toDer(cmsAsn1).getBytes(), "binary");
}

/**
 * Append an unsigned attribute to the first SignerInfo's `unauthenticatedAttributes`
 * ([1] IMPLICIT SET). forge never serializes this field, so we hand-build it.
 */
function children(node: forge.asn1.Asn1): forge.asn1.Asn1[] {
  return (node.value as forge.asn1.Asn1[]) ?? [];
}

/**
 * Append an unsigned attribute to the first SignerInfo's `unauthenticatedAttributes`
 * ([1] IMPLICIT SET). forge never serializes this field, so we hand-build it.
 */
function addUnsignedAttribute(cmsAsn1: forge.asn1.Asn1, attributeOid: string, value: forge.asn1.Asn1): forge.asn1.Asn1 {
  const explicit = children(cmsAsn1)[1]!;
  const signedData = children(explicit)[0]!;
  const signerInfos = children(signedData)[children(signedData).length - 1]!;
  const signerInfo = children(signerInfos)[0]!;

  const attribute = A.create(A.Class.UNIVERSAL, A.Type.SEQUENCE, true, [
    A.create(A.Class.UNIVERSAL, A.Type.OID, false, attributeOid),
    A.create(A.Class.UNIVERSAL, A.Type.SET, true, [value]),
  ]);
  children(signerInfo).push(A.create(A.Class.CONTEXT_SPECIFIC, 1, true, [attribute]));
  return cmsAsn1;
}

/**
 * Add a `node-signpdf` placeholder and compute the signed content (everything
 * except the `/Contents` slot). The returned `pdf` already has a correct
 * `/ByteRange`; only `/Contents` remains to be filled by `embedCms`.
 */
export function prepareSignature(
  pdfBuffer: Buffer,
  signatureLength = 16384,
): { pdf: Buffer; signedContent: Buffer } {
  const pdf = plainAddPlaceholder({ pdfBuffer, reason: "Rocky PAdES-LTV signature", signatureLength });
  const { byteRangePlaceholder } = findByteRange(pdf);
  const byteRangePos = pdf.indexOf(byteRangePlaceholder);
  const byteRangeEnd = byteRangePos + byteRangePlaceholder.length;
  const contentsTagPos = pdf.indexOf("/Contents ", byteRangeEnd);
  if (contentsTagPos < 0) throw new Error("No /Contents found after /ByteRange");
  const placeholderPos = pdf.indexOf("<", contentsTagPos);
  const placeholderEnd = pdf.indexOf(">", placeholderPos);
  const placeholderLengthWithBrackets = placeholderEnd + 1 - placeholderPos;

  const byteRange = [0, 0, 0, 0];
  byteRange[1] = placeholderPos;
  byteRange[2] = placeholderPos + placeholderLengthWithBrackets;
  byteRange[3] = pdf.length - byteRange[2];

  const actualByteRange = `/ByteRange [${byteRange.join(" ")}]`;
  if (actualByteRange.length > byteRangePlaceholder.length) {
    throw new Error("ByteRange placeholder too small");
  }
  const arPadded = actualByteRange + " ".repeat(byteRangePlaceholder.length - actualByteRange.length);
  const withByteRange = Buffer.concat([
    pdf.subarray(0, byteRangePos),
    Buffer.from(arPadded),
    pdf.subarray(byteRangeEnd),
  ]);

  const signedContent = Buffer.concat([
    withByteRange.subarray(0, byteRange[1]),
    withByteRange.subarray(byteRange[2], byteRange[2] + byteRange[3]),
  ]);
  return { pdf: withByteRange, signedContent };
}

/**
 * Fill the `/Contents` slot of a placeholder PDF with the CMS. The CMS hex must
 * fit the placeholder; if it does not, enlarge `signatureLength` in
 * `prepareSignature`.
 */
export function embedCms(pdf: Buffer, cms: Buffer): Buffer {
  const cmsHex = cms.toString("hex");
  const contentsPos = pdf.indexOf("/Contents ");
  const placeholderPos = pdf.indexOf("<", contentsPos);
  const placeholderEnd = pdf.indexOf(">", placeholderPos);
  const placeholderLength = placeholderEnd - placeholderPos - 1;

  if (cmsHex.length > placeholderLength) {
    throw new Error(`CMS (${cmsHex.length} hex) exceeds placeholder (${placeholderLength})`);
  }
  const sigHex = cmsHex + "0".repeat(placeholderLength - cmsHex.length);
  const newContents = `<${sigHex}>`;
  return Buffer.concat([
    pdf.subarray(0, placeholderPos),
    Buffer.from(newContents),
    pdf.subarray(placeholderEnd + 1),
  ]);
}
