// ── Drizzle Schema: Error Corrections ──
// Replaces: Workflow 17-04-03.pdf §Instances 22-24
// Plausibility checks (a priori + a posteriori) and correction tracking

import { pgTable, uuid, varchar, timestamp, date, boolean, text, jsonb, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { animals } from "./animals";
import { farms } from "../hk/farms";
import {
  isRoleIn,
  farmInOrgArea,
  farmOwnedByUser,
  ADMIN_ROLES,
  ORG_READ_ROLES,
  FARM_READ_ROLES,
} from "../rls-helpers";
import { correctionStatusPgEnum } from "../../schemas/enums/correction-status";
import { correctionCaseTypePgEnum } from "../../schemas/enums/correction-case-type";
import { CORRECTION_STATUS } from "../../constants/correction-status";

export const errorCorrections = pgTable(
  "error_corrections",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Source of error detection
    detectionSource: varchar("detection_source", { length: 50 }).notNull(), // "field", "a_priori", "a_posteriori"

    // Farm context
    farmId: uuid("farm_id")
      .references(() => farms.id),

    // Animal context (if correction is animal-specific)
    animalId: uuid("animal_id")
      .references(() => animals.id),

    // Error details
    errorType: varchar("error_type", { length: 100 }).notNull(),
    errorDescription: text("error_description").notNull(),
    originalData: jsonb("original_data"),
    correctedData: jsonb("corrected_data"),

    // Correction lifecycle
    status: correctionStatusPgEnum("status").notNull().default(CORRECTION_STATUS.PENDING),
    caseType: correctionCaseTypePgEnum("case_type"),

    // Resolution
    resolutionNotes: text("resolution_notes"),
    resolvedBy: uuid("resolved_by"),
    resolvedAt: timestamp("resolved_at"),
    archiveNumber: varchar("archive_number", { length: 50 }),

    // Passport reprint needed
    passportReprintRequired: boolean("passport_reprint_required").notNull().default(false),
    passportId: uuid("passport_id"),

    // Escalation
    escalatedTo: uuid("escalated_to"),
    escalatedAt: timestamp("escalated_at"),
    escalationReason: text("escalation_reason"),

    // VS assignment (for a posteriori checks)
    assignedToVs: uuid("assigned_to_vs"),
    assignedAt: timestamp("assigned_at"),
    vsResolutionAttempted: boolean("vs_resolution_attempted").notNull().default(false),

    // Tech code + timestamp (for case type B)
    techCode: varchar("tech_code", { length: 20 }),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_error_corrections_farm").on(table.farmId),
    index("idx_error_corrections_animal").on(table.animalId),
    index("idx_error_corrections_status").on(table.status),
    index("idx_error_corrections_source").on(table.detectionSource),
    pgPolicy("error_correction_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(...ORG_READ_ROLES)}
            AND (${farmInOrgArea(table.farmId)}
                 OR ${table.farmId} IS NULL))
        OR (${isRoleIn(...FARM_READ_ROLES)}
            AND ${farmOwnedByUser(table.farmId)})
      )`,
    }),
  ],
);
