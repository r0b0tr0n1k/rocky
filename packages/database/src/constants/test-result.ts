import { createEnumValues } from "./_brand";

/**
 * Test Result — laboratory test outcome
 */
export const TEST_RESULT = {
	POSITIVE: "positive",
	NEGATIVE: "negative",
	INCONCLUSIVE: "inconclusive",
	QUANTITATIVE: "quantitative",
} as const;

export const TEST_RESULT_VALUES = createEnumValues([
	TEST_RESULT.POSITIVE,
	TEST_RESULT.NEGATIVE,
	TEST_RESULT.INCONCLUSIVE,
	TEST_RESULT.QUANTITATIVE,
] as const);
