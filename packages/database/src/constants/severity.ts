import { createEnumValues } from "./_brand.js"

export const SEVERITY = {
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
  DEBUG: "DEBUG",
} as const;

export const SEVERITY_VALUES = createEnumValues([
  SEVERITY.ERROR,
  SEVERITY.WARNING,
  SEVERITY.INFO,
  SEVERITY.DEBUG,
] as const);
