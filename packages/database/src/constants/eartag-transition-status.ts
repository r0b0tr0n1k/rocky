import { createEnumValues } from "./_brand.js";

/**
 * Ear-Tag Transition Status — deliverable states of an order.
 */
export const EARTAG_TRANSITION_STATUS = {
	DELIVERED: "delivered",
	COMPLETED: "completed",
} as const;

export const EARTAG_TRANSITION_STATUS_VALUES = createEnumValues([
	EARTAG_TRANSITION_STATUS.DELIVERED,
	EARTAG_TRANSITION_STATUS.COMPLETED,
] as const);
