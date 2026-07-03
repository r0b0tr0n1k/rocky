import { createEnumValues } from "./_brand.js"

export const DATA_SOURCE = {
	AIMCS: "aimcs",
	HK_IMP: "hk_imp",
	HK_PDA: "hk_pda",
	MOBILE: "mobile",
	API: "api",
	BATCH: "batch",
} as const;

export const DATA_SOURCE_VALUES = createEnumValues([
	DATA_SOURCE.AIMCS,
	DATA_SOURCE.HK_IMP,
	DATA_SOURCE.HK_PDA,
	DATA_SOURCE.MOBILE,
	DATA_SOURCE.API,
	DATA_SOURCE.BATCH,
] as const);
