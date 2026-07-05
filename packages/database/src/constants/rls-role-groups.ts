// ── RLS Role Groups - which roles get what access level ──
// These are NOT branded enums - they're arrays of USER_ROLE values
// consumed by the RLS middleware and helpers.

import { USER_ROLE } from "./user-role.js";

/** Roles that bypass all RLS (read everything, write anything). */
export const RLS_BYPASS_ROLES = [USER_ROLE.SUPER_ADMIN] as const;

/** Roles that have org-scoped access (one district/region). */
export const ORG_SCOPED_ROLES = [
  USER_ROLE.VD_ADMIN,
  USER_ROLE.VD_STAFF,
  USER_ROLE.VETERINARIAN,
  USER_ROLE.TECHNICIAN,
  USER_ROLE.SLAUGHTERHOUSE_OP,
  USER_ROLE.MARKET_OP,
] as const;
