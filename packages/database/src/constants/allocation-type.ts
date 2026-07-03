import { createEnumValues } from "./_brand.js";

/**
 * Ear-Tag Allocation Type — the dialectical moment of tag distribution.
 */
export const ALLOCATION_TYPE = {
	INITIAL_ALLOCATION: "INITIAL_ALLOCATION",
	ROUTINE_ALLOCATION: "ROUTINE_ALLOCATION",
	RETURN: "RETURN",
} as const;

export const ALLOCATION_TYPE_VALUES = createEnumValues([
	ALLOCATION_TYPE.INITIAL_ALLOCATION,
	ALLOCATION_TYPE.ROUTINE_ALLOCATION,
	ALLOCATION_TYPE.RETURN,
] as const);
