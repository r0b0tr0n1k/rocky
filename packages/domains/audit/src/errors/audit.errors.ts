export const AUDIT_ERRORS = {
  NOT_FOUND: "AUDIT_NOT_FOUND",
  DB_ERROR: "AUDIT_DB_ERROR",
} as const;

export type AuditErrorCode = (typeof AUDIT_ERRORS)[keyof typeof AUDIT_ERRORS];

export class AuditError extends Error {
  constructor(
    public readonly code: AuditErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "AuditError";
  }
}
