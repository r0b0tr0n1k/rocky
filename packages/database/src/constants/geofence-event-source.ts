import { createEnumValues } from "./_brand.js";

export const GEOFENCE_EVENT_SOURCE = {
	MANUAL: "manual",
	SENSOR: "sensor",
	AUTOMATED: "automated",
} as const;

export const GEOFENCE_EVENT_SOURCE_VALUES = createEnumValues([
	GEOFENCE_EVENT_SOURCE.MANUAL,
	GEOFENCE_EVENT_SOURCE.SENSOR,
	GEOFENCE_EVENT_SOURCE.AUTOMATED,
] as const);
