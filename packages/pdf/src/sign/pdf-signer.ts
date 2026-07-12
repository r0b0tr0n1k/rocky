/**
 * PdfSigner — the universal sign stage (ADR-0082 §2).
 *
 * Every emitted PDF/A-3 is sealed with a PAdES signature bound to Rocky's
 * certificate. The private key is **never** resident on the PDF-generation
 * server: the `Pkcs12Signer` (dev/self-signed) holds the key locally, while
 * the `HsmSigner` delegates the entire signing operation to an air-gapped HSM
 * appliance over HTTP — the server only ever sees the signed bytes back.
 */
export interface PdfSigner {
  /** Human-readable signer identifier (for logs / diagnostics). */
  readonly name: string;
  /** Seal a PDF/A-3 buffer, returning the signed buffer. */
  sign(pdf: Uint8Array): Promise<Uint8Array>;
}
