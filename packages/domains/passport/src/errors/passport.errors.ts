export const PASSPORT_ERRORS = {
  NOT_FOUND: "PASSPORT_NOT_FOUND",
  ALREADY_SEIZED: "PASSPORT_ALREADY_SEIZED",
  INVALID_STATUS_TRANSITION: "PASSPORT_INVALID_STATUS_TRANSITION",
  INVALID_INPUT: "PASSPORT_INVALID_INPUT",
  FORBIDDEN: "PASSPORT_FORBIDDEN",
  ANIMAL_NOT_FOUND: "PASSPORT_ANIMAL_NOT_FOUND",
  NO_ACTIVE_PASSPORT: "PASSPORT_NO_ACTIVE_PASSPORT",
  PASSPORT_EXISTS: "PASSPORT_PASSPORT_EXISTS_FOR_ANIMAL",
} as const;

export type PassportErrorCode = (typeof PASSPORT_ERRORS)[keyof typeof PASSPORT_ERRORS];

export class PassportError extends Error {
  constructor(
    public readonly code: PassportErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "PassportError";
  }
}

export const passportErr = (
  code: PassportErrorCode,
  context?: Record<string, unknown>,
): PassportError => new PassportError(code, context);
