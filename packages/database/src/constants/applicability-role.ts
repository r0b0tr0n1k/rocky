import { createEnumValues } from "./_brand.js";

/** Role of a species group in a disease's listed applicability (ADR-0095). */
export const APPLICABILITY_ROLE = {
  HOST: "host",
  VECTOR: "vector",
} as const;

export const APPLICABILITY_ROLE_VALUES = createEnumValues([
  APPLICABILITY_ROLE.HOST,
  APPLICABILITY_ROLE.VECTOR,
] as const);
