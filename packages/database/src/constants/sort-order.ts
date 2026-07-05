import { createEnumValues } from "./_brand.js";

/**
 * Sort Order - the dialectical direction of query results.
 *
 * ASC: ascending order (A→Z, 0→9, old→new)
 * DESC: descending order (Z→A, 9→0, new→old)
 */
export const SORT_ORDER = {
	ASC: "asc",
	DESC: "desc",
} as const;

export const SORT_ORDER_VALUES = createEnumValues([
	SORT_ORDER.ASC,
	SORT_ORDER.DESC,
] as const);
