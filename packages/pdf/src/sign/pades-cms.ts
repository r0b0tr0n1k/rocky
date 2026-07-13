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
  // Anchor on the `/Contents` that belongs to the `/Sig` annotation — i.e. the
  // one that follows `/ByteRange`. Wrapped PDFs can contain other `/Contents`
  // strings (font/metadata), so a blind `indexOf("/Contents ")` would grab the
  // wrong one.
  const latin1 = pdf.toString("latin1");
  const brMatch = latin1.match(/\/ByteRange\s*\[[^\]]+\]/);
  const searchFrom = brMatch ? brMatch.index! + brMatch[0].length : 0;
  const contentsPos = latin1.indexOf("/Contents ", searchFrom);
  if (contentsPos < 0) throw new Error("No /Contents found after /ByteRange");
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

// ── Signature extraction (powers `document.verify`) ─────────────────────────

/**
 * Structured read-out of a PAdES signature embedded in a PDF, used by the
 * `document.verify` procedure to prove a document is sealed (and LTV'd)
 * without re-implementing a full CMS validator.
 */
export interface SignatureInfo {
  /** Structural parse succeeded: CMS parsed, ≥1 signer, signing cert present. */
  valid: boolean;
  signerSubject: string | null;
  signerIssuer: string | null;
  /** Signing cert serial number (hex). */
  serialNumber: string | null;
  /** Digest algorithm, e.g. "sha256". */
  algorithm: string | null;
  /** ISO-8601 signing time (from signed attributes), if present. */
  signedAt: string | null;
  /** Whether a signature timestamp token (PAdES-LTV) is present. */
  hasTimestamp: boolean;
  /** ISO-8601 timestamp time (from the RFC 3161 token), if extractable. */
  timestampedAt: string | null;
  /** Whether archived revocation data (OCSP/CRL) is present. */
  hasRevocation: boolean;
  /** Human-readable status / error message. */
  message: string;
}

const SIGNING_TIME_OID = "1.2.840.113549.1.9.5";
const DIGEST_OIDS: Record<string, string> = {
  "2.16.840.1.101.3.4.2.1": "sha256",
  "2.16.840.1.101.3.4.2.2": "sha384",
  "2.16.840.1.101.3.4.2.3": "sha512",
  "1.3.14.3.2.26": "sha1",
};

/** Decode a DER OBJECT IDENTIFIER content (raw bytes) to a dotted string. */
function decodeOid(contentBytes: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < contentBytes.length; i++) bytes.push(contentBytes.charCodeAt(i) & 0xff);
  if (bytes.length === 0) return "";
  const first = bytes[0]!;
  const arcs = [Math.floor(first / 40), first % 40];
  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    const b = bytes[i]!;
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) {
      arcs.push(value);
      value = 0;
    }
  }
  return arcs.join(".");
}

/**
 * Normalize an ASN.1 OID node `.value` to a dotted string. forge yields a
 * dotted string for nodes parsed via `fromDer`, but rawCapture (and nodes
 * re-derived from it) keep the DER-encoded bytes — `decodeOid` handles both.
 */
function oidString(v: unknown): string {
  if (typeof v !== "string") return "";
  if (v.includes(".")) return v;
  return decodeOid(v);
}

/** Decode an INTEGER node `.value` (bytes or BigInteger) to a hex string. */
function intToHex(node: any): string | null {
  const v = node?.value;
  if (v == null) return null;
  if (typeof v === "string") {
    let hex = "";
    for (let i = 0; i < v.length; i++) hex += (v.charCodeAt(i) & 0xff).toString(16).padStart(2, "0");
    return hex;
  }
  if (typeof v.toString === "function") return v.toString(16);
  return String(v);
}

/** Locate the `/Contents <hex>` CMS that follows the `/ByteRange`. */
function findCmsHex(pdf: Uint8Array): string | null {
  const s = Buffer.from(pdf).toString("latin1");
  const m = s.match(/\/ByteRange\s*\[[^\]]+\][\s\S]*?\/Contents\s*<([0-9A-Fa-f]+)>/);
  return m ? m[1]! : null;
}

/**
 * The `/Contents` slot is zero-padded to the placeholder length, so the hex
 * string carries trailing `0x00` bytes after the real DER. Trim them so forge
 * doesn't reject the CMS with "unparsed DER bytes remain".
 */
function trimTrailingZeros(buf: Buffer): Buffer {
  let end = buf.length;
  while (end > 2 && buf[end - 1] === 0) end--;
  return buf.subarray(0, end);
}

function digestOidOf(node: any): string | null {
  if (!node || !Array.isArray(node.value)) return null;
  const oid = node.value.find((c: any) => c.type === forge.asn1.Type.OID);
  return oid ? oidString(oid.value) : null;
}

/**
 * Walk a SignerInfo ASN.1 node (forge exposes `rawCapture.signerInfos` as raw
 * nodes, not parsed objects) to recover serial, digest algorithm, and the
 * signing-time from the authenticated attributes.
 */
function walkSignerInfo(si: any): {
  serial: string | null;
  algorithm: string | null;
  signedAt: string | null;
} {
  const kids = Array.isArray(si?.value) ? si.value : [];
  let serial: string | null = null;
  let algorithm: string | null = null;
  let signedAt: string | null = null;
  try {
    const sid = kids[1]; // IssuerAndSerialNumber SEQUENCE { issuer, serial }
    if (sid && sid.type === forge.asn1.Type.SEQUENCE) {
      const serialNode = sid.value[1];
      if (serialNode) serial = intToHex(serialNode);
    }
  } catch {
    /* ignore */
  }
  try {
    const daOid = digestOidOf(kids[2]); // digestAlgorithm AlgorithmIdentifier
    algorithm = daOid ? (DIGEST_OIDS[daOid] ?? daOid) : null;
  } catch {
    /* ignore */
  }
  try {
    const signedAttrs = kids.find(
      (c: any) => c.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && c.type === 0,
    );
    if (signedAttrs) {
      const st = findAttr(signedAttrs, SIGNING_TIME_OID);
      if (st) signedAt = timeFromAttr(st);
    }
  } catch {
    /* ignore */
  }
  return { serial, algorithm, signedAt };
}

/** Recursively find a SEQUENCE whose first child is the target OID. */
function findAttr(node: any, oid: string): any {
  if (!node || typeof node !== "object" || typeof node.type === "undefined") return null;
  if (node.type === forge.asn1.Type.SEQUENCE && Array.isArray(node.value)) {
    const first = node.value[0];
    if (first && first.type === forge.asn1.Type.OID && oidString(first.value) === oid) return node;
    for (const c of node.value) {
      const r = findAttr(c, oid);
      if (r) return r;
    }
  } else if (Array.isArray(node.value)) {
    for (const c of node.value) {
      const r = findAttr(c, oid);
      if (r) return r;
    }
  }
  return null;
}

function toIso(v: unknown): string | null {
  try {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") {
      // forge yields UTCTime ("YYMMDDHHMMSSZ") / GeneralizedTime
      // ("YYYYMMDDHHMMSSZ") as raw strings in rawCapture — `new Date()`
      // cannot parse those, so decode them explicitly.
      let s = v;
      if (s.endsWith("Z")) s = s.slice(0, -1);
      let year: number;
      let rest: string;
      if (/^\d{4}/.test(s.slice(0, 4))) {
        year = Number.parseInt(s.slice(0, 4), 10);
        rest = s.slice(4);
      } else {
        const yy = Number.parseInt(s.slice(0, 2), 10);
        year = yy < 50 ? 2000 + yy : 1900 + yy;
        rest = s.slice(2);
      }
      const mo = Number.parseInt(rest.slice(0, 2), 10);
      const da = Number.parseInt(rest.slice(2, 4), 10);
      const hh = Number.parseInt(rest.slice(4, 6), 10);
      const mi = Number.parseInt(rest.slice(6, 8), 10);
      const ss = Number.parseInt(rest.slice(8, 10) || "0", 10);
      const d = new Date(Date.UTC(year, mo - 1, da, hh, mi, ss));
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString();
    }
    return new Date(String(v)).toISOString();
  } catch {
    return null;
  }
}

function attrValue(
  attrs: Array<{ shortName?: string; name?: string; value: string }> | undefined,
  key: string,
): string | null {
  const a = attrs?.find((x) => x.shortName === key || x.name === key);
  return a ? a.value : null;
}

/** First UTCTime/GeneralizedTime encountered in the tree (used for genTime). */
function firstTime(node: any): string | null {
  if (!node || typeof node !== "object" || typeof node.type === "undefined") return null;
  if (node.type === forge.asn1.Type.UTCTIME || node.type === forge.asn1.Type.GENERALIZEDTIME) {
    return toIso(node.value);
  }
  if (Array.isArray(node.value)) {
    for (const c of node.value) {
      const r = firstTime(c);
      if (r) return r;
    }
  }
  return null;
}

/** Descend a TimeStampToken ContentInfo → TSTInfo to read genTime. */
function tstInfoGenTime(tokenCi: any): string | null {
  try {
    // ContentInfo -> [0] EXPLICIT SignedData -> encapContentInfo -> [0] eContent (OCTET STRING) -> TSTInfo
    const signedData = tokenCi.value[1].value[0];
    const encap = signedData.value[2];
    const eContentCtx = encap.value[1]; // [0] EXPLICIT eContent
    const octet = eContentCtx.value[0]; // OCTET STRING node
    const tstAsn1 = forge.asn1.fromDer(octet.value);
    return firstTime(tstAsn1);
  } catch {
    return null;
  }
}

function timeFromAttr(attrNode: any): string | null {
  try {
    const timeNode = attrNode.value[1].value[0];
    return toIso(timeNode.value);
  } catch {
    return null;
  }
}

/**
 * Extract PAdES signature facts from a signed PDF. Never throws — on any
 * failure it returns `valid: false` with a descriptive `message` so the verify
 * endpoint can report a clean negative.
 */
export function extractSignature(pdf: Uint8Array): SignatureInfo {
  const info: SignatureInfo = {
    valid: false,
    signerSubject: null,
    signerIssuer: null,
    serialNumber: null,
    algorithm: null,
    signedAt: null,
    hasTimestamp: false,
    timestampedAt: null,
    hasRevocation: false,
    message: "",
  };
  try {
    const cmsHex = findCmsHex(pdf);
    if (!cmsHex) {
      info.message = "No /Sig CMS found in PDF";
      return info;
    }
    const ci = forge.asn1.fromDer(trimTrailingZeros(Buffer.from(cmsHex, "hex")).toString("binary"));
    let p7: any = null;
    try {
      p7 = forge.pkcs7.messageFromAsn1(ci);
    } catch {
      p7 = null;
    }

    if (p7 && p7.rawCapture?.signerInfos?.length) {
      const siRaw = p7.rawCapture.signerInfos[0];
      // Re-parse the SignerInfo so OID values become dotted strings and the
      // serial a BigInteger (forge's rawCapture keeps them as raw DER bytes).
      const siParsed = forge.asn1.fromDer(forge.asn1.toDer(siRaw).getBytes());
      const cert = p7.certificates?.[0];
      if (cert) {
        info.signerSubject = attrValue(cert.subject?.attributes, "CN");
        info.signerIssuer = attrValue(cert.issuer?.attributes, "CN");
      }
      const w = walkSignerInfo(siParsed);
      info.serialNumber = w.serial ?? (cert ? String(cert.serialNumber) : null);
      info.algorithm = w.algorithm ?? "";
      info.signedAt = w.signedAt;
      // Timestamp + revocation detection via manual ASN.1 walk — forge cannot
      // be trusted to surface the [1] unsignedAttrs SET, so we walk the whole
      // ContentInfo tree for the LTV OIDs regardless of forge's rawCapture.
      const ts = findAttr(ci, SIGNATURE_TIMESTAMP_OID);
      if (ts) {
        info.hasTimestamp = true;
        const gt = tstInfoGenTime(ts.value[1].value[0]);
        if (gt) info.timestampedAt = gt;
      }
      const rev = findAttr(ci, REVOCATION_INFO_ARCHIVAL_OID);
      if (rev) info.hasRevocation = true;
      info.valid = !!(cert && info.serialNumber);
      info.message = "CMS parsed";
    } else {
      // forge couldn't parse the detached CMS — walk the ASN.1 manually.
      const ts = findAttr(ci, SIGNATURE_TIMESTAMP_OID);
      if (ts) {
        info.hasTimestamp = true;
        const gt = tstInfoGenTime(ts.value[1].value[0]);
        if (gt) info.timestampedAt = gt;
      }
      const rev = findAttr(ci, REVOCATION_INFO_ARCHIVAL_OID);
      if (rev) info.hasRevocation = true;
      info.message = "forge parse failed; partial extraction";
    }
  } catch (e) {
    info.message = e instanceof Error ? e.message : String(e);
  }
  return info;
}
