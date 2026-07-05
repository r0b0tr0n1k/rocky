// ── Drizzle Schema: Vaccine Batch Inventory ──
// Replaces: docs/old/deseases.md HD_VACCINE_BATCHES

import {
  boolean,
  check,
  date,
  index,
  integer,
  pgPolicy,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { adminWrite } from "../rls-helpers.js";
import { vaccines } from "./vaccines.js";

export const vaccineBatches = pgTable(
  "vaccine_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Vaccine reference
    vaccineId: uuid("vaccine_id")
      .notNull()
      .references(() => vaccines.id),

    // Batch identification
    batchNo: varchar("batch_no", { length: 50 }).notNull(),

    // Dates
    productionDate: date("production_date"),
    expiryDate: date("expiry_date").notNull(),

    // Inventory
    quantityReceived: integer("quantity_received").notNull(),
    quantityRemaining: integer("quantity_remaining").notNull(),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_vaccine_batches_vaccine").on(table.vaccineId),
    index("idx_vaccine_batches_expiry").on(table.expiryDate),
    uniqueIndex("idx_vaccine_batches_no").on(table.vaccineId, table.batchNo),
    pgPolicy("vaccine_batch_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
    check("ck_quantity_non_negative", sql`${table.quantityRemaining} >= 0`),
  ],
);
