// ── RBAC TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const RBAC_TRPC_ERROR_MAP: TRPCErrorMap = {
  RBAC_ROLE_NOT_FOUND: { code: "NOT_FOUND", message: "Role not found" },
  RBAC_PERMISSION_NOT_FOUND: { code: "NOT_FOUND", message: "Permission not found" },
  RBAC_USER_ROLE_NOT_FOUND: { code: "NOT_FOUND", message: "User-role assignment not found" },
  RBAC_DUPLICATE_ROLE: { code: "CONFLICT", message: "Role already exists" },
  RBAC_DUPLICATE_PERMISSION: { code: "CONFLICT", message: "Permission already exists" },
  RBAC_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  RBAC_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
  RBAC_ALREADY_ASSIGNED: { code: "CONFLICT", message: "Role already assigned to user" },
};
