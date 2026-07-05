import { createEnumValues } from "./_brand.js"

export const DETECTION_SOURCE = {
  FIELD: "field",
  A_PRIORI: "a_priori",
  A_POSTERIORI: "a_posteriori",
} as const;

export const DETECTION_SOURCE_VALUES = createEnumValues([
  DETECTION_SOURCE.FIELD,
  DETECTION_SOURCE.A_PRIORI,
  DETECTION_SOURCE.A_POSTERIORI,
] as const);
