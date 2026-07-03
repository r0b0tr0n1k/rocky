// ── Drizzle Schema: Centralized Audit Log ──
// Replaces: The generic ID_SESSION audit trail pattern on every legacy table
// Modern: Single audit_log table with pre/post snapshots

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { USER_ROLE, isRoleIn, currentUserId } from "../rls-helpers.js";
import { auditActionPgEnum } from "../../schemas/enums/audit-action.js";
import { eventSourcePgEnum } from "../../schemas/enums/event-source.js";
import { AUDIT_ACTION } from "../../constants/audit-action.js";
import { EVENT_SOURCE } from "../../constants/event-source.js";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Who
    userId: uuid("user_id"),
    sessionId: uuid("session_id"),

    // What
    action: auditActionPgEnum("action").notNull(),
    resource: varchar("resource", { length: 50 }).notNull(),
    resourceId: varchar("resource_id", { length: 50 }),

    // Data changes
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    changes: jsonb("changes"),

    // Context
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    source: eventSourcePgEnum("source").notNull(),

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
      using: sql`(
        ${isRoleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
        OR ${table.userId} = ${currentUserId}
      )`,
    }),
  ],
);

// Note: For production, partition this table by month:
// CREATE TABLE audit_log (...) PARTITION BY RANGE (created_at);
// Then create monthly partitions automatically via pg_partman or cron.
