import { createEnumValues } from "./_brand.js";

/**
 * Entity Type — what kind of thing is being referenced in a holdings query?
 */
export const ENTITY_TYPE = {
	FARM: "FARM",
	SUBJECT: "SUBJECT",
	FARM_SUBJECT: "FARM_SUBJECT",
} as const;

export const ENTITY_TYPE_VALUES = createEnumValues([
	ENTITY_TYPE.FARM,
	ENTITY_TYPE.SUBJECT,
	ENTITY_TYPE.FARM_SUBJECT,
] as const);
