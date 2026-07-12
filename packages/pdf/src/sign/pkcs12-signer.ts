import type { PdfSigner } from "./pdf-signer.js";
import { buildPadesCms, embedCms, prepareSignature, type RevocationData } from "./pades-cms.js";
import type { TimestampAuthority } from "./timestamp.js";

export interface Pkcs12SignerOptions {
  /** PKCS#12 archive (cert + key) as raw bytes. */
  p12: Uint8Array | Buffer;
  /** PFX passphrase (defaults to empty string). */
  passphrase?: string;
  /**
   * RFC 3161 Time-Stamp Authority. When provided, the signature is
   * timestamped (PAdES-LTV anchor). `FakeTimestampAuthority` covers local/dev;
   * `HttpTsaClient` covers production.
   */
  timestampAuthority?: TimestampAuthority;
  /** Archived OCSP/CRL to embed as `revocationInfoArchival` (full LTV). */
  revocation?: RevocationData;
  /** Hex length reserved for the CMS placeholder. Enlarge if CMS overflows. */
  signatureLength?: number;
}

/**
 * Pkcs12Signer — local/dev PAdES seal using a PKCS#12 keystore.
 *
 * Produces a detached PAdES-BES/EPES CMS with the authenticated attributes
 * (content-type, message-digest, signing-time), then — optionally — appends
 * the RFC 3161 signature timestamp and archived revocation data as unsigned
 * attributes (PAdES-LTV), and embeds the CMS into the PDF `/Sig` dictionary
 * via the `/ByteRange` placeholder. The CMS is built with forge; the unsigned
 * attributes are injected by ASN.1 surgery (forge cannot emit them).
 *
 * For production, prefer `HsmSigner` so the key never leaves the HSM.
 */
export class Pkcs12Signer implements PdfSigner {
  readonly name = "pkcs12";
  private readonly p12: Buffer;
  private readonly passphrase: string;
  private readonly timestampAuthority?: TimestampAuthority;
  private readonly revocation?: RevocationData;
  private readonly signatureLength: number;

  constructor(options: Pkcs12SignerOptions) {
    this.p12 = Buffer.from(options.p12);
    this.passphrase = options.passphrase ?? "";
    this.timestampAuthority = options.timestampAuthority;
    this.revocation = options.revocation;
    this.signatureLength = options.signatureLength ?? 16384;
  }

  async sign(pdf: Uint8Array): Promise<Uint8Array> {
    const { pdf: withPlaceholder, signedContent } = prepareSignature(
      Buffer.from(pdf),
      this.signatureLength,
    );
    const cms = await buildPadesCms({
      p12: this.p12,
      passphrase: this.passphrase,
      content: signedContent,
      timestampAuthority: this.timestampAuthority,
      revocation: this.revocation,
    });
    return new Uint8Array(embedCms(withPlaceholder, cms));
  }
}
