import { createEnumValues } from "./_brand"

export const CORRECTION_CASE_TYPE = {
	TECHNICIAN_RESOLVABLE: "technician_resolvable",
	REQUIRES_CLARIFICATION: "requires_clarification",
	COMPLEX: "complex",
} as const;

export const CORRECTION_CASE_TYPE_VALUES = createEnumValues([
	CORRECTION_CASE_TYPE.TECHNICIAN_RESOLVABLE,
	CORRECTION_CASE_TYPE.REQUIRES_CLARIFICATION,
	CORRECTION_CASE_TYPE.COMPLEX,
] as const);
