/**
 * Credential status list (ADR-0084 §4) — a business-level, CRL-style list that
 * answers *"is THIS credential still valid?"*, distinct from X.509 **cert
 * revocation** (OCSP/CRL) in ADR-0082's PAdES path. The two solve different
 * problems; the names stay distinct so the offline verifier never reaches for
 * OCSP libraries.
 *
 * The list is published and fetched opportunistically (same sync as the
 * credential itself). Its staleness is surfaced in the verifier UI ("status
 * list last synced: X days ago") — a years-valid but stale-status credential
 * must never be silently accepted.
 *
 * This module is PURE: it knows nothing about the database or domain repos.
 * Sourcing (passport/movement state → entries) lives in the API
 * `CredentialStatusListService`.
 */

import { createHash } from "node:crypto";

/** Revocation status of a single credential. */
export type CredentialStatus = "valid" | "revoked" | "suspended";

export interface CredentialStatusListEntry {
  /** Subject — the credential's `sub` (passport id / movement id / ear-tag id). */
  sub: string;
  /** Document/credential type (passport | movement | ear-tag). */
  typ: string;
  status: CredentialStatus;
  /** Human-readable revocation/suspension reason (optional). */
  reason?: string;
  /** ISO timestamp of the last state change that determined this status. */
  updatedAt: string;
}

export interface CredentialStatusList {
  /** Issuer / publisher of the list (matches credential `iss`). */
  publisher: string;
  /** Stable id for this published list revision. */
  listId: string;
  /** ISO timestamp the list was built. */
  issuedAt: string;
  /** How long the list should be trusted before re-sync (seconds). */
  ttlSeconds: number;
  entries: CredentialStatusListEntry[];
  /** Integrity digest over the canonical entry set (sha-256 hex). */
  digest: string;
}

export interface BuildStatusListOptions {
  publisher: string;
  ttlSeconds?: number;
  /** Override the clock (for deterministic tests). */
  now?: Date;
}

/**
 * Map a passport domain status to a credential status (ADR-0084 §4).
 *   issued | active | reprinted -> valid
 *   seized                        -> suspended
 *   cancelled | archived         -> revoked
 */
export function passportStatusToCredentialStatus(status: string): CredentialStatus {
  switch (status) {
    case "seized":
      return "suspended";
    case "cancelled":
    case "archived":
      return "revoked";
    case "issued":
    case "active":
    case "reprinted":
    default:
      return "valid";
  }
}

/**
 * Map a movement domain state to a credential status. The movements table
 * carries no revocation state yet, so every movement credential is `valid`
 * until a movement state machine is introduced (ADR-0084 §4, future work).
 */
export function movementStateToCredentialStatus(_state: string): CredentialStatus {
  return "valid";
}

function canonicalEntries(entries: CredentialStatusListEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.sub.localeCompare(b.sub));
  return JSON.stringify(
    sorted.map((e) => ({
      sub: e.sub,
      typ: e.typ,
      status: e.status,
      reason: e.reason ?? null,
      updatedAt: e.updatedAt,
    })),
  );
}

/** Build a deterministic, integrity-protected credential status list. */
export function buildCredentialStatusList(
  entries: CredentialStatusListEntry[],
  opts: BuildStatusListOptions,
): CredentialStatusList {
  const now = opts.now ?? new Date();
  const issuedAt = now.toISOString();
  const ttlSeconds = opts.ttlSeconds ?? 86_400 * 7; // default 7-day sync cadence
  const sorted = [...entries].sort((a, b) => a.sub.localeCompare(b.sub));
  const digest = createHash("sha256").update(canonicalEntries(sorted)).digest("hex");
  return {
    publisher: opts.publisher,
    listId: `${opts.publisher}:${issuedAt}`,
    issuedAt,
    ttlSeconds,
    entries: sorted,
    digest,
  };
}

/** True when the list is older than its TTL (verifier should warn/refuse). */
export function isStatusListStale(
  list: Pick<CredentialStatusList, "issuedAt" | "ttlSeconds">,
  now: Date = new Date(),
): boolean {
  const ageMs = now.getTime() - new Date(list.issuedAt).getTime();
  return ageMs > list.ttlSeconds * 1000;
}

/** Resolve a credential's status from a list (default `valid` if unknown). */
export function resolveStatus(list: CredentialStatusList, sub: string): CredentialStatus {
  return list.entries.find((e) => e.sub === sub)?.status ?? "valid";
}
