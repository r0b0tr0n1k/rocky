import { createEnumValues } from "./_brand.js"

export const SEX = {
	MALE: "male",
	FEMALE: "female",
} as const;

export const SEX_VALUES = createEnumValues([SEX.MALE, SEX.FEMALE] as const);
