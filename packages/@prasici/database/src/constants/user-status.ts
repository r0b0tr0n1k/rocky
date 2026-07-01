import { createEnumValues } from "./_brand";

export const USER_STATUS = {
	ACTIVE: "active",
	INACTIVE: "inactive",
	BLOCKED: "blocked",
	PENDING_VERIFICATION: "pending_verification",
} as const;

export const USER_STATUS_VALUES = createEnumValues([
	USER_STATUS.ACTIVE,
	USER_STATUS.INACTIVE,
	USER_STATUS.BLOCKED,
	USER_STATUS.PENDING_VERIFICATION,
] as const);
