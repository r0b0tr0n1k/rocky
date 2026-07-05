// ── Drizzle Schema: VS Assignments ──
// Links a VS (via contract) to a farm.
// A farm has exactly one active VS at any time.

import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { vsContracts } from "./vs-contracts.js";
import { farms } from "./farms.js";
import { rlsForFarmColumn, adminWrite } from "../rls-helpers.js";

export const vsAssignments = pgTable(
  "vs_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // The contract governing this assignment
    contractId: uuid("contract_id")
      .notNull()
      .references(() => vsContracts.id),

    // The farm being serviced
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Is this the primary VS for this farm?
    isPrimary: boolean("is_primary").notNull().default(true),

    // Assignment period (within contract period)
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),

    // Notes
    notes: text("notes"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_vs_assignments_contract").on(table.contractId),
    index("idx_vs_assignments_farm").on(table.farmId),
    index("idx_vs_assignments_active").on(table.farmId, table.isActive),
    pgPolicy("vs_assignment_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.farmId),
      withCheck: adminWrite,
    }),
  ],
);
