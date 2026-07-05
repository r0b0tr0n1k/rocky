import { createEnumValues } from "./_brand.js";

/**
 * Environment - deployment stage of the application.
 *
 * dev: local development
 * production: live production
 * test: automated test suite
 * staging: pre-production staging
 */
export const ENVIRONMENT = {
  DEV: "dev",
  PRODUCTION: "production",
  TEST: "test",
  STAGING: "staging",
} as const;

export const ENVIRONMENT_VALUES = createEnumValues([
  ENVIRONMENT.DEV,
  ENVIRONMENT.PRODUCTION,
  ENVIRONMENT.TEST,
  ENVIRONMENT.STAGING,
] as const);
