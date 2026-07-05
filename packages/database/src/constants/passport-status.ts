import { createEnumValues } from "./_brand.js"

export const PASSPORT_STATUS = {
	ISSUED: "issued",
	ACTIVE: "active",
	SEIZED: "seized",
	ARCHIVED: "archived",
	REPRINTED: "reprinted",
	CANCELLED: "cancelled",
} as const;

export const PASSPORT_STATUS_VALUES = createEnumValues([
	PASSPORT_STATUS.ISSUED,
	PASSPORT_STATUS.ACTIVE,
	PASSPORT_STATUS.SEIZED,
	PASSPORT_STATUS.ARCHIVED,
	PASSPORT_STATUS.REPRINTED,
	PASSPORT_STATUS.CANCELLED,
] as const);
