import { createEnumValues } from "./_brand.js"

export const DEVICE_STATUS = {
	ACTIVE: "active",
	BLOCKED: "blocked",
	RETIRED: "retired",
} as const;

export const DEVICE_STATUS_VALUES = createEnumValues([
	DEVICE_STATUS.ACTIVE,
	DEVICE_STATUS.BLOCKED,
	DEVICE_STATUS.RETIRED,
] as const);
