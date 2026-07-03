/**
 * Organization Domain Errors
 */

export const ORG_ERRORS = {
  NOT_FOUND: "ORG_NOT_FOUND",
  DUPLICATE_NAME: "ORG_DUPLICATE_NAME",
  INVALID_INPUT: "ORG_INVALID_INPUT",
  FORBIDDEN: "ORG_FORBIDDEN",
} as const;

export type OrgErrorCode = (typeof ORG_ERRORS)[keyof typeof ORG_ERRORS];

export class OrgError extends Error {
  constructor(
    public readonly code: OrgErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "OrgError";
  }
}

export const orgErr = (
  code: OrgErrorCode,
  context?: Record<string, unknown>,
): OrgError => new OrgError(code, context);
