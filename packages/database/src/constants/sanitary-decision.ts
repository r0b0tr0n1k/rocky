import { createEnumValues } from "./_brand.js";

/**
 * Sanitary inspection decision (ADR-0090) — ante- and post-mortem outcomes.
 * PARTIAL_CONDEMNATION applies only to post-mortem.
 */
export const SANITARY_DECISION = {
	PASSED: "passed",
	CONDEMNED: "condemned",
	PARTIAL_CONDEMNATION: "partial_condemnation",
} as const;

export const SANITARY_DECISION_VALUES = createEnumValues([
	SANITARY_DECISION.PASSED,
	SANITARY_DECISION.CONDEMNED,
	SANITARY_DECISION.PARTIAL_CONDEMNATION,
] as const);
