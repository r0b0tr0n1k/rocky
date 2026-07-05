import { createEnumValues } from "./_brand.js";

/**
 * Holding Type - the target of a holdings registration.
 */
export const HOLDING_TYPE = {
	FARM: "FARM",
	SUBJECT: "SUBJECT",
	ADDRESS: "ADDRESS",
} as const;

export const HOLDING_TYPE_VALUES = createEnumValues([
	HOLDING_TYPE.FARM,
	HOLDING_TYPE.SUBJECT,
	HOLDING_TYPE.ADDRESS,
] as const);
