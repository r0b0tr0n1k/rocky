// ── Drizzle Schema: System Management - Users ──
// Replaces: SM_USERS, SM_SESSIONS (Oracle SM.PDF)
// Modern: UUID primary keys, password hashing, MFA support
// Uses: userRolePgEnum for the role column (Postgres enum, not varchar)

import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgPolicy, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { LANGUAGE } from "../../constants/language.js";
import { USER_STATUS } from "../../constants/user-status.js";
import { languagePgEnum } from "../../schemas/enums/language.js";
import { userRolePgEnum } from "../../schemas/enums/user-role.js";
import { userStatusPgEnum } from "../../schemas/enums/user-status.js";
import { currentOrgId, currentUserId, isRole, isRoleIn, USER_ROLE } from "../rls-helpers.js";
import { organizations } from "./organizations.js";

// ── USERS ──
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: varchar("auth_user_id", { length: 255 }),
    username: varchar("username", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),

    // Authentication
    /** @deprecated — Better Auth manages passwords via auth_account. Will be removed in next DB reset. */
    passwordHash: varchar("password_hash", { length: 255 }),
    /** @deprecated — MFA handled by Better Auth. Will be removed in next DB reset. */
    mfaEnabled: boolean("mfa_enabled").notNull().default(false),
    /** @deprecated — MFA secret handled by Better Auth. Will be removed in next DB reset. */
    mfaSecret: varchar("mfa_secret", { length: 100 }),

    // Personal info (dual language - legacy FIRST_NAME/FIRST_NAME_1)
    firstName: varchar("first_name", { length: 50 }),
    firstNameAlt: varchar("first_name_alt", { length: 50 }),
    lastName: varchar("last_name", { length: 50 }),
    lastNameAlt: varchar("last_name_alt", { length: 50 }),

    // Contact & Device Identity
    mobilePhone: varchar("mobile_phone", { length: 30 }),
    mobileVerified: boolean("mobile_verified").notNull().default(false),
    deviceId: varchar("device_id", { length: 255 }),

    // Role & Organization
    /** @deprecated — Replaced by RBAC M:N role_permissions + user_roles. Will be removed in next DB reset. */
    role: userRolePgEnum("role").notNull().default(USER_ROLE.FARMER),
    organizationId: uuid("organization_id").references(() => organizations.id),

    // Auth metadata
    language: languagePgEnum("language").notNull().default(LANGUAGE.MK),
    geoUnlimited: boolean("geo_unlimited").notNull().default(false),
    lastLoginAt: timestamp("last_login_at"),

    // Status
    status: userStatusPgEnum("status").notNull().default(USER_STATUS.ACTIVE),

    // Standard audit trail
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_users_username").on(table.username),
    uniqueIndex("idx_users_email").on(table.email),
    index("idx_users_org").on(table.organizationId),
    index("idx_users_role").on(table.role),
    index("idx_users_status").on(table.status),
    pgPolicy("user_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
        OR (${isRole(USER_ROLE.VD_STAFF)}
            AND ${table.organizationId} = ${currentOrgId})
        OR ${table.id} = ${currentUserId}
      )`,
      withCheck: isRoleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN),
    }),
  ],
);

// ── USER SESSIONS (JWT tracking, replaces SM_SESSIONS) ──
/** @deprecated — Better Auth auth_session handles sessions. Will be removed in next DB reset. */
/** @deprecated — Use Better Auth auth_session instead. */
export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Tokens
    accessToken: varchar("access_token", { length: 500 }).notNull(),
    refreshToken: varchar("refresh_token", { length: 500 }),

    // Client info
    deviceInfo: jsonb("device_info").$type<{
      type?: string;
      os?: string;
      browser?: string;
      model?: string;
    }>(),
    ipAddress: varchar("ip_address", { length: 45 }),

    // Status
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at").notNull(),
    lastActivityAt: timestamp("last_activity_at"),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_token").on(table.accessToken),
    pgPolicy("session_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
        OR ${table.userId} = ${currentUserId}
      )`,
    }),
  ],
);
