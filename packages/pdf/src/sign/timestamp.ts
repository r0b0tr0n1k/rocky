import { randomBytes } from "node:crypto";
import forge from "node-forge";

/**
 * RFC 3161 Time-Stamp Authority abstraction (ADR-0082 §3 — PAdES-LTV).
 *
 * The signature timestamp proves *when* the document was signed, independent
 * of the signer's local clock, and is the anchor that makes a PAdES signature
 * long-term-verifiable (LTV) once revocation data (OCSP/CRL) is archived
 * alongside it.
 *
 * Production: `HttpTsaClient` calls a real RFC 3161 TSA (SSRF-guarded).
 * Local/dev + tests: `FakeTimestampAuthority` mints a self-signed token with
 * forge so the full unsigned-attribute pipeline is exercised without a network.
 */

export type DigestName = "sha1" | "sha256" | "sha512";

// @types/node-forge types these OIDs as `string | undefined`; they are always
// present at runtime. Narrow to `string` for use in attribute maps.
const DIGEST_OID: Record<DigestName, string> = {
  sha1: forge.pki.oids.sha1 as string,
  sha256: forge.pki.oids.sha256 as string,
  sha512: forge.pki.oids.sha512 as string,
};

const TST_INFO_OID = "1.2.840.113549.1.9.16.1.4";
export const SIGNATURE_TIMESTAMP_OID = "1.2.840.113549.1.9.16.2.14";

/** Encode a Uint8Array as the binary string forge ASN.1 primitives expect. */
function bytesToBinary(value: Uint8Array): string {
  return Buffer.from(value as Buffer).toString("binary");
}

/** @types/node-forge mistypes `hexToBytes` as `void`; it returns a byte string. */
function hexToByteString(hex: string): string {
  return forge.util.hexToBytes(hex) as unknown as string;
}

/** @types/node-forge rejects `Date` for `signingTime`; forge accepts it. */
function dateAttr(value: Date): string {
  return value as unknown as string;
}

/** @types/node-forge types OIDs as `string | undefined`. */
function oidAttr(oid: string): string {
  return oid as string;
}

export interface TimestampAuthority {
  /**
   * Return the DER-encoded RFC 3161 TimeStampToken that covers `imprint`
   * (the hash — usually SHA-256 — of the signer's signature value).
   */
  timestamp(imprint: Uint8Array, digest: DigestName): Promise<Uint8Array>;
}

/** Local/dev TSA stub: mints a self-signed TimeStampToken with forge. */
export class FakeTimestampAuthority implements TimestampAuthority {
  private keypair?: { key: forge.pki.rsa.PrivateKey; cert: forge.pki.Certificate };

  private ensureKeypair(): { key: forge.pki.rsa.PrivateKey; cert: forge.pki.Certificate } {
    if (!this.keypair) {
      const kp = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      const cert = forge.pki.createCertificate();
      cert.publicKey = kp.publicKey;
      cert.serialNumber = "01";
      cert.validity.notBefore = new Date(2024, 0, 1);
      cert.validity.notAfter = new Date(2034, 0, 1);
      const attrs = [{ name: "commonName", value: "Rocky Test TSA" }];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.sign(kp.privateKey, forge.md.sha256.create());
      this.keypair = { key: kp.privateKey, cert };
    }
    return this.keypair;
  }

  async timestamp(imprint: Uint8Array, digest: DigestName): Promise<Uint8Array> {
    const { key, cert } = this.ensureKeypair();

    const tstInfo = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SEQUENCE,
      true,
      [
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false, hexToByteString("01")),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OID, false, "1.2.3.4"),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
          forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
            forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OID, false, DIGEST_OID[digest]),
            forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.NULL, false, ""),
          ]),
          forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OCTETSTRING, false, bytesToBinary(imprint)),
        ]),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false, hexToByteString(randomBytes(16).toString("hex"))),
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.GENERALIZEDTIME,
          false,
          new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z"),
        ),
      ],
    );

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(forge.asn1.toDer(tstInfo).getBytes());
    p7.addCertificate(cert);
    p7.addSigner({
      key,
      certificate: cert,
      digestAlgorithm: oidAttr(DIGEST_OID.sha256),
      authenticatedAttributes: [
        { type: oidAttr(forge.pki.oids.contentType as string), value: TST_INFO_OID },
        { type: oidAttr(forge.pki.oids.messageDigest as string) },
        { type: oidAttr(forge.pki.oids.signingTime as string), value: dateAttr(new Date()) },
      ],
    });
    p7.sign({ detached: false });

    return Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");
  }
}

/** Validate + normalize an outbound TSA URL. https-only; host allowlist optional. */
function assertSafeTsaUrl(url: string, trustedHosts?: string[]): URL {
  if (!url.startsWith("https://")) {
    throw new Error(`TSA URL must be https:// (refused: ${url})`);
  }
  const parsed = (() => {
    try {
      return new URL(url);
    } catch {
      throw new Error(`Invalid TSA URL: ${url}`);
    }
  })();
  if (trustedHosts?.length && !trustedHosts.includes(parsed.host)) {
    throw new Error(`TSA host ${parsed.host} not in trustedHosts`);
  }
  return parsed;
}

/**
 * Real RFC 3161 TSA over HTTPS. SSRF-guarded exactly like `HsmSigner`: only
 * `https:` URLs, and — when `trustedHosts` is set — the host must match.
 */
export class HttpTsaClient implements TimestampAuthority {
  private readonly endpoint: URL;

  constructor(url: string, trustedHosts?: string[]) {
    this.endpoint = assertSafeTsaUrl(url, trustedHosts);
  }

  async timestamp(imprint: Uint8Array, digest: DigestName): Promise<Uint8Array> {
    const req = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SEQUENCE,
      true,
      [
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false, hexToByteString("01")),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
          forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
            forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OID, false, DIGEST_OID[digest]),
            forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.NULL, false, ""),
          ]),
          forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OCTETSTRING, false, bytesToBinary(imprint)),
        ]),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.BOOLEAN, false, ""),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false, hexToByteString("01")),
      ],
    );
    const reqDer = Buffer.from(forge.asn1.toDer(req).getBytes(), "binary");

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/timestamp-query",
        "Content-Length": String(reqDer.length),
      },
      body: reqDer,
    });
    if (!res.ok) throw new Error(`TSA responded ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}
