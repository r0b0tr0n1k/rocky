// ── Shared Error Classes ──
// Universal error types that any domain can use.
// Domain-specific errors live in each domain's own errors/ directory.

// ── Error Code Dictionary ────────────────────────────────────────────

export const SHARED_ERRORS = {
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  DATABASE_ERROR: "DATABASE_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  CONFLICT: "CONFLICT",
} as const;

export type SharedErrorCode = (typeof SHARED_ERRORS)[keyof typeof SHARED_ERRORS];

// ── Error Classes ────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} not found: ${id}` : `${entity} not found`);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(entity?: string, action?: string) {
    super(entity && action ? `Forbidden: ${action} on ${entity}` : "Forbidden");
    this.name = "ForbiddenError";
  }
}

export class DbError extends Error {
  constructor(operation: string, details?: unknown) {
    super(details ? `Database error on ${operation}: ${JSON.stringify(details)}` : `Database error on ${operation}`);
    this.name = "DbError";
  }
}
