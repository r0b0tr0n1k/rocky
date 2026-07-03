import { createEnumValues } from "./_brand.js";

/**
 * Approval Action — the trinity of bureaucratic judgment.
 */
export const APPROVAL_ACTION = {
	APPROVE: "APPROVE",
	REJECT: "REJECT",
	REQUEST_CHANGES: "REQUEST_CHANGES",
} as const;

export const APPROVAL_ACTION_VALUES = createEnumValues([
	APPROVAL_ACTION.APPROVE,
	APPROVAL_ACTION.REJECT,
	APPROVAL_ACTION.REQUEST_CHANGES,
] as const);
