import { createEnumValues } from "./_brand.js";

/**
 * State Code — ISO 3166-1 alpha-2 codes for countries.
 *
 * MK: North Macedonia (default for the domestic herd)
 */
export const STATE_CODE = {
	MK: "MK",
} as const;

export const STATE_CODE_VALUES = createEnumValues([
	STATE_CODE.MK,
] as const);
