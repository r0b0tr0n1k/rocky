// ── PostgreSQL Roles for RLS ──────────────────────────────────
// These map to the USER_ROLE constants and are used by pgPolicy.
// Drizzle-kit manages these via entities.roles config.
//
// Hierarchy is enforced at the application layer (ROLE_HIERARCHY).
// RLS policies check `current_setting('app.current_role')` — 
// which is SET LOCAL by the RLS middleware before each request.

import { pgRole } from "drizzle-orm/pg-core";

export const SUPER_ADMIN = pgRole("SUPER_ADMIN", {
  createRole: true, inherit: true,
});

export const VD_ADMIN = pgRole("VD_ADMIN", {
  createRole: true, inherit: true,
});

export const VD_STAFF = pgRole("VD_STAFF", {
  inherit: true,
});

export const VETERINARIAN = pgRole("VETERINARIAN", {
  inherit: true,
});

export const TECHNICIAN = pgRole("TECHNICIAN", {
  inherit: true,
});

export const SLAUGHTERHOUSE_OP = pgRole("SLAUGHTERHOUSE_OP", {
  inherit: true,
});

export const MARKET_OP = pgRole("MARKET_OP", {
  inherit: true,
});

export const FARMER = pgRole("FARMER", {
  inherit: true,
});

/** All application roles — used for drizzle-kit migration generation. */
export const appRoles = {
  SUPER_ADMIN,
  VD_ADMIN,
  VD_STAFF,
  VETERINARIAN,
  TECHNICIAN,
  SLAUGHTERHOUSE_OP,
  MARKET_OP,
  FARMER,
} as const;
