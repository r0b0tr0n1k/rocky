import { createEnumValues } from "./_brand.js";

/**
 * Email Status - the fate of an outbound message in the Symbolic infrastructure.
 */
export const EMAIL_STATUS = {
	SENT: "sent",
	QUEUED: "queued",
	FAILED: "failed",
} as const;

export const EMAIL_STATUS_VALUES = createEnumValues([
	EMAIL_STATUS.SENT,
	EMAIL_STATUS.QUEUED,
	EMAIL_STATUS.FAILED,
] as const);
