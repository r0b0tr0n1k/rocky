import { createEnumValues } from "./_brand.js";

export const IOT_DEVICE_TYPE = {
	RUMINAL_BOLUS: "ruminal_bolus",
} as const;

export const IOT_DEVICE_TYPE_VALUES = createEnumValues([
	IOT_DEVICE_TYPE.RUMINAL_BOLUS,
] as const);
