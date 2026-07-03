/**
 * User Domain Errors
 */

export const USER_ERRORS = {
  NOT_FOUND: "USER_NOT_FOUND",
  DUPLICATE_USERNAME: "USER_DUPLICATE_USERNAME",
  DUPLICATE_EMAIL: "USER_DUPLICATE_EMAIL",
  INVALID_INPUT: "USER_INVALID_INPUT",
  FORBIDDEN: "USER_FORBIDDEN",
} as const;

export type UserErrorCode = (typeof USER_ERRORS)[keyof typeof USER_ERRORS];

export class UserError extends Error {
  constructor(
    public readonly code: UserErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "UserError";
  }
}

export const userErr = (
  code: UserErrorCode,
  context?: Record<string, unknown>,
): UserError => new UserError(code, context);
