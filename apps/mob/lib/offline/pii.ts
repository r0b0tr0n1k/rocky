// Mask-by-default PII redaction for the offline PDA (ADR-0061 D5 mobile analog).
//
// Design note (Comintern): the phone is CASTRATED -- no RLS, no registry import
// (importing @rocky/validators/pii into the app is rejected: it duplicates the
// Single Source of Truth and invites drift). "What is PII" lives on the SERVER
// and reaches the device over TRPC (the API projection already omits
// default-excluded columns unless the caller holds pii:read + purpose). The
// mobile therefore consults a SERVER-PROVIDED descriptor of PII columns (fetched
// once, cached) and passes that explicit list here. These helpers are pure.

/** Mask a scalar value, preserving the last two characters for human verifiability. */
export function maskValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.length <= 2) return "\u2022".repeat(s.length);
  return "\u2022".repeat(s.length - 2) + s.slice(-2);
}

/**
 * Returns a shallow copy of `record` with the named PII columns masked.
 * `piiColumns` comes from the server descriptor -- it is never guessed locally.
 * Pure: the input object is not mutated.
 */
export function redactRecord(
  record: Record<string, unknown>,
  piiColumns: ReadonlyArray<string>,
): Record<string, unknown> {
  const blocked = new Set(piiColumns);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    out[k] = blocked.has(k) ? maskValue(v) : v;
  }
  return out;
}

/** True when a record contains any of the given PII columns (UI badge helper). */
export function hasPii(record: Record<string, unknown>, piiColumns: ReadonlyArray<string>): boolean {
  return piiColumns.some((c) => c in record);
}
