import { createEnumValues } from "./_brand.js"

export const SYNC_STATUS = {
	PASSED: "PASSED",
	WARNING: "WARNING",
	REJECTED: "REJECTED",
} as const;

export const SYNC_STATUS_VALUES = createEnumValues([
	SYNC_STATUS.PASSED,
	SYNC_STATUS.WARNING,
	SYNC_STATUS.REJECTED,
] as const);
