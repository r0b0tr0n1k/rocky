// ── Drizzle Schema: System Management — Users ──
// Replaces: SM_USERS, SM_SESSIONS (Oracle SM.PDF)
// Modern: UUID primary keys, password hashing, MFA support

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	jsonb,
	uniqueIndex,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { userRoles } from "./rbac";

// ── USERS ──
export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		authUserId: varchar("auth_user_id", { length: 255 }),
		username: varchar("username", { length: 50 }).notNull(),
		email: varchar("email", { length: 255 }),

		// Authentication
		passwordHash: varchar("password_hash", { length: 255 }).notNull(),
		mfaEnabled: boolean("mfa_enabled").notNull().default(false),
		mfaSecret: varchar("mfa_secret", { length: 100 }),

		// Personal info (dual language — legacy FIRST_NAME/FIRST_NAME_1)
		firstName: varchar("first_name", { length: 50 }),
		firstNameAlt: varchar("first_name_alt", { length: 50 }),
		lastName: varchar("last_name", { length: 50 }),
		lastNameAlt: varchar("last_name_alt", { length: 50 }),

		// Organization
		organizationId: uuid("organization_id").references(() => organizations.id),

		// Auth metadata
		language: varchar("language", { length: 2 }).notNull().default("MK"),
		geoUnlimited: boolean("geo_unlimited").notNull().default(false),
		lastLoginAt: timestamp("last_login_at"),

		// Status
		status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),

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
		index("idx_users_status").on(table.status),
		pgPolicy("user_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN')
				OR (current_setting('app.current_role', true) = 'VD_STAFF'
						AND organization_id = current_setting('app.current_org_id', true)::uuid)
				OR id = current_setting('app.current_user_id', true)::uuid
			`,
			withCheck: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN')
			`,
		}),
	],
);

export const usersRelations = relations(users, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
	}),
	roles: many(userRoles),
}));

// ── USER SESSIONS (JWT tracking, replaces SM_SESSIONS) ──
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
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN')
				OR user_id = current_setting('app.current_user_id', true)::uuid
			`,
		}),
	],
);

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id],
	}),
}));
