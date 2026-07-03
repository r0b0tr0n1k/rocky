import { createEnumValues } from "./_brand.js";

export const ROLE_PRIORITY = {
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
  LOW: "LOW",
} as const;

export const ROLE_PRIORITY_VALUES = createEnumValues([
  ROLE_PRIORITY.NORMAL,
  ROLE_PRIORITY.HIGH,
  ROLE_PRIORITY.CRITICAL,
  ROLE_PRIORITY.LOW,
] as const);
