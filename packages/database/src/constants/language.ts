import { createEnumValues } from "./_brand.js";

export const LANGUAGE = {
  MK: "MK",
  EN: "EN",
} as const;

export const LANGUAGE_VALUES = createEnumValues([LANGUAGE.MK, LANGUAGE.EN] as const);
