import { createEnumValues } from "./_brand.js";

export const GEOFENCE_EVENT_TYPE = {
	ENTERED: "entered",
	EXITED: "exited",
	INSIDE: "inside",
	OUTSIDE: "outside",
} as const;

export const GEOFENCE_EVENT_TYPE_VALUES = createEnumValues([
	GEOFENCE_EVENT_TYPE.ENTERED,
	GEOFENCE_EVENT_TYPE.EXITED,
	GEOFENCE_EVENT_TYPE.INSIDE,
	GEOFENCE_EVENT_TYPE.OUTSIDE,
] as const);
