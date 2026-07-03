// ── Drizzle Schema: Notification Templates
// Reusable email/SMS/push notification templates with multi-language support

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  jsonb,
  index,
  uniqueIndex,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";
import { notificationTypePgEnum } from "../../schemas/enums/notification-type.js";
import { notificationCategoryPgEnum } from "../../schemas/enums/notification-category.js";
import { notificationPriorityPgEnum } from "../../schemas/enums/notification-priority.js";
import { NOTIFICATION_PRIORITY } from "../../constants/notification-priority.js";

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Template identification
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // Category
    category: notificationCategoryPgEnum("category").notNull(),

    // Type
    type: notificationTypePgEnum("type").notNull(),

    // Content (multi-language)
    // JSONB structure: { "MK": { subject: "...", body: "..." }, "EN": { subject: "...", body: "..." } }
    subjectTemplate: jsonb("subject_template").$type<Record<string, string>>(),
    bodyTemplate: jsonb("body_template").$type<Record<string, string>>().notNull(),

    // Template variables (for documentation/validation)
    variables: jsonb("variables").$type<string[]>(),

    // Default values
    priority: notificationPriorityPgEnum("priority").notNull().default(NOTIFICATION_PRIORITY.NORMAL),

    // Settings
    scheduled: boolean("scheduled").notNull().default(false),
    expiresInHours: integer("expires_in_hours"),

    // Metadata
    tags: jsonb("tags").$type<string[]>(),

    // Status
    isActive: boolean("is_active").notNull().default(true),
    version: integer("version").notNull().default(1),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_notification_templates_code").on(table.code),
    index("idx_notification_templates_category").on(table.category),
    index("idx_notification_templates_type").on(table.type),
    pgPolicy("notification_template_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
