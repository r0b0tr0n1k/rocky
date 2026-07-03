import { USER_ROLE } from "./user-role.js"

/**
 * Role Hierarchy — defines privilege ordering for RBAC.
 *
 * Higher numbers = more privileges.
 * Used at the application layer, not in SQL RLS policies.
 */

export const ROLE_HIERARCHY: Record<string, number> = {
  [USER_ROLE.SUPER_ADMIN]: 100,
  [USER_ROLE.VD_ADMIN]: 80,
  [USER_ROLE.VD_STAFF]: 60,
  [USER_ROLE.VETERINARIAN]: 55,
  [USER_ROLE.TECHNICIAN]: 45,
  [USER_ROLE.SLAUGHTERHOUSE_OP]: 35,
  [USER_ROLE.MARKET_OP]: 30,
  [USER_ROLE.FARMER]: 20,
} as const;
