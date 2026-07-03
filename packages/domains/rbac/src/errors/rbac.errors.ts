/**
 * RBAC Domain Errors
 */

export const RBAC_ERRORS = {
  ROLE_NOT_FOUND: "RBAC_ROLE_NOT_FOUND",
  PERMISSION_NOT_FOUND: "RBAC_PERMISSION_NOT_FOUND",
  USER_ROLE_NOT_FOUND: "RBAC_USER_ROLE_NOT_FOUND",
  DUPLICATE_ROLE: "RBAC_DUPLICATE_ROLE",
  DUPLICATE_PERMISSION: "RBAC_DUPLICATE_PERMISSION",
  INVALID_INPUT: "RBAC_INVALID_INPUT",
  FORBIDDEN: "RBAC_FORBIDDEN",
  ALREADY_ASSIGNED: "RBAC_ALREADY_ASSIGNED",
} as const;

export type RbacErrorCode = (typeof RBAC_ERRORS)[keyof typeof RBAC_ERRORS];

export class RbacError extends Error {
  constructor(
    public readonly code: RbacErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "RbacError";
  }
}

export const rbacErr = (
  code: RbacErrorCode,
  context?: Record<string, unknown>,
): RbacError => new RbacError(code, context);
