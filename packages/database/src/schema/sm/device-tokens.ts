// ── Drizzle Schema: Device Push Tokens (WO-091, ADR-0043)
// Stores the Expo push token per (user, device) so the server can address a
// field worker's device. Upserted on login; one row per install.

import { sql } from "drizzle-orm";
import { index, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { ADMIN_ROLES, adminWrite, currentUserId, isRoleIn } from "../rls-helpers.js";
import { users } from "./users.js";

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    expoPushToken: text("expo_push_token").notNull(),
    platform: text("platform").notNull().default("ios"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_device_tokens_user").on(table.userId),
    index("idx_device_tokens_device").on(table.deviceId),
    uniqueIndex("uniq_device_tokens_user_device").on(table.userId, table.deviceId),
    pgPolicy("device_tokens_access_policy", {
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
