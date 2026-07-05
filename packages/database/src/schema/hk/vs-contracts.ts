// ── Drizzle Schema: VS Contracts ──
// Service contract between CPC and a Veterinary Station (VS subject)

import { sql } from "drizzle-orm";
import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { vsContractStatusPgEnum } from "../../schemas/enums/vs-contract-status.js";
import { subjects } from "./subjects.js";
import { ADMIN_ROLES, isRoleIn } from "../rls-helpers.js";

export const vsContracts = pgTable(
  "vs_contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // The VS subject (Veterinary Station) under contract
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),

    // Business-facing contract identifier
    contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),

    // Geographic region of responsibility
    region: varchar("region", { length: 100 }).notNull(),

    // Contract period
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),

    // Lifecycle
    status: vsContractStatusPgEnum("status").notNull().default("draft"),

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
    index("idx_vs_contracts_subject").on(table.subjectId),
    index("idx_vs_contracts_status").on(table.status),
    index("idx_vs_contracts_region").on(table.region),
    pgPolicy("vs_contract_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(${isRoleIn(...ADMIN_ROLES)})`,
    }),
  ],
);
