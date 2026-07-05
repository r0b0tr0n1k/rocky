import { createEnumValues } from "./_brand"

export const PASSPORT_STATUS = {
	ISSUED: "issued",
	ACTIVE: "active",
	SEIZED: "seized",
	ARCHIVED: "archived",
} as const;

export const PASSPORT_STATUS_VALUES = createEnumValues([
	PASSPORT_STATUS.ISSUED,
	PASSPORT_STATUS.ACTIVE,
	PASSPORT_STATUS.SEIZED,
	PASSPORT_STATUS.ARCHIVED,
] as const);
