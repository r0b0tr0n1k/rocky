// ── RLS Policy Helpers ──
// Single source of truth for all Row-Level Security policies.
// Schema files import these functions instead of writing raw SQL.
// Every role name comes from USER_ROLE constants - no hardcoded strings.

import { sql } from "drizzle-orm";
import { USER_ROLE } from "./constants/user-role.js";

// ── Session context helpers ──
// These map to the RLS middleware that sets session-scoped GUCs.
const currentRole = () => sql.raw(`current_setting('app.current_role', true)`);
const currentUserId = () => sql.raw(`current_setting('app.current_user_id', true)::uuid`);
const currentOrgId = () => sql.raw(`current_setting('app.current_org_id', true)::uuid`);

// ── Role helpers ──
// Injects enum constants safely into SQL via sql.raw().

/** SQL fragment: IN ('ROLE1', 'ROLE2', ...) */
function roleIn(...roles: string[]) {
    const list = roles.map((r) => sql.raw(`'${r}'`)).join(", ");
    return sql.raw(`(${list})`);
}

/** SQL literal: current_setting(...) = 'ROLE' */
function _roleIs(role: string) {
    return sql.raw(`${currentRole()} = '${role}'`);
}

// ═══════════════════════════════════════════════════════════════════
// POLICY FRAGMENTS
// ═══════════════════════════════════════════════════════════════════

// ── Admin bypass (SUPER_ADMIN, VD_ADMIN) ──
// Grants full access to system-wide administrators.

export const adminAllAccess = {
    using: () => sql`true`,
    withCheck: () => sql`true`,
};

// ── Self or admin ──
// Row's id/user_id matches current_user, or the user is an admin.
// Used by: users, sessions, rbac, audit-log

export const adminOrSelf = (userIdColumn?: string) => {
    const col = userIdColumn ?? "id";
    return sql`
    ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
    OR ${sql.raw(col)} = ${currentUserId()}
  `;
};

export const adminOrSelfWrite = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
`;

// ── Staff or vet (org-scoped) ──
// Staff see org-scoped data. Vets/technicians see org-scoped data.
// Used by: farms, farm-subjects, animals, movements, birth-notifications,
//          pasture, slaughter, ear-tag-*, sync-errors

export const staffOrVetAccess = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
  OR (${currentRole()} IN ${roleIn(USER_ROLE.VETERINARIAN, USER_ROLE.TECHNICIAN)}
      AND organization_id = ${currentOrgId()})
`;

export const staffOrVetWrite = () => sql`
  ${currentRole()} IN ${roleIn(
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.VD_ADMIN,
    USER_ROLE.VD_STAFF,
    USER_ROLE.VETERINARIAN,
)}
`;

// ── Staff read (user-scoped) ──
// Staff see all, users see their own notifications.
// Used by: notifications, notification-preferences, notification-templates

export const staffOrOwn = (userIdColumn: string) => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
  OR ${sql.raw(userIdColumn)} = ${currentUserId()}
`;

export const staffWrite = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
`;

// ── Org admin or self ──
// Organization row matches current org, or user is admin.
// Used by: organizations

export const orgAdminOrSelf = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
  OR id = ${currentOrgId()}
`;

export const orgAdminWrite = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
`;

// ── Org area access ──
// Staff see org area rows.
// Used by: organizations area table

export const orgAreaAccess = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
  OR organization_id = ${currentOrgId()}
`;

// ── Subject access (special) ──
// Staff see all, vets see org-scoped, farmers see own subjects.
// Used by: subjects

export const subjectAccess = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF, USER_ROLE.VETERINARIAN)}
  OR id IN (
    SELECT subject_id FROM farm_subjects
    WHERE farm_id IN (
      SELECT id FROM farms WHERE organization_id = ${currentOrgId()}
    )
  )
`;

export const subjectWrite = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
`;

// ── Full access (all rows visible) ──
// Used by: addresses (read all, write restricted)

export const fullRead = () => sql`true`;

export const addressWrite = () => sql`
  ${currentRole()} IN ${roleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
`;