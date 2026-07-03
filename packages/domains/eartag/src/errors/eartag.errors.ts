/**
 * EarTag Domain Errors
 *
 * Following Error Sovereignty Doctrine: 6 error codes.
 * ALREADY_APPLIED + ALREADY_ALLOCATED → ALREADY_ASSIGNED
 * (frontend branches identically on both — "tag already in use").
 */

export const EARTAG_ERRORS = {
  NOT_FOUND: "EARTAG_NOT_FOUND",
  ORDER_NOT_FOUND: "EARTAG_ORDER_NOT_FOUND",
  ALREADY_ASSIGNED: "EARTAG_ALREADY_ASSIGNED",
  DUPLICATE_TAG: "EARTAG_DUPLICATE_TAG",
  INVALID_STATUS_TRANSITION: "EARTAG_INVALID_STATUS_TRANSITION",
  INVALID_INPUT: "EARTAG_INVALID_INPUT",
  FORBIDDEN: "EARTAG_FORBIDDEN",
} as const;

export type EarTagErrorCode = (typeof EARTAG_ERRORS)[keyof typeof EARTAG_ERRORS];

export class EarTagError extends Error {
  constructor(
    public readonly code: EarTagErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "EarTagError";
  }
}

export const eartagErr = (
  code: EarTagErrorCode,
  context?: Record<string, unknown>,
): EarTagError => new EarTagError(code, context);
