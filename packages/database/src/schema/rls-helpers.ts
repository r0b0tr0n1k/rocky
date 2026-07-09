// ── RLS Policy Helpers - Composable SQL Fragments ──────────────────
//
// The Žižekian resolution: instead of inlining raw role strings in every
// pgPolicy, we compose reusable SQL fragments from the SSOT constants.
//
// Three layers work together:
//   1. USER_ROLE constants  → SQL fragments (using / withCheck)
//   2. pgRole objects       → pgPolicy({ to: ... }) target roles
//   3. userRolePgEnum       → actual PostgreSQL CREATE TYPE enum
//
// Session variables are SET LOCAL by the RLS middleware before each query.

import { type SQL, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { ADMIN_ROLE_VALUES } from "../constants/admin-roles.js";
import { FARM_READ_ROLE_VALUES } from "../constants/farm-read-roles.js";
import { ORG_READ_ROLE_VALUES } from "../constants/org-read-roles.js";
import { WRITE_ROLE_VALUES } from "../constants/write-roles.js";

export { ADMIN_ROLE_VALUES as ADMIN_ROLES } from "../constants/admin-roles.js";
export { FARM_READ_ROLE_VALUES as FARM_READ_ROLES } from "../constants/farm-read-roles.js";
export { ORG_READ_ROLE_VALUES as ORG_READ_ROLES } from "../constants/org-read-roles.js";
// ── Re-exports: one-stop import for schema files ──
export { USER_ROLE } from "../constants/user-role.js";
export { WRITE_ROLE_VALUES as WRITE_ROLES } from "../constants/write-roles.js";
export * from "./auth/pg-roles.js";

// ── Session Variables (set by RLS middleware) ──────────────────

/** `current_setting('app.current_role', true)` */
export const currentRole = sql`current_setting('app.current_role', true)`;

/** `current_setting('app.current_user_id', true)::uuid` */
export const currentUserId = sql`current_setting('app.current_user_id', true)::uuid`;

/** `current_setting('app.current_org_id', true)::uuid` */
export const currentOrgId = sql`current_setting('app.current_org_id', true)::uuid`;

// ── Inline type helpers for pgColumn column references ─────────
// Drizzle column references produce SQL via template interpolation.
type Col = PgColumn | SQL;

const col = (c: Col): SQL => (c as SQL) ?? sql`${c}`;

// ── Role Checks ────────────────────────────────────────────────

/** `current_role = $role` */
export function isRole(role: string): SQL {
  return sql`${currentRole} = ${role}`;
}

/** `current_role = ANY($roles)` - safe parameterized array check */
export function isRoleIn(...roles: string[]): SQL {
  return sql`${currentRole} = ANY(${roles})`;
}

// ── Data-Scoping Fragments ─────────────────────────────────────

/**
 * Org-scoped farm access (VETERINARIAN, TECHNICIAN, etc.).
 * Farm must belong to a commune in the user's organization area.
 */
export function farmInOrgArea(farmCol: Col): SQL {
  // Resolves the farm's organization WITHOUT re-entering RLS: farm_org_id()
  // is SECURITY DEFINER, so it queries `farms` directly and bypasses
  // farm_access_policy. Referencing `farms f` inline here would re-trigger
  // that policy -> infinite recursion (ADR-0020 RLS defect, fixed WO-031).
  return sql`farm_org_id(${col(farmCol)}) = ${currentOrgId}`;
}

/**
 * Org-scoped address access (for tables that reference addresses directly).
 */
export function addressInOrgArea(addressCol: Col): SQL {
  return sql`${col(addressCol)} IN (
    SELECT a.id FROM addresses a
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = ${currentOrgId}
  )`;
}

/**
 * Farmer-scoped farm access.
 * Farm must be linked to the current user via farm_subjects.
 */
export function farmOwnedByUser(farmCol: Col): SQL {
  return sql`${col(farmCol)} IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = ${currentUserId}
  )`;
}

/**
 * Farm access via ear-tag allocation chain.
 * Used when a table references ear_tag_allocations (which has a farm_id).
 */
export function allocationOwnedByUser(allocationCol: Col): SQL {
  return sql`${col(allocationCol)} IN (
    SELECT eta.id FROM ear_tag_allocations eta
    JOIN farm_subjects fs ON eta.farm_id = fs.farm_id
    WHERE fs.subject_id = ${currentUserId}
  )`;
}

/**
 * Builder for the common pattern:
 *   admins see everything
 *   + org-scoped roles see farms in their org area
 *   + farm-scoped roles see own farms only
 *
 * Returns an SQL fragment suitable for `pgPolicy({ using: ... })`.
 *
 * Usage:
 *   using: rlsForFarmColumn(table.farmId)
 */
export function rlsForFarmColumn(farmCol: Col): SQL {
  return sql`(
    ${isRoleIn(...ADMIN_ROLE_VALUES)}
    OR (${isRoleIn(...ORG_READ_ROLE_VALUES)} AND ${farmInOrgArea(farmCol)})
    OR (${isRoleIn(...FARM_READ_ROLE_VALUES)} AND ${farmOwnedByUser(farmCol)})
  )`;
}

/**
 * Builder for the common org-scoped pattern (ear-tag orders, etc).
 *   admins see everything
 *   + current org's records
 */
export function rlsForOrgColumn(orgCol: Col): SQL {
  return sql`(
    ${isRoleIn(...ADMIN_ROLE_VALUES)}
    OR ${col(orgCol)} = ${currentOrgId}
  )`;
}

/**
 * Standard `withCheck` for tables that allow admin + veterinarian writes.
 */
export const adminAndVetWrite = isRoleIn(...WRITE_ROLE_VALUES);

/**
 * Standard `withCheck` for tables that allow only admin writes.
 */
export const adminWrite = isRoleIn(...ADMIN_ROLE_VALUES);
