// ── Drizzle Schema: Notifications System
// Based on: SM.PDF SM_NOTIFICATIONS specification
// Handles email, SMS, push, and in-app notifications for all system events

import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { NOTIFICATION_PRIORITY } from "../../constants/notification-priority.js";
import { NOTIFICATION_STATUS } from "../../constants/notification-status.js";
import { eventSourcePgEnum } from "../../schemas/enums/event-source.js";
import { notificationCategoryPgEnum } from "../../schemas/enums/notification-category.js";
import { notificationPriorityPgEnum } from "../../schemas/enums/notification-priority.js";
import { notificationStatusPgEnum } from "../../schemas/enums/notification-status.js";
import { notificationTypePgEnum } from "../../schemas/enums/notification-type.js";
import { ADMIN_ROLES, adminWrite, currentUserId, isRoleIn } from "../rls-helpers.js";
import { users } from "./users.js";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Recipient
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Type and category
    type: notificationTypePgEnum("type").notNull(),
    category: notificationCategoryPgEnum("category").notNull(),

    // Priority
    priority: notificationPriorityPgEnum("priority").notNull().default(NOTIFICATION_PRIORITY.NORMAL),

    // Status
    status: notificationStatusPgEnum("status").notNull().default(NOTIFICATION_STATUS.PENDING),

    // Content
    subject: varchar("subject", { length: 250 }),
    message: text("message").notNull(),
    data: jsonb("data"),

    // Contact information
    emailAddress: varchar("email_address", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 30 }),
    pushToken: varchar("push_token", { length: 500 }),
    webhookUrl: varchar("webhook_url", { length: 500 }),

    // Template (if generated from template)
    templateId: uuid("template_id"),

    // Scheduling
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    expiresAt: timestamp("expires_at"),

    // Delivery tracking
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastError: text("last_error"),
    lastAttemptAt: timestamp("last_attempt_at"),

    // Metadata
    externalId: varchar("external_id", { length: 100 }),
    source: eventSourcePgEnum("source").notNull(),
    tags: jsonb("tags").$type<string[]>(),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId),
    index("idx_notifications_status").on(table.status),
    index("idx_notifications_category").on(table.category),
    index("idx_notifications_type").on(table.type),
    index("idx_notifications_priority").on(table.priority),
    index("idx_notifications_scheduled").on(table.scheduledAt),
    index("idx_notifications_created").on(table.createdAt),
    pgPolicy("notification_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.userId} = ${currentUserId}
      )`,
      withCheck: adminWrite,
    }),
  ],
);
