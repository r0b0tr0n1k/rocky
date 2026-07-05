import { createEnumValues } from "./_brand.js"

export const IMPORT_EXPORT_STATUS = {
	PENDING: "pending",
	IN_TRANSIT: "in_transit",
	QUARANTINE: "quarantine",
	REGISTERED: "registered",
	COMPLETED: "completed",
} as const;

export const IMPORT_EXPORT_STATUS_VALUES = createEnumValues([
	IMPORT_EXPORT_STATUS.PENDING,
	IMPORT_EXPORT_STATUS.IN_TRANSIT,
	IMPORT_EXPORT_STATUS.QUARANTINE,
	IMPORT_EXPORT_STATUS.REGISTERED,
	IMPORT_EXPORT_STATUS.COMPLETED,
] as const);
