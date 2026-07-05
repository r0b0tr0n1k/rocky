import { createEnumValues } from "./_brand.js";

/**
 * Test Type - laboratory test methodology
 */
export const TEST_TYPE = {
	SEROLOGY: "serology",
	PCR: "pcr",
	CULTURE: "culture",
	ELISA: "elisa",
	NECROPSY: "necropsy",
	OTHER: "other",
} as const;

export const TEST_TYPE_VALUES = createEnumValues([
	TEST_TYPE.SEROLOGY,
	TEST_TYPE.PCR,
	TEST_TYPE.CULTURE,
	TEST_TYPE.ELISA,
	TEST_TYPE.NECROPSY,
	TEST_TYPE.OTHER,
] as const);
