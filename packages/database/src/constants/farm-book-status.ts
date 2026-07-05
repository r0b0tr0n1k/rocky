import { createEnumValues } from "./_brand.js"

export const FARM_BOOK_STATUS = {
	PENDING: "pending",
	ASSEMBLED: "assembled",
	PRINTED: "printed",
	SHIPPED_TO_VS: "shipped_to_vs",
	DELIVERED: "delivered",
	CANCELLED: "cancelled",
} as const;

export const FARM_BOOK_STATUS_VALUES = createEnumValues([
	FARM_BOOK_STATUS.PENDING,
	FARM_BOOK_STATUS.ASSEMBLED,
	FARM_BOOK_STATUS.PRINTED,
	FARM_BOOK_STATUS.SHIPPED_TO_VS,
	FARM_BOOK_STATUS.DELIVERED,
	FARM_BOOK_STATUS.CANCELLED,
] as const);
