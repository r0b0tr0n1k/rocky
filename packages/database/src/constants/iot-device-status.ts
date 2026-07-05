import { createEnumValues } from "./_brand.js";

export const IOT_DEVICE_STATUS = {
	ACTIVE: "active",
	LOW_BATTERY: "low_battery",
	FAILED: "failed",
	RETIRED: "retired",
} as const;

export const IOT_DEVICE_STATUS_VALUES = createEnumValues([
	IOT_DEVICE_STATUS.ACTIVE,
	IOT_DEVICE_STATUS.LOW_BATTERY,
	IOT_DEVICE_STATUS.FAILED,
	IOT_DEVICE_STATUS.RETIRED,
] as const);
