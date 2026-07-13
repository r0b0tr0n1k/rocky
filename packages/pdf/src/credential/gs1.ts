/**
 * GS1 GLN utility (ADR-0087 — ESPR Art 12 operator/facility identifier scheme).
 *
 * ADR-0084's signed-QR credential carries `farmId` / `subject` as opaque Rocky IDs.
 * ADR-0087 pins the operator/facility fields to the **GS1** equivalent (ISO/IEC 15459
 * compliant) so Rocky can *feed* downstream animal-derived-product DPPs: the **GLN**
 * (Global Location Number) is the facility key, derived under the national veterinary
 * authority's GS1 company prefix.
 *
 * Until a real GS1 company prefix is allocated (ADR-0087 §Phase 0), `glnFromId` derives
 * a *deterministic, stable* 12-digit base from any source id (farm/operator UUID) and
 * appends the standard GS1 **mod-10 check digit** — so the emitted value is already a
 * valid 13-digit GLN shape. Replacing the derivation with the real prefix is a data
 * task; the field shape and check-digit math here are load-bearing and pinned by tests.
 */

/** GS1 mod-10 check digit over a 12-digit GLN base (weights 3/1 from the right). */
export function glnCheckDigit(base12: string): number {
  if (base12.length !== 12 || !/^\d{12}$/.test(base12)) {
    throw new Error(`glnCheckDigit expects a 12-digit base, got: ${base12}`);
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = base12.charCodeAt(11 - i) - 48;
    sum += (i % 2 === 0 ? 3 : 1) * digit;
  }
  return (10 - (sum % 10)) % 10;
}

/** Stable 12-digit base from an arbitrary id (FNV-1a, mod 10^12, zero-padded). */
function deriveBase12(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return String(h % 1_000_000_000_000).padStart(12, "0");
}

/** Derive a valid 13-digit GS1 GLN from a source id (farm/operator UUID, etc.). */
export function glnFromId(id: string): string {
  const base = deriveBase12(id);
  return base + String(glnCheckDigit(base));
}

/** True when `gln` is a well-formed 13-digit GS1 key with a valid check digit. */
export function isValidGln(gln: string): boolean {
  if (!/^\d{13}$/.test(gln)) return false;
  return gln[12] === String(glnCheckDigit(gln.slice(0, 12)));
}
