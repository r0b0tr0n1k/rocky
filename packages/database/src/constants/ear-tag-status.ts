import { createEnumValues } from "./_brand.js"

export const EAR_TAG_STATUS = {
	NEW: "new",
	AVAILABLE: "available",
	ORDERED: "ordered",
	COLLECTED: "collected",
	DELIVERED: "delivered",
	APPLIED: "applied",
	CANCELLED: "cancelled",
	WITHDRAWN: "withdrawn",
	LOST: "lost",
	DESTROYED: "destroyed",
} as const;

export const EAR_TAG_STATUS_VALUES = createEnumValues([
	EAR_TAG_STATUS.NEW,
	EAR_TAG_STATUS.AVAILABLE,
	EAR_TAG_STATUS.ORDERED,
	EAR_TAG_STATUS.COLLECTED,
	EAR_TAG_STATUS.DELIVERED,
	EAR_TAG_STATUS.APPLIED,
	EAR_TAG_STATUS.CANCELLED,
	EAR_TAG_STATUS.WITHDRAWN,
	EAR_TAG_STATUS.LOST,
	EAR_TAG_STATUS.DESTROYED,
] as const);
