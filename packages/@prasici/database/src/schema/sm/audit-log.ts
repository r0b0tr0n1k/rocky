// ── Drizzle Schema: Centralized Audit Log ──
// Replaces: The generic ID_SESSION audit trail pattern on every legacy table
// Modern: Single audit_log table with pre/post snapshots

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	jsonb,
	text,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const auditLog = pgTable(
	"audit_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Who
		userId: uuid("user_id"),
		sessionId: uuid("session_id"),

		// What
		action: varchar("action", { length: 30 }).notNull(),
		resource: varchar("resource", { length: 50 }).notNull(),
		resourceId: varchar("resource_id", { length: 50 }),

		// Data changes
		oldValue: jsonb("old_value"),
		newValue: jsonb("new_value"),
		changes: jsonb("changes"),

		// Context
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: varchar("user_agent", { length: 500 }),
		source: varchar("source", { length: 20 }).notNull(),

		// Result
		success: boolean("success").notNull().default(true),
		errorMessage: text("error_message"),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("idx_audit_resource").on(table.resource, table.resourceId),
		index("idx_audit_user").on(table.userId),
		index("idx_audit_action").on(table.action),
		index("idx_audit_created").on(table.createdAt),
		pgPolicy("audit_log_access_policy", {
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

// Note: For production, partition this table by month:
// CREATE TABLE audit_log (...) PARTITION BY RANGE (created_at);
// Then create monthly partitions automatically via pg_partman or cron.
