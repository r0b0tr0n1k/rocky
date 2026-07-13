/**
 * CredentialService — Offline-verifiable signed-QR credentials (ADR-0084).
 *
 * Sibling of `PdfSigner` (ADR-0082): same Rocky trust root, but the QR is a
 * *self-contained* payload (canonical CBOR + Ed25519 signature) verifiable
 * offline against the pinned public key — no server call. The verifier runs
 * unmodified in `@rocky/mob` (pure JS, no native deps).
 *
 * Lifecycle:
 *   - bootstrap calls `useKeyConfig(...)` with the Ed25519 key + pinned pubkey
 *     (HSM-exported / dev key — see apps/api/src/pdf/signer-bootstrap.ts).
 *   - `generate({ type, refId })` asks the template for a `CredentialSeed`,
 *     wraps it into a `CredentialPayload` (iss/sub/typ/iat/exp/kid + seed),
 *     signs it, and returns the envelope string + a QR data URL / PNG.
 *   - `verify(envelope)` checks the Ed25519 signature against the pinned key.
 *     `valid` means the signature is intact — callers MUST still consult the
 *     credential status list (ADR-0084 §4) to decide revoked/expired.
 */

import { Injectable } from "@nestjs/common";
import { err, ok, type Result } from "neverthrow";
import { DocumentRegistry } from "../engine/document-registry.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";
import {
  signCredential,
  verifyCredential,
  type CredentialPayload,
  type CredentialVerifyResult,
} from "../credential/credential.js";
import { generateQrDataUrl, generateQrPng } from "../engine/qr.js";

/** Ear-tag-class credentials are long-lived; ~10y. Distinct from status-list staleness (ADR-0084 §4). */
const DEFAULT_EXP_DAYS = 3650;

/** Everything needed to sign + verify credentials, supplied at bootstrap. */
export interface CredentialKeyConfig {
  privateKey: Uint8Array;
  kid: string;
  iss: string;
  pinnedPublicKey: Uint8Array;
}

/** Output of `generate` — the wire envelope plus printable/embeddable forms. */
export interface CredentialOutput {
  envelope: string;
  qrDataUrl: string;
  qrPng: Uint8Array;
  payload: CredentialPayload;
}

/**
 * Router-facing credential response. `qrPng` is kept server-side (used to stamp
 * the on-document QR) and is intentionally NOT serialized over tRPC, so the
 * response type omits it (ADR-0084 §7/§8).
 */
export interface CredentialResponseView {
  envelope: string;
  qrDataUrl: string;
  payload: CredentialPayload;
}

/** Verify result surfaced to clients (ADR-0084 §4 note attached). */
export interface CredentialVerifyView extends CredentialVerifyResult {
  message: string;
}

@Injectable()
export class CredentialService {
  private privateKey: Uint8Array | null = null;
  private kid = "rocky-dev";
  private iss = "rocky:cattle";
  private pinnedPublicKey: Uint8Array | null = null;

  /** Apply the configured signing key + pinned verify key (bootstrap). */
  useKeyConfig(cfg: CredentialKeyConfig): void {
    this.privateKey = cfg.privateKey;
    this.kid = cfg.kid;
    this.iss = cfg.iss;
    this.pinnedPublicKey = cfg.pinnedPublicKey;
  }

  /** True when a signing key has been configured (credentials can be produced). */
  hasSigningKey(): boolean {
    return this.privateKey !== null;
  }

  /**
   * Build + sign a credential for an entity.
   */
  async generate(input: { type: string; refId: string }): Promise<Result<CredentialOutput, DocumentError>> {
    if (!this.privateKey) {
      return err(
        documentErr(DOCUMENT_ERRORS.UNSUPPORTED_FORMAT, {
          format: "credential",
          supportedFormats: ["configure ROCKY_CRED_KEY / dev cred key"],
        }),
      );
    }

    const registry = DocumentRegistry.getInstance();
    const templateResult = registry.get(input.type);
    if (templateResult.isErr()) return err(templateResult.error);

    const template = templateResult.value;
    if (typeof template.mapToCredential !== "function") {
      return err(
        documentErr(DOCUMENT_ERRORS.TEMPLATE_NOT_FOUND, {
          type: input.type,
          reason: "template does not support credentials",
        }),
      );
    }

    const seedResult = await template.mapToCredential(input.refId);
    if (seedResult.isErr()) return err(seedResult.error);

    const nowSec = Math.floor(Date.now() / 1000);
    const payload: CredentialPayload = {
      iss: this.iss,
      sub: seedResult.value.sub,
      typ: input.type,
      iat: nowSec,
      exp: nowSec + DEFAULT_EXP_DAYS * 86_400,
      kid: this.kid,
      farmId: seedResult.value.farmId,
      species: seedResult.value.species,
      facilityId: seedResult.value.facilityId,
      operatorId: seedResult.value.operatorId,
    };

    const envelope = signCredential(payload, this.privateKey);
    const [qrDataUrl, qrPng] = await Promise.all([
      generateQrDataUrl(envelope, { width: 360, errorCorrectionLevel: "M" }),
      generateQrPng(envelope, { width: 360, errorCorrectionLevel: "M" }),
    ]);

    return ok({ envelope, qrDataUrl, qrPng, payload });
  }

  /**
   * Verify a credential envelope against the pinned public key. Throws if no
   * pinned key is configured (bootstrap must call `useKeyConfig`).
   */
  verify(envelope: string): CredentialVerifyView {
    if (!this.pinnedPublicKey) {
      throw documentErr(DOCUMENT_ERRORS.UNSUPPORTED_FORMAT, {
        format: "credential-verify",
        supportedFormats: ["configure ROCKY_CRED_PUBKEY"],
      });
    }
    const result = verifyCredential(envelope, this.pinnedPublicKey);
    const message = result.valid
      ? "Signature intact. Still verify the credential status list (ADR-0084 §4) — signature validity ≠ unrevoked."
      : "Signature invalid — credential rejected.";
    return { ...result, message };
  }
}
