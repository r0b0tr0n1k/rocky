import { createEnumValues } from "./_brand.js"

export const DUPLICATE_TYPE = {
	SINGLE: "single",
	PAIR: "pair",
} as const;

export const DUPLICATE_TYPE_VALUES = createEnumValues([
	DUPLICATE_TYPE.SINGLE,
	DUPLICATE_TYPE.PAIR,
] as const);
