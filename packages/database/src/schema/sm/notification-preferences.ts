// ── Drizzle Schema: User Notification Preferences
// Controls how users want to receive notifications by category

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index, uniqueIndex, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { currentUserId, isRoleIn, ADMIN_ROLES } from "../rls-helpers.js";
import { notificationCategoryPgEnum } from "../../schemas/enums/notification-category.js";

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // User
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Category
    category: notificationCategoryPgEnum("category").notNull(),

    // Channel preferences
    emailEnabled: boolean("email_enabled").notNull().default(true),
    smsEnabled: boolean("sms_enabled").notNull().default(false),
    pushEnabled: boolean("push_enabled").notNull().default(true),
    inAppEnabled: boolean("in_app_enabled").notNull().default(true),

    // Timing preferences
    quietHoursStart: varchar("quiet_hours_start", { length: 5 }),
    quietHoursEnd: varchar("quiet_hours_end", { length: 5 }),
    timezone: varchar("timezone", { length: 50 }).notNull().default("Europe/Skopje"),

    // Digest mode (batch notifications)
    digestMode: boolean("digest_mode").notNull().default(false),
    digestFrequency: varchar("digest_frequency", { length: 20 }),

    // Custom filters (advanced)
    filters: jsonb("filters").$type<Record<string, unknown>>(),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_notification_prefs_user_category").on(table.userId, table.category),
    index("idx_notification_prefs_user").on(table.userId),
    index("idx_notification_prefs_category").on(table.category),
    pgPolicy("notification_preference_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.userId} = ${currentUserId}
      )`,
      withCheck: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.userId} = ${currentUserId}
      )`,
    }),
  ],
);
