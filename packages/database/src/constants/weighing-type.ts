import { createEnumValues } from "./_brand.js";

/**
 * Weighing Type — meat-processing accounting unit.
 *
 * LIVE_WEIGHT: weighing before slaughter (live animal)
 * WARM_HALVES: weighing after slaughter (warm carcass halves)
 */
export const WEIGHING_TYPE = {
  LIVE_WEIGHT: "LIVE_WEIGHT",
  WARM_HALVES: "WARM_HALVES",
} as const;

export const WEIGHING_TYPE_VALUES = createEnumValues([WEIGHING_TYPE.LIVE_WEIGHT, WEIGHING_TYPE.WARM_HALVES] as const);
