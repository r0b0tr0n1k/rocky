/**
 * Credential batch manifest (ADR-0084 §6 — HSM bulk-throughput).
 *
 * Ear tags are signed in bulk (a farm tagging hundreds of animals in one
 * sitting). Per-credential HSM calls can bottleneck on HSM latency, so the
 * recorded decision is to **reuse a single signing session across the batch**
 * and emit a **batch manifest** — a digest-protected record that every
 * credential in a bulk-issued set was produced in one session, verifiable
 * without round-tripping each envelope individually.
 *
 * This module is PURE (no DB / no signer); `CredentialService.signBatch`
 * collects signed entries and builds the manifest here. The HSM-session reuse
 * optimisation lives inside the HSM signer path (future); the interim Ed25519
 * / P12 path holds the key in memory, so batching is already a single session.
 */

import { createHash } from "node:crypto";

export interface CredentialBatchEntry {
  /** Credential subject (passport / movement / ear-tag id). */
  sub: string;
  /** Document/credential type. */
  typ: string;
  /** Wire envelope (signed CBOR). */
  envelope: string;
  /** Printable QR data URL for the envelope. */
  qrDataUrl: string;
}

export interface CredentialBatchManifest {
  /** Issuer / publisher (matches credential `iss`). */
  publisher: string;
  /** Stable id for this batch revision. */
  batchId: string;
  /** ISO timestamp the batch was signed. */
  issuedAt: string;
  /** How long the batch should be trusted before re-sync (seconds). */
  ttlSeconds: number;
  /** Number of credentials in the batch. */
  count: number;
  entries: CredentialBatchEntry[];
  /** Integrity digest over the canonical entry set (sha-256 hex). */
  digest: string;
}

export interface BuildBatchOptions {
  publisher: string;
  ttlSeconds?: number;
  /** Override the clock (for deterministic tests). */
  now?: Date;
}

/** Build a deterministic, integrity-protected credential batch manifest. */
export function buildCredentialBatch(
  entries: CredentialBatchEntry[],
  opts: BuildBatchOptions,
): CredentialBatchManifest {
  const now = opts.now ?? new Date();
  const issuedAt = now.toISOString();
  const ttlSeconds = opts.ttlSeconds ?? 86_400 * 7;
  const sorted = [...entries].sort((a, b) => a.sub.localeCompare(b.sub));
  const digest = createHash("sha256")
    .update(JSON.stringify(sorted.map((e) => ({ sub: e.sub, typ: e.typ, envelope: e.envelope }))))
    .digest("hex");
  return {
    publisher: opts.publisher,
    batchId: `${opts.publisher}:batch:${issuedAt}`,
    issuedAt,
    ttlSeconds,
    count: sorted.length,
    entries: sorted,
    digest,
  };
}
