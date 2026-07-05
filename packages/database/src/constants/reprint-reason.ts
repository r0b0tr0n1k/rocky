import { createEnumValues } from "./_brand.js"

export const REPRINT_REASON = {
	CONSUMED: "consumed",
	LOST: "lost",
	DAMAGED: "damaged",
} as const;

export const REPRINT_REASON_VALUES = createEnumValues([
	REPRINT_REASON.CONSUMED,
	REPRINT_REASON.LOST,
	REPRINT_REASON.DAMAGED,
] as const);
