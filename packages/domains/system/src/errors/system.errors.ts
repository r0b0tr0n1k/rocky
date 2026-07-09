/**
 * System Domain Errors
 *
 * Covers the `sm` configuration tables: feature-flag modules and system
 * parameters (software preferences).
 */

export const SYSTEM_ERRORS = {
  MODULE_NOT_FOUND: "SYSTEM_MODULE_NOT_FOUND",
  PARAMETER_NOT_FOUND: "SYSTEM_PARAMETER_NOT_FOUND",
  PARAMETER_NOT_EDITABLE: "SYSTEM_PARAMETER_NOT_EDITABLE",
  INVALID_INPUT: "SYSTEM_INVALID_INPUT",
} as const;

export type SystemErrorCode = (typeof SYSTEM_ERRORS)[keyof typeof SYSTEM_ERRORS];

export class SystemError extends Error {
  constructor(
    public readonly code: SystemErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "SystemError";
  }
}

export const systemErr = (
  code: SystemErrorCode,
  context?: Record<string, unknown>,
): SystemError => new SystemError(code, context);
