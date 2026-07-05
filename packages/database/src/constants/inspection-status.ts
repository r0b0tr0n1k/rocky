import { createEnumValues } from "./_brand"

export const INSPECTION_STATUS = {
	SCHEDULED: "scheduled",
	IN_PROGRESS: "in_progress",
	COMPLETED: "completed",
	CANCELLED: "cancelled",
} as const;

export const INSPECTION_STATUS_VALUES = createEnumValues([
	INSPECTION_STATUS.SCHEDULED,
	INSPECTION_STATUS.IN_PROGRESS,
	INSPECTION_STATUS.COMPLETED,
	INSPECTION_STATUS.CANCELLED,
] as const);
