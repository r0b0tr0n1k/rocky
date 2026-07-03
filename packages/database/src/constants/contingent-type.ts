import { createEnumValues } from "./_brand.js"

export const CONTINGENT_TYPE = {
	SUPPLIER: "supplier",
	VD: "vd",
	VS: "vs",
} as const;

export const CONTINGENT_TYPE_VALUES = createEnumValues([
	CONTINGENT_TYPE.SUPPLIER,
	CONTINGENT_TYPE.VD,
	CONTINGENT_TYPE.VS,
] as const);
