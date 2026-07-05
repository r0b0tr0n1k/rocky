import { createEnumValues } from "./_brand.js"

export const HEALTH_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export const HEALTH_SEVERITY_VALUES = createEnumValues([
  HEALTH_SEVERITY.LOW,
  HEALTH_SEVERITY.MEDIUM,
  HEALTH_SEVERITY.HIGH,
  HEALTH_SEVERITY.CRITICAL,
] as const);
