// ── Drizzle Schema: Risk Analyses ──
// CPC annual risk analysis — selects 10% of farms for on-spot inspection

import { pgTable, uuid, varchar, integer, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { farms } from "../hk/farms";

export const riskAnalyses = pgTable(
  "risk_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Analysis period
    year: integer("year").notNull(),
    quarter: varchar("quarter", { length: 10 }),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),

    // Results summary
    totalFarms: integer("total_farms").notNull().default(0),
    selectedFarms: integer("selected_farms").notNull().default(0),

    // Algorithm
    algorithmVersion: varchar("algorithm_version", { length: 20 }).default("v1"),
    selectionPercentage: integer("selection_percentage").notNull().default(10),
    paramsSnapshot: jsonb("params_snapshot"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_risk_analyses_year").on(table.year),
    index("idx_risk_analyses_status").on(table.status),
  ],
);
