import { createEnumValues } from "./_brand.js"

export const REPRINT_STATUS = {
	REQUESTED: "requested",
	PROCESSING: "processing",
	SHIPPED: "shipped",
	DELIVERED: "delivered",
} as const;

export const REPRINT_STATUS_VALUES = createEnumValues([
	REPRINT_STATUS.REQUESTED,
	REPRINT_STATUS.PROCESSING,
	REPRINT_STATUS.SHIPPED,
	REPRINT_STATUS.DELIVERED,
] as const);
