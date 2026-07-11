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
  MOTHER_NOT_ON_FARM: "ANIMAL_MOTHER_NOT_ON_FARM",
  MOTHER_NOT_ALIVE: "ANIMAL_MOTHER_NOT_ALIVE",
  MOTHER_TOO_YOUNG: "ANIMAL_MOTHER_TOO_YOUNG",
  INVALID_CALVING_GAP: "ANIMAL_INVALID_CALVING_GAP",
  EAR_TAG_ALREADY_USED: "ANIMAL_EAR_TAG_ALREADY_USED",
  SELF_MOTHER: "ANIMAL_SELF_MOTHER",
  INVALID_PARENT_SEX: "ANIMAL_INVALID_PARENT_SEX",
  INVALID_EAR_TAG: "ANIMAL_INVALID_EAR_TAG",
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
