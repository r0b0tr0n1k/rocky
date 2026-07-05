import { createEnumValues } from "./_brand.js";

export const PROCESSING_STAGE = {
	RAW: "raw",
	VALIDATED: "validated",
	ENRICHED: "enriched",
	ARCHIVED: "archived",
} as const;

export const PROCESSING_STAGE_VALUES = createEnumValues([
	PROCESSING_STAGE.RAW,
	PROCESSING_STAGE.VALIDATED,
	PROCESSING_STAGE.ENRICHED,
	PROCESSING_STAGE.ARCHIVED,
] as const);
