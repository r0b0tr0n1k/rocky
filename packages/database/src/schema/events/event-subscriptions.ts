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
import { users } from "../sm/users.js";

export const eventSubscriptions = pgTable(
  "event_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // What event type (matches outboxEvents.type string)
    eventType: varchar("event_type", { length: 100 }).notNull(),

    // Targeting — normalized to avoid NULL semantics issues
    targetType: varchar("target_type", { length: 20 }).notNull(),
    targetId: uuid("target_id").notNull(),

    // Filter conditions (JSONB array of {field, operator, value})
    conditions: jsonb("conditions").default(sql`'[]'::jsonb`),

    // Channel preferences (override user defaults)
    channels: jsonb("channels").default(sql`'{"inApp": true, "email": false, "push": false}'::jsonb`),

    // Scheduling
    delayMinutes: integer("delay_minutes").notNull().default(0),
    reminderEnabled: boolean("reminder_enabled").notNull().default(false),
    reminderOffsetDays: integer("reminder_offset_days").notNull().default(0),
    reminderDurationHours: integer("reminder_duration_hours").notNull().default(1),

    // Lifecycle
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [
    index("idx_event_subscriptions_type").on(table.eventType),
    index("idx_event_subscriptions_target").on(table.targetType, table.targetId),
    sql`UNIQUE (event_type, target_type, target_id, conditions)`,
    pgPolicy("event_subscription_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.createdBy} = ${currentUserId}
      )`,
    }),
  ],
);
