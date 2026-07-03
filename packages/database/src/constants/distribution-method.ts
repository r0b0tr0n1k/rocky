import { createEnumValues } from "./_brand.js"

export const DISTRIBUTION_METHOD = {
  VD_DELIVERY: "VD_DELIVERY",
  PICKUP: "PICKUP",
} as const;

export const DISTRIBUTION_METHOD_VALUES = createEnumValues([
  DISTRIBUTION_METHOD.VD_DELIVERY,
  DISTRIBUTION_METHOD.PICKUP,
] as const);
