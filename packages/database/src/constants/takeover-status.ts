import { createEnumValues } from "./_brand"

export const TAKEOVER_STATUS = {
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const TAKEOVER_STATUS_VALUES = createEnumValues([
  TAKEOVER_STATUS.COMPLETED,
  TAKEOVER_STATUS.CANCELLED,
] as const);
