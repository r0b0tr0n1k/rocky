import { createEnumValues } from "./_brand";

export const VERIFICATION_STATUS = {
	DRAFT: "draft",
	PENDING_VD_APPROVAL: "pending_vd_approval",
	APPROVED: "approved",
	REJECTED: "rejected",
	ARCHIVED: "archived",
} as const;

export const VERIFICATION_STATUS_VALUES = createEnumValues([
	VERIFICATION_STATUS.DRAFT,
	VERIFICATION_STATUS.PENDING_VD_APPROVAL,
	VERIFICATION_STATUS.APPROVED,
	VERIFICATION_STATUS.REJECTED,
	VERIFICATION_STATUS.ARCHIVED,
] as const);
