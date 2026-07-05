/**
 * Health Domain Errors
 *
 * Following the Error Sovereignty Doctrine:
 * - Domain services return Result<T, Error>
 * - Errors are defined here for domain-specific failures
 * - tRPC layer maps these to TRPCError
 */

export const HEALTH_ERRORS = {
  NOT_FOUND: "HEALTH_NOT_FOUND",
  FORBIDDEN: "HEALTH_FORBIDDEN",
  VACCINE_EXPIRED: "HEALTH_VACCINE_EXPIRED",
  ANIMAL_TOO_YOUNG: "HEALTH_ANIMAL_TOO_YOUNG",
  BATCH_DEPLETED: "HEALTH_BATCH_DEPLETED",
  ANIMAL_NOT_ALIVE: "HEALTH_ANIMAL_NOT_ALIVE",
  INVALID_INPUT: "HEALTH_INVALID_INPUT",
  LAB_TEST_NOT_FOUND: "HEALTH_LAB_TEST_NOT_FOUND",
  VACCINE_DISEASE_CONFLICT: "HEALTH_VACCINE_DISEASE_CONFLICT",
  VACCINE_DISEASE_NOT_FOUND: "HEALTH_VACCINE_DISEASE_NOT_FOUND",
} as const;

export type HealthErrorCode = (typeof HEALTH_ERRORS)[keyof typeof HEALTH_ERRORS];

export class HealthError extends Error {
  constructor(
    public readonly code: HealthErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "HealthError";
  }
}

export const healthErr = (
  code: HealthErrorCode,
  context?: Record<string, unknown>,
): HealthError => new HealthError(code, context);
