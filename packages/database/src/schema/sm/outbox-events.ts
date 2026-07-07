// ── Drizzle Schema: Transactional Outbox ──
// Pattern: Events inserted in same DB transaction as business data.
// Processed by OutboxProcessorJob (cron, every 5s).
// Replaces: In-memory ExecutionEventEmitter for cross-process events.

import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { outboxEventStatusPgEnum } from "../../schemas/enums/outbox-event-status.js";
import { users } from "../sm/users.js";
import { OUTBOX_EVENT_STATUS } from "../../constants/outbox-event-status.js";

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Event classification
    type: varchar("type", { length: 100 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
    aggregateId: uuid("aggregate_id").notNull(),

    // Payload (immutable after creation)
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),

    // Processing state
    status: outboxEventStatusPgEnum("status").notNull().default(OUTBOX_EVENT_STATUS.PENDING),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    errorMessage: text("error_message"),

    // Retry tracking
    deliveryAttempts: integer("delivery_attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [
    index("idx_outbox_pending").on(table.status, table.nextAttemptAt).where(sql`${table.status} = 'pending'`),
    index("idx_outbox_aggregate").on(table.aggregateType, table.aggregateId),
    index("idx_outbox_type").on(table.type),
  ],
);
