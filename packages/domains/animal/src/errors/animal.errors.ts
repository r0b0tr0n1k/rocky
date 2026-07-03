/**
 * Animal Domain Errors
 *
 * Following the Error Sovereignty Doctrine:
 * - Domain services return Result<T, Error>
 * - Errors are defined here for domain-specific failures
 * - tRPC layer maps these to TRPCError
 */

export const ANIMAL_ERRORS = {
  NOT_FOUND: "ANIMAL_NOT_FOUND",
  DUPLICATE_TAG: "ANIMAL_DUPLICATE_EAR_TAG",
  INVALID_INPUT: "ANIMAL_INVALID_INPUT",
  FORBIDDEN: "ANIMAL_FORBIDDEN",
} as const;

export type AnimalErrorCode = (typeof ANIMAL_ERRORS)[keyof typeof ANIMAL_ERRORS];

export class AnimalError extends Error {
  constructor(
    public readonly code: AnimalErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "AnimalError";
  }
}

export const animalErr = (
  code: AnimalErrorCode,
  context?: Record<string, unknown>,
): AnimalError => new AnimalError(code, context);
