import { createEnumValues } from "./_brand.js"

export const NOTIFICATION_STATUS = {
	PENDING: "pending",
	SENT: "sent",
	DELIVERED: "delivered",
	FAILED: "failed",
	CANCELLED: "cancelled",
} as const;

export const NOTIFICATION_STATUS_VALUES = createEnumValues([
	NOTIFICATION_STATUS.PENDING,
	NOTIFICATION_STATUS.SENT,
	NOTIFICATION_STATUS.DELIVERED,
	NOTIFICATION_STATUS.FAILED,
	NOTIFICATION_STATUS.CANCELLED,
] as const);
