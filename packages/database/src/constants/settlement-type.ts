import { createEnumValues } from "./_brand.js";

/** Settlement (populated place) classification for the disease-zone anchor (ADR-0080). */
export const SETTLEMENT_TYPE = {
	VILLAGE: "village",
	TOWN: "town",
	CITY: "city",
} as const;

export const SETTLEMENT_TYPE_VALUES = createEnumValues([
	SETTLEMENT_TYPE.VILLAGE,
	SETTLEMENT_TYPE.TOWN,
	SETTLEMENT_TYPE.CITY,
] as const);
