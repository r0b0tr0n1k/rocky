// ── Drizzle Schema: Risk Analyses ──
// CPC annual risk analysis - selects 10% of farms for on-spot inspection

import { boolean, index, integer, jsonb, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { farms } from "../hk/farms.js";

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
  (table) => [index("idx_risk_analyses_year").on(table.year), index("idx_risk_analyses_status").on(table.status)],
);

// ── Drizzle Schema: Risk Analysis Results ──
// Per-farm results for a risk analysis run — the bureaucratic alibi (OCR 2017/625).
// risk_factors_snapshot freezes the exact variables + RuleSet weights at analysis time,
// so an EU auditor years later can verify the score was objectively correct.

export const riskAnalysisResults = pgTable(
  "risk_analysis_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    analysisId: uuid("analysis_id").notNull().references(() => riskAnalyses.id, { onDelete: "cascade" }),
    farmId: uuid("farm_id").notNull().references(() => farms.id, { onDelete: "restrict" }),
    score: numeric("score", { precision: 12, scale: 6 }).notNull(),
    selected: boolean("selected").notNull().default(false),
    riskFactorsSnapshot: jsonb("risk_factors_snapshot").notNull().$type<Record<string, number | string | boolean>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uk_risk_analysis_results_analysis_farm").on(table.analysisId, table.farmId),
    index("idx_risk_analysis_results_farm").on(table.farmId),
    index("idx_risk_analysis_results_analysis").on(table.analysisId),
  ],
);
