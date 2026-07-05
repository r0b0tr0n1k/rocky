import { createEnumValues } from "./_brand.js";

export const READING_TYPE = {
	TEMPERATURE: "temperature",
	HEART_RATE: "heart_rate",
	GPS_COORDINATE: "gps_coordinate",
	ACTIVITY_LEVEL: "activity_level",
	RUMINATION_TIME: "rumination_time",
	WEIGHT: "weight",
	BATTERY_LEVEL: "battery_level",
	SIGNAL_STRENGTH: "signal_strength",
	MOTION_DETECTION: "motion_detection",
	PROXIMITY: "proximity",
} as const;

export const READING_TYPE_VALUES = createEnumValues([
	READING_TYPE.TEMPERATURE,
	READING_TYPE.HEART_RATE,
	READING_TYPE.GPS_COORDINATE,
	READING_TYPE.ACTIVITY_LEVEL,
	READING_TYPE.RUMINATION_TIME,
	READING_TYPE.WEIGHT,
	READING_TYPE.BATTERY_LEVEL,
	READING_TYPE.SIGNAL_STRENGTH,
	READING_TYPE.MOTION_DETECTION,
	READING_TYPE.PROXIMITY,
] as const);
