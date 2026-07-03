// ── Drizzle Schema: Birth Notifications ──
// Replaces: Workflow 17-04-03.pdf §Instance 8
// Tracks birth events, 20-day tagging deadlines, vet assignments

import { pgTable, uuid, varchar, timestamp, date, boolean, integer, text, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { farms } from "../hk/farms.js";
import {
  USER_ROLE,
  currentRole,
  currentUserId,
  isRole,
  isRoleIn,
  farmInOrgArea,
  farmOwnedByUser,
  ADMIN_ROLES,
  WRITE_ROLES,
} from "../rls-helpers.js";
import { dataSourcePgEnum } from "../../schemas/enums/data-source.js";
import { birthNotificationStatusPgEnum } from "../../schemas/enums/birth-notification-status.js";
import { DATA_SOURCE } from "../../constants/data-source.js";
import { BIRTH_NOTIFICATION_STATUS } from "../../constants/birth-notification-status.js";

export const birthNotifications = pgTable(
  "birth_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Farm
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Notification
    notificationDate: date("notification_date").notNull(),
    expectedBirthDate: date("expected_birth_date"),
    actualBirthDate: date("actual_birth_date"),

    // Birth
    numberOfCalves: integer("number_of_calves").notNull().default(1),
    motherAnimalId: uuid("mother_animal_id"),
    notes: text("notes"),

    // Source
    source: dataSourcePgEnum("source").notNull().default(DATA_SOURCE.MOBILE),

    // Status
    status: birthNotificationStatusPgEnum("status").notNull().default(BIRTH_NOTIFICATION_STATUS.PENDING),

    // Assignment
    assignedTo: uuid("assigned_to"),
    assignedAt: timestamp("assigned_at"),

    // 20-day deadline (legacy rule)
    taggingDeadline: date("tagging_deadline").notNull(),
    taggedAt: date("tagged_at"),
    taggingExceeded: boolean("tagging_exceeded").notNull().default(false),

    // Resulting animals
    animalIds: uuid("animal_ids").array(),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_birth_notifications_farm").on(table.farmId),
    index("idx_birth_notifications_status").on(table.status),
    index("idx_birth_notifications_deadline").on(table.taggingDeadline),
    index("idx_birth_notifications_assigned").on(table.assignedTo),
    pgPolicy("birth_notification_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(USER_ROLE.VETERINARIAN, USER_ROLE.TECHNICIAN)}
            AND (${farmInOrgArea(table.farmId)}
                 OR ${table.assignedTo} = ${currentUserId}))
        OR (${isRole(USER_ROLE.FARMER)}
            AND ${farmOwnedByUser(table.farmId)})
      )`,
      withCheck: isRoleIn(...WRITE_ROLES),
    }),
  ],
);
