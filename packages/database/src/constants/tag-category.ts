import { createEnumValues } from "./_brand.js"

export const TAG_CATEGORY = {
  ELECTRONIC: "ELECTRONIC",
  VISUAL: "VISUAL",
  BOTH: "BOTH",
} as const;

export const TAG_CATEGORY_VALUES = createEnumValues([
  TAG_CATEGORY.ELECTRONIC,
  TAG_CATEGORY.VISUAL,
  TAG_CATEGORY.BOTH,
] as const);
