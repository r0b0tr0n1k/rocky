import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { outboxEvents } from "../sm/outbox-events.js";
import { notifications } from "../sm/notifications.js";
import { users } from "../sm/users.js";

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Links
    outboxEventId: uuid("outbox_event_id").notNull().references(() => outboxEvents.id),
    subscriptionId: uuid("subscription_id").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id),
    notificationId: uuid("notification_id").references(() => notifications.id),

    // Dedup key — UNIQUE prevents double-delivery on retry
    deliveryKey: varchar("delivery_key", { length: 255 }).notNull().unique(),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    errorMessage: varchar("error_message", { length: 500 }),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_notification_deliveries_event").on(table.outboxEventId),
    index("idx_notification_deliveries_user").on(table.userId),
  ],
);
