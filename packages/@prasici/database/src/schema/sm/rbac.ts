// ── Drizzle Schema: RBAC — Roles, Permissions, Role-Permissions, User-Roles ──
// Replaces: SM_GROUPS, SM_GRP_PRIVS, SM_PRIVILEGES, SM_US_PRIVS (Oracle SM.PDF)
// Modern: Fine-grained RBAC with resource-based permissions and scoped access

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	index,
	uniqueIndex,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { users } from "./users";

// ── ROLES (replaces SM_GROUPS) ──
export const roles = pgTable(
	"roles",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 50 }).notNull(),
		description: varchar("description", { length: 250 }),
		priority: varchar("priority", { length: 10 }).notNull().default("NORMAL"),
		isSystem: boolean("is_system").notNull().default(false),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
		validTo: timestamp("valid_to"),
	},
	(table) => ({
		nameIdx: uniqueIndex("idx_roles_name").on(table.name),
	}),
);

// ── PERMISSIONS (replaces SM_PRIVILEGES) ──
export const permissions = pgTable(
	"permissions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		resource: varchar("resource", { length: 50 }).notNull(),
		action: varchar("action", { length: 50 }).notNull(),
		description: varchar("description", { length: 250 }),
		scope: varchar("scope", { length: 100 }).notNull().default("*"),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		resourceActionIdx: uniqueIndex("idx_perm_resource_action").on(
			table.resource,
			table.action,
		),
	}),
);

// ── ROLE-PERMISSION BINDING (replaces SM_GRP_PRIVS) ──
export const rolePermissions = pgTable(
	"role_permissions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		roleId: uuid("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		permissionId: uuid("permission_id")
			.notNull()
			.references(() => permissions.id, { onDelete: "cascade" }),

		condition: varchar("condition", { length: 500 }),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		rolePermIdx: uniqueIndex("idx_role_permissions").on(
			table.roleId,
			table.permissionId,
		),
	}),
);

export const rolePermissionsRelations = relations(
	rolePermissions,
	({ one }) => ({
		role: one(roles, {
			fields: [rolePermissions.roleId],
			references: [roles.id],
		}),
		permission: one(permissions, {
			fields: [rolePermissions.permissionId],
			references: [permissions.id],
		}),
	}),
);

// ── USER-ROLE MAPPING (M2M — replaces SM_US_PRIVS) ──
export const userRoles = pgTable(
	"user_roles",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		roleId: uuid("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),

		// Scope: limit this role to specific org/farm/region
		scopeOrgId: uuid("scope_org_id"),
		scopeFarmId: uuid("scope_farm_id"),

		// Temporal
		validFrom: timestamp("valid_from"),
		validTo: timestamp("valid_to"),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
	},
	(table) => [
		uniqueIndex("idx_user_roles").on(
			table.userId,
			table.roleId,
			table.scopeOrgId,
		),
		index("idx_user_roles_user").on(table.userId),
		pgPolicy("user_role_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN')
				OR user_id = current_setting('app.current_user_id', true)::uuid
			`,
			withCheck: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN')
			`,
		}),
	],
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id],
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id],
	}),
}));
