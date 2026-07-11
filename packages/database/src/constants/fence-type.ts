import { createEnumValues } from "./_brand.js";

export const FENCE_TYPE = {
	FARM_BOUNDARY: "farm_boundary",
	PASTURE_BOUNDARY: "pasture_boundary",
	EXCLUSION_ZONE: "exclusion_zone",
	WATER_SOURCE: "water_source",
	DISEASE_ZONE: "disease_zone",
} as const;

export const FENCE_TYPE_VALUES = createEnumValues([
	FENCE_TYPE.FARM_BOUNDARY,
	FENCE_TYPE.PASTURE_BOUNDARY,
	FENCE_TYPE.EXCLUSION_ZONE,
	FENCE_TYPE.WATER_SOURCE,
	FENCE_TYPE.DISEASE_ZONE,
] as const);
