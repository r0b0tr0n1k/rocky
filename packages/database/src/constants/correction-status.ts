import { createEnumValues } from "./_brand.js"

export const CORRECTION_STATUS = {
	PENDING: "pending",
	UNDER_REVIEW: "under_review",
	RESOLVED: "resolved",
	ESCALATED: "escalated",
	REJECTED: "rejected",
} as const;

export const CORRECTION_STATUS_VALUES = createEnumValues([
	CORRECTION_STATUS.PENDING,
	CORRECTION_STATUS.UNDER_REVIEW,
	CORRECTION_STATUS.RESOLVED,
	CORRECTION_STATUS.ESCALATED,
	CORRECTION_STATUS.REJECTED,
] as const);
