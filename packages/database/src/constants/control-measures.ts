import { createEnumValues } from "./_brand.js";

/**
 * Default control measure per disease category (ADR-0089).
 */
export const CONTROL_MEASURES = {
	STAMPING_OUT: "stamping_out",
	CONTROL_PROGRAMME: "control_programme",
	SURVEILLANCE: "surveillance",
} as const;

export const CONTROL_MEASURES_VALUES = createEnumValues([
	CONTROL_MEASURES.STAMPING_OUT,
	CONTROL_MEASURES.CONTROL_PROGRAMME,
	CONTROL_MEASURES.SURVEILLANCE,
] as const);
