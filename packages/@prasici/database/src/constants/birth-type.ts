import { createEnumValues } from "./_brand";

export const BIRTH_TYPE = {
	SINGLE: "single",
	TWIN: "twin",
	TRIPLET: "triplet",
	STILLBORN: "stillborn",
} as const;

export const BIRTH_TYPE_VALUES = createEnumValues([
	BIRTH_TYPE.SINGLE,
	BIRTH_TYPE.TWIN,
	BIRTH_TYPE.TRIPLET,
	BIRTH_TYPE.STILLBORN,
] as const);
