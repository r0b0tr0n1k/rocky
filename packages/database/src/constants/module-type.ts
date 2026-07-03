import { createEnumValues } from "./_brand.js"

export const MODULE_TYPE = {
  CORE: "CORE",
  FEATURE: "FEATURE",
  INTEGRATION: "INTEGRATION",
  REPORT: "REPORT",
  ADMIN: "ADMIN",
} as const;

export const MODULE_TYPE_VALUES = createEnumValues([
  MODULE_TYPE.CORE,
  MODULE_TYPE.FEATURE,
  MODULE_TYPE.INTEGRATION,
  MODULE_TYPE.REPORT,
  MODULE_TYPE.ADMIN,
] as const);
