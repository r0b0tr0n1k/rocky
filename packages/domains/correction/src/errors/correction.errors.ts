/**
 * Correction Domain Errors
 *
 * Following Error Sovereignty Doctrine.
 */

export const CORRECTION_ERRORS = {
  NOT_FOUND: "CORRECTION_NOT_FOUND",
  INVALID_STATUS_TRANSITION: "CORRECTION_INVALID_STATUS_TRANSITION",
  INVALID_INPUT: "CORRECTION_INVALID_INPUT",
  FORBIDDEN: "CORRECTION_FORBIDDEN",
  ESCALATION_REQUIRED: "CORRECTION_ESCALATION_REQUIRED",
  ALREADY_RESOLVED: "CORRECTION_ALREADY_RESOLVED",
} as const;

export type CorrectionErrorCode = (typeof CORRECTION_ERRORS)[keyof typeof CORRECTION_ERRORS];

export class CorrectionError extends Error {
  constructor(
    public readonly code: CorrectionErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "CorrectionError";
  }
}

export const correctionErr = (
  code: CorrectionErrorCode,
  context?: Record<string, unknown>,
): CorrectionError => new CorrectionError(code, context);
