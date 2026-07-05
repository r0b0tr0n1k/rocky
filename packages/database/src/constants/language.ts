import { createEnumValues } from "./_brand.js"

export const LANGUAGE = {
  MK: "MK",
  EN: "EN",
  SQ: "SQ",
  SR: "SR",
} as const;

export const LANGUAGE_VALUES = createEnumValues([
  LANGUAGE.MK,
  LANGUAGE.EN,
  LANGUAGE.SQ,
  LANGUAGE.SR,
] as const);
