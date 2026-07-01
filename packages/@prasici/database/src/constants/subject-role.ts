import { createEnumValues } from "./_brand";

export const SUBJECT_ROLE = {
	OWNER: "owner",
	KEEPER: "keeper",
	VETERINARIAN: "veterinarian",
	TRADER: "trader",
	SLAUGHTERHOUSE_OP: "slaughterhouse_op",
	MARKET_OP: "market_op",
	TECHNICIAN: "technician",
	GUARDIAN: "guardian",
} as const;

export const SUBJECT_ROLE_VALUES = createEnumValues([
	SUBJECT_ROLE.OWNER,
	SUBJECT_ROLE.KEEPER,
	SUBJECT_ROLE.VETERINARIAN,
	SUBJECT_ROLE.TRADER,
	SUBJECT_ROLE.SLAUGHTERHOUSE_OP,
	SUBJECT_ROLE.MARKET_OP,
	SUBJECT_ROLE.TECHNICIAN,
	SUBJECT_ROLE.GUARDIAN,
] as const);
