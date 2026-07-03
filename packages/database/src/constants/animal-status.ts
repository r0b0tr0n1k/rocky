import { createEnumValues } from "./_brand.js"

export const ANIMAL_STATUS = {
	ALIVE: "alive",
	DEAD: "dead",
	SLAUGHTERED: "slaughtered",
	SOLD: "sold",
	EXPORTED: "exported",
	IMPORTED: "imported",
	MISSING: "missing",
	STILLBORN: "stillborn",
} as const;

export const ANIMAL_STATUS_VALUES = createEnumValues([
	ANIMAL_STATUS.ALIVE,
	ANIMAL_STATUS.DEAD,
	ANIMAL_STATUS.SLAUGHTERED,
	ANIMAL_STATUS.SOLD,
	ANIMAL_STATUS.EXPORTED,
	ANIMAL_STATUS.IMPORTED,
	ANIMAL_STATUS.MISSING,
	ANIMAL_STATUS.STILLBORN,
] as const);
