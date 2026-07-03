// ── Drizzle Schema: Auth — Session (better-auth) ──
// Tracks active sessions for cookie/token-based auth

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user.js";

export const session = pgTable("auth_session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
