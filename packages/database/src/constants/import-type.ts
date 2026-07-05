import { createEnumValues } from "./_brand"

export const IMPORT_TYPE = {
	EU: "eu",
	THIRD_COUNTRY: "third_country",
} as const;

export const IMPORT_TYPE_VALUES = createEnumValues([
	IMPORT_TYPE.EU,
	IMPORT_TYPE.THIRD_COUNTRY,
] as const);
