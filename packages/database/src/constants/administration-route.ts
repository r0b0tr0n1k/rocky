import { createEnumValues } from "./_brand";

/**
 * Administration Route — how was the vaccine or treatment administered?
 */
export const ADMIN_ROUTE = {
	INTRAMUSCULAR: "intramuscular",
	SUBCUTANEOUS: "subcutaneous",
	INTRANASAL: "intranasal",
	ORAL: "oral",
	TOPICAL: "topical",
	OTHER: "other",
} as const;

export const ADMIN_ROUTE_VALUES = createEnumValues([
	ADMIN_ROUTE.INTRAMUSCULAR,
	ADMIN_ROUTE.SUBCUTANEOUS,
	ADMIN_ROUTE.INTRANASAL,
	ADMIN_ROUTE.ORAL,
	ADMIN_ROUTE.TOPICAL,
	ADMIN_ROUTE.OTHER,
] as const);
