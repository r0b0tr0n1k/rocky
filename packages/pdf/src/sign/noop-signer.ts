import type { PdfSigner } from "./pdf-signer.js";

/**
 * NoOpSigner — returns the buffer unchanged. Used when signing is disabled
 * (e.g. local development without a configured key, or deterministic tests).
 * Never used for production egress (ADR-0082 forbids unsigned artifacts).
 */
export class NoOpSigner implements PdfSigner {
  readonly name = "noop";
  async sign(pdf: Uint8Array): Promise<Uint8Array> {
    return pdf;
  }
}
