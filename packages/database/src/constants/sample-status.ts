import { createEnumValues } from "./_brand.js";

/**
 * Lab test chain-of-custody status (ADR-0091).
 * SAMPLE_COLLECTED -> IN_TRANSIT -> PROCESSING -> COMPLETED.
 */
export const SAMPLE_STATUS = {
	SAMPLE_COLLECTED: "sample_collected",
	IN_TRANSIT: "in_transit",
	PROCESSING: "processing",
	COMPLETED: "completed",
} as const;

export const SAMPLE_STATUS_VALUES = createEnumValues([
	SAMPLE_STATUS.SAMPLE_COLLECTED,
	SAMPLE_STATUS.IN_TRANSIT,
	SAMPLE_STATUS.PROCESSING,
	SAMPLE_STATUS.COMPLETED,
] as const);
