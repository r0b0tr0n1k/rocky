import { readFileSync } from "node:fs";
import {
  HsmSigner,
  type HsmSignerOptions,
  HttpTsaClient,
  NoOpSigner,
  Pkcs12Signer,
  type Pkcs12SignerOptions,
  type PdfSigner,
  type CredentialKeyConfig,
} from "@rocky/pdf/index.js";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Build the document signer from environment configuration (ADR-0082 §2).
 *
 * Precedence:
 *   1. HSM  — `ROCKY_HSM_URL` set            → delegate the seal to the air-gapped HSM
 *                                                   (key never leaves the appliance).
 *   2. P12  — `ROCKY_P12_PATH` set           → local PAdES, optionally LTV via `ROCKY_TSA_URL`.
 *   3. None                                   → `NoOpSigner` (UNSIGNED; dev / deterministic only).
 *
 * Production MUST set `ROCKY_HSM_URL` or `ROCKY_P12_PATH`, otherwise unsigned
 * PDFs egress. A startup warning is emitted when no real seal is configured.
 */
export function createConfiguredSigner(): PdfSigner {
  const hsmUrl = process.env.ROCKY_HSM_URL;
  if (hsmUrl) {
    const opts: HsmSignerOptions = {
      endpoint: hsmUrl,
      headers: process.env.ROCKY_HSM_TOKEN
        ? { Authorization: `Bearer ${process.env.ROCKY_HSM_TOKEN}` }
        : undefined,
      trustedHosts: splitList(process.env.ROCKY_HSM_TRUSTED_HOSTS),
    };
    return new HsmSigner(opts);
  }

  const p12Path = process.env.ROCKY_P12_PATH;
  if (p12Path) {
    const opts: Pkcs12SignerOptions = {
      p12: readFileSync(p12Path),
      passphrase: process.env.ROCKY_P12_PASS ?? "",
      signatureLength: process.env.ROCKY_P12_SIGNATURE_LENGTH
        ? Number(process.env.ROCKY_P12_SIGNATURE_LENGTH)
        : undefined,
      timestampAuthority: process.env.ROCKY_TSA_URL
        ? new HttpTsaClient(process.env.ROCKY_TSA_URL, splitList(process.env.ROCKY_TSA_ALLOWED_HOSTS))
        : undefined,
    };
    return new Pkcs12Signer(opts);
  }

  // eslint-disable-next-line no-console
  console.warn(
    "[pdf] No ROCKY_HSM_URL / ROCKY_P12_PATH configured — documents will be emitted UNSIGNED (NoOpSigner). Set one in production.",
  );
  return new NoOpSigner();
}

/**
 * Resolve the Ed25519 credential key config (ADR-0084). Precedence:
 *   1. Explicit base64 key — `ROCKY_CRED_KEY` (+ `ROCKY_CRED_PUBKEY`, `ROCKY_CRED_KID`).
 *   2. Dev key file    — `ROCKY_CRED_KEY_PATH` (default apps/api/keys/dev-cred-ed25519.json).
 *   3. None            — return null (credentials disabled; PAdES path unaffected).
 *
 * The credential key is a SEPARATE Ed25519 keypair from the PAdES RSA seal
 * (ADR-0084 §1): same trust root, but Ed25519 is what the offline RN verifier
 * runs with no native deps.
 */
export function createConfiguredCredentialKey(): CredentialKeyConfig | null {
  const iss = process.env.ROCKY_CRED_ISS ?? "rocky:cattle";

  const b64 = process.env.ROCKY_CRED_KEY;
  if (b64) {
    if (!process.env.ROCKY_CRED_PUBKEY) {
      // eslint-disable-next-line no-console
      console.warn("[pdf] ROCKY_CRED_KEY set but ROCKY_CRED_PUBKEY missing — credentials disabled.");
      return null;
    }
    return {
      privateKey: b64ToBytes(b64),
      kid: process.env.ROCKY_CRED_KID ?? "rocky-prod",
      iss,
      pinnedPublicKey: b64ToBytes(process.env.ROCKY_CRED_PUBKEY),
    };
  }

  const path = process.env.ROCKY_CRED_KEY_PATH ?? "apps/api/keys/dev-cred-ed25519.json";
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as {
      privateKey: string;
      publicKey: string;
      kid?: string;
    };
    return {
      privateKey: b64ToBytes(raw.privateKey),
      kid: raw.kid ?? "rocky-dev-2026",
      iss,
      pinnedPublicKey: b64ToBytes(raw.publicKey),
    };
  } catch {
    // eslint-disable-next-line no-console
    console.warn("[pdf] No ROCKY_CRED_KEY / dev cred key found — signed QR credentials disabled.");
    return null;
  }
}

function splitList(value: string | undefined): string[] | undefined {
  return value ? value.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
}
