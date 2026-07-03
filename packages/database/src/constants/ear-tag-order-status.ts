import { createEnumValues } from "./_brand.js"

export const EAR_TAG_ORDER_STATUS = {
	DRAFT: "draft",
	PENDING: "pending",
	APPROVED: "approved",
	REJECTED: "rejected",
	ORDERED: "ordered", // Sent to supplier
	PARTIALLY_RECEIVED: "partially_received",
	RECEIVED: "received",
	CANCELLED: "cancelled",
} as const;

export const EAR_TAG_ORDER_STATUS_VALUES = createEnumValues([
	EAR_TAG_ORDER_STATUS.DRAFT,
	EAR_TAG_ORDER_STATUS.PENDING,
	EAR_TAG_ORDER_STATUS.APPROVED,
	EAR_TAG_ORDER_STATUS.REJECTED,
	EAR_TAG_ORDER_STATUS.ORDERED,
	EAR_TAG_ORDER_STATUS.PARTIALLY_RECEIVED,
	EAR_TAG_ORDER_STATUS.RECEIVED,
	EAR_TAG_ORDER_STATUS.CANCELLED,
] as const);
