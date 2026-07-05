// ── Drizzle Schema: Auth - Verification (better-auth) ──
// Email verification tokens, password reset tokens, OTP codes

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const verification = pgTable("auth_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
