import { createEnumValues } from "./_brand.js"

/**
 * User Roles — RBAC System for Rocky AIMCS
 *
 * Eight roles cover the full livestock management hierarchy.
 * These map to PostgreSQL RLS policies via `current_setting('app.current_role')`.
 */

export const USER_ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  VD_ADMIN: "VD_ADMIN",
  VD_STAFF: "VD_STAFF",
  VETERINARIAN: "VETERINARIAN",
  TECHNICIAN: "TECHNICIAN",
  SLAUGHTERHOUSE_OP: "SLAUGHTERHOUSE_OP",
  MARKET_OP: "MARKET_OP",
  FARMER: "FARMER",
} as const;

export const USER_ROLE_VALUES = createEnumValues([
  USER_ROLE.SUPER_ADMIN,
  USER_ROLE.VD_ADMIN,
  USER_ROLE.VD_STAFF,
  USER_ROLE.VETERINARIAN,
  USER_ROLE.TECHNICIAN,
  USER_ROLE.SLAUGHTERHOUSE_OP,
  USER_ROLE.MARKET_OP,
  USER_ROLE.FARMER,
] as const);
