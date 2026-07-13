import { createEnumValues } from "./_brand.js";

/** Taxonomic rank for AHL species groups (ADR-0095). */
export const SPECIES_RANK = {
  CLASS: "class",
  ORDER: "order",
  FAMILY: "family",
  GENUS: "genus",
  SPECIES: "species",
  GROUP: "group",
} as const;

export const SPECIES_RANK_VALUES = createEnumValues([
  SPECIES_RANK.CLASS,
  SPECIES_RANK.ORDER,
  SPECIES_RANK.FAMILY,
  SPECIES_RANK.GENUS,
  SPECIES_RANK.SPECIES,
  SPECIES_RANK.GROUP,
] as const);
