// ── Drizzle Schema: Vaccine Master Data ──
// Replaces: docs/old/deseases.md HD_VACCINES

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers";
import { vaccineTypePgEnum } from "../../schemas/enums/vaccine-type";

export const vaccines = pgTable(
  "vaccines",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Vaccine identification
    name: varchar("name", { length: 100 }).notNull().unique(),
    manufacturer: varchar("manufacturer", { length: 100 }),
    type: vaccineTypePgEnum("type").notNull(),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    pgPolicy("vaccine_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
