// ── Drizzle Schema: Inspections ──
// Replaces: Workflow 17-04-03.pdf §Instance 18
// On-spot inspections with risk analysis (10% farm selection)

import { sql } from "drizzle-orm";
import { boolean, date, index, jsonb, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { INSPECTION_STATUS } from "../../constants/inspection-status.js";
import { inspectionStatusPgEnum } from "../../schemas/enums/inspection-status.js";
import { farms } from "../hk/farms.js";
import { ADMIN_ROLES, farmInOrgArea, isRoleIn, ORG_READ_ROLES } from "../rls-helpers.js";

export const inspections = pgTable(
  "inspections",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Farm being inspected
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Inspector (VI)
    inspectorId: uuid("inspector_id").notNull(),

    // Inspection lifecycle
    status: inspectionStatusPgEnum("status").notNull().default(INSPECTION_STATUS.SCHEDULED),
    scheduledDate: date("scheduled_date"),
    inspectionDate: date("inspection_date"),

    // Risk analysis
    riskScore: varchar("risk_score", { length: 20 }),
    riskCriteria: text("risk_criteria"),
    selectedByRiskAnalysis: boolean("selected_by_risk_analysis").notNull().default(false),

    // Results
    result: varchar("result", { length: 50 }),
    notes: text("notes"),
    discrepanciesFound: boolean("discrepancies_found").notNull().default(false),

    // Form data (animals checked, tagging status, presence)
    checkedAnimals: jsonb("checked_animals"),
    formPrinted: boolean("form_printed").notNull().default(false),
    formReturned: boolean("form_returned").notNull().default(false),

    // Keeper signature
    keeperSigned: boolean("keeper_signed").notNull().default(false),
    signedAt: timestamp("signed_at"),

    // Retention tracking
    storedAtVi: boolean("stored_at_vi").notNull().default(false),
    retentionExpiry: date("retention_expiry"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_inspections_farm").on(table.farmId),
    index("idx_inspections_inspector").on(table.inspectorId),
    index("idx_inspections_status").on(table.status),
    index("idx_inspections_date").on(table.inspectionDate),
    pgPolicy("inspection_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(...ORG_READ_ROLES)}
            AND ${farmInOrgArea(table.farmId)})
      )`,
    }),
  ],
);
