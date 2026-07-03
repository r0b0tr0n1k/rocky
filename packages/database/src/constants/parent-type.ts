import { createEnumValues } from "./_brand.js"

export const PARENT_TYPE = {
  MOTHER: "MOTHER",
  FATHER: "FATHER",
} as const;

export const PARENT_TYPE_VALUES = createEnumValues([
  PARENT_TYPE.MOTHER,
  PARENT_TYPE.FATHER,
] as const);
