import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { ADMIN_ROLES, isRoleIn, currentUserId } from "../rls-helpers.js";
import { outboxEvents } from "../sm/outbox-events.js";
import { users } from "../sm/users.js";

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Links to outbox event (optional — reminders can be standalone)
    outboxEventId: uuid("outbox_event_id").references(() => outboxEvents.id),

    // Entity reference
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),

    // Who gets reminded
    userId: uuid("user_id").notNull().references(() => users.id),
    role: varchar("role", { length: 50 }),

    // What/when
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(60),

    // Recurrence
    recurrence: varchar("recurrence", { length: 20 }).notNull().default("none"),
    recurrenceUntil: timestamp("recurrence_until", { withTimezone: true }),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Metadata
    priority: varchar("priority", { length: 20 }).notNull().default("normal"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_reminders_user_pending")
      .on(table.userId, table.status, table.dueAt)
      .where(sql`${table.status} = 'pending'`),
    index("idx_reminders_due")
      .on(table.dueAt)
      .where(sql`${table.status} = 'pending'`),
    pgPolicy("reminder_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.userId} = ${currentUserId}
      )`,
    }),
  ],
);
