import { createEnumValues } from "./_brand.js";

/**
 * Disease category — AHL Annex II tiering (Delegated Reg (EU) 2018/1629 /
 * WOAH response model). Drives zone triggers, reporting, and inspection flags.
 */
export const DISEASE_CATEGORY = {
	CATEGORY_A: "category_a",
	CATEGORY_B: "category_b",
	CATEGORY_C: "category_c",
	CATEGORY_D: "category_d",
	CATEGORY_E: "category_e",
} as const;

export const DISEASE_CATEGORY_VALUES = createEnumValues([
	DISEASE_CATEGORY.CATEGORY_A,
	DISEASE_CATEGORY.CATEGORY_B,
	DISEASE_CATEGORY.CATEGORY_C,
	DISEASE_CATEGORY.CATEGORY_D,
	DISEASE_CATEGORY.CATEGORY_E,
] as const);
