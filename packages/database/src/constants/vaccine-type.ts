import { createEnumValues } from "./_brand";

/**
 * Vaccine Type — how was the vaccine produced?
 */
export const VACCINE_TYPE = {
	LIVE: "live",
	INACTIVATED: "inactivated",
	TOXOID: "toxoid",
	RECOMBINANT: "recombinant",
	OTHER: "other",
} as const;

export const VACCINE_TYPE_VALUES = createEnumValues([
	VACCINE_TYPE.LIVE,
	VACCINE_TYPE.INACTIVATED,
	VACCINE_TYPE.TOXOID,
	VACCINE_TYPE.RECOMBINANT,
	VACCINE_TYPE.OTHER,
] as const);
