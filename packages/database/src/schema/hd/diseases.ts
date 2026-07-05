// ── Drizzle Schema: Disease Master Data ──
// Replaces: docs/old/deseases.md HD_DISEASES

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  index,
  uniqueIndex,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers";

export const diseases = pgTable(
  "diseases",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Disease identification
    name: varchar("name", { length: 100 }).notNull().unique(),
    notifiable: boolean("notifiable").notNull().default(false),
    description: text("description"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_diseases_notifiable").on(table.notifiable),
    pgPolicy("disease_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
