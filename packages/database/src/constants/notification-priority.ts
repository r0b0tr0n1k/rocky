import { createEnumValues } from "./_brand.js"

export const NOTIFICATION_PRIORITY = {
	LOW: "low",
	NORMAL: "normal",
	HIGH: "high",
	URGENT: "urgent",
	CRITICAL: "critical",
} as const;

export const NOTIFICATION_PRIORITY_VALUES = createEnumValues([
	NOTIFICATION_PRIORITY.LOW,
	NOTIFICATION_PRIORITY.NORMAL,
	NOTIFICATION_PRIORITY.HIGH,
	NOTIFICATION_PRIORITY.URGENT,
	NOTIFICATION_PRIORITY.CRITICAL,
] as const);
