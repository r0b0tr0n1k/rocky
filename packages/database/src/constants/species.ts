import { createEnumValues } from "./_brand.js";

/**
 * Animal species covered by the EU traceability framework
 * (Implementing Reg (EU) 2021/520 + 2021/963). ADR-0085.
 * These are the species the per-species first-identification (tagging) rules apply to.
 */
export const SPECIES = {
  BOVINE: "BOVINE",
  OVINE: "OVINE",
  CAPRINE: "CAPRINE",
  PORCINE: "PORCINE",
  EQUINE: "EQUINE",
} as const;

export const SPECIES_VALUES = createEnumValues([
  SPECIES.BOVINE,
  SPECIES.OVINE,
  SPECIES.CAPRINE,
  SPECIES.PORCINE,
  SPECIES.EQUINE,
] as const);
