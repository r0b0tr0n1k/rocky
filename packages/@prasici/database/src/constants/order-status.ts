import { createEnumValues } from "./_brand";

export const ORDER_STATUS = {
	PENDING: "pending",
	COLLECTED: "collected",
	DELIVERED: "delivered",
	PARTIALLY_DELIVERED: "partially_delivered",
	CANCELLED: "cancelled",
	COMPLETED: "completed",
} as const;

export const ORDER_STATUS_VALUES = createEnumValues([
	ORDER_STATUS.PENDING,
	ORDER_STATUS.COLLECTED,
	ORDER_STATUS.DELIVERED,
	ORDER_STATUS.PARTIALLY_DELIVERED,
	ORDER_STATUS.CANCELLED,
	ORDER_STATUS.COMPLETED,
] as const);
