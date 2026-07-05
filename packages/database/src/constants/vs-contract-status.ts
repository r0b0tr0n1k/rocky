import { createEnumValues } from "./_brand.js"

export const VS_CONTRACT_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  TERMINATED: "terminated",
  EXPIRED: "expired",
} as const;

export const VS_CONTRACT_STATUS_VALUES = createEnumValues([
  VS_CONTRACT_STATUS.DRAFT,
  VS_CONTRACT_STATUS.ACTIVE,
  VS_CONTRACT_STATUS.SUSPENDED,
  VS_CONTRACT_STATUS.TERMINATED,
  VS_CONTRACT_STATUS.EXPIRED,
] as const);
