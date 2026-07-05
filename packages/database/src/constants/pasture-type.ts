import { createEnumValues } from "./_brand.js";

/**
 * Pasture Types - where the animals roam, Comrade.
 *
 * MOUNTAIN: summer pastures in the highlands
 * VILLAGE: winter pastures near the settlement
 */
export const PASTURE_TYPE = {
	MOUNTAIN: "MOUNTAIN",
	VILLAGE: "VILLAGE",
} as const;

export const PASTURE_TYPE_VALUES = createEnumValues([
	PASTURE_TYPE.MOUNTAIN,
	PASTURE_TYPE.VILLAGE,
] as const);
