// ── Drizzle Schema: Mobile Device Registry ──
// Tracks field devices (iPhone/Android) running the Expo mobile app.
// Each device registers with a unique device identifier (from expo-device),
// is assigned to a user, and tracks sync status for offline-first data.
//
// The old Oracle PDA concept is sublated: instead of dedicated hardware,
// we now track commercial smartphones used as field data entry devices.

import {
  boolean,
  check,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { deviceStatusPgEnum } from "../../schemas/enums/device-status.js";
import { adminWrite } from "../rls-helpers.js";
import { users } from "../sm/users.js";

export const pdaDevices = pgTable(
  "pda_devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Device identification (from expo-device)
    deviceIdentifier: varchar("device_identifier", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 200 }),

    // Device metadata
    deviceType: varchar("device_type", { length: 10 }).notNull(), // ios | android | web
    osVersion: varchar("os_version", { length: 20 }),
    appVersion: varchar("app_version", { length: 20 }),

    // Current user assignment
    currentUserId: uuid("current_user_id").references(() => users.id),

    // Push notifications
    pushToken: text("push_token"),

    // Sync tracking (what data this device has)
    lastSyncAt: timestamp("last_sync_at"),
    lastSyncData: jsonb("last_sync_data").$type<{
      animals?: boolean;
      movements?: boolean;
      health?: boolean;
      eartags?: boolean;
      farms?: boolean;
      inspections?: boolean;
    }>(),

    // Security (3 failed attempts → blocked)
    status: deviceStatusPgEnum("status").notNull().default("active"),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    blockedAt: timestamp("blocked_at"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    pgPolicy("pda_device_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
    check("ck_device_failed_attempts_range", sql`${table.failedAttempts} >= 0 AND ${table.failedAttempts} <= 3`),
  ],
);
