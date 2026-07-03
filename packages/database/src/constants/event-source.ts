import { createEnumValues } from "./_brand.js";

/**
 * Event Source — from which node in the network does the event originate?
 */
export const EVENT_SOURCE = {
	API: "API",
	MOBILE: "MOBILE",
	SYNC: "SYNC",
	SYSTEM: "SYSTEM",
	IMPORT: "IMPORT",
	WEBHOOK: "WEBHOOK",
} as const;

export const EVENT_SOURCE_VALUES = createEnumValues([
	EVENT_SOURCE.API,
	EVENT_SOURCE.MOBILE,
	EVENT_SOURCE.SYNC,
	EVENT_SOURCE.SYSTEM,
	EVENT_SOURCE.IMPORT,
	EVENT_SOURCE.WEBHOOK,
] as const);
