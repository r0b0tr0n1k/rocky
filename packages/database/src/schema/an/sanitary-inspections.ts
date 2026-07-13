// ── Drizzle Schema: Sanitary Inspections ──
// ADR-0090: ante-/post-mortem sanitary gate at slaughterhouses.
// Maps to Reg (EU) 2017/625 (OCR) + Reg (EC) 853/2004 + Reg (EC) 1069/2009 (ABP).

import { sql } from "drizzle-orm";
import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sanitaryDecisionPgEnum } from "../../schemas/enums/sanitary-decision.js";
import { farms } from "../hk/farms.js";
import { movements } from "./movements.js";
import { subjects } from "../hk/subjects.js";
import { ADMIN_ROLES, farmInOrgArea, isRoleIn, ORG_READ_ROLES } from "../rls-helpers.js";

export const sanitaryInspections = pgTable(
  "sanitary_inspections",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Slaughter arrival this inspection gates
    movementId: uuid("movement_id")
      .notNull()
      .references(() => movements.id),
    // Slaughterhouse (for RLS + traceability)
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Inspecting SANITARY_INSPECTOR subject
    inspectorSubjectId: uuid("inspector_subject_id")
      .notNull()
      .references(() => subjects.id),

    // Decisions
    anteMortemDecision: sanitaryDecisionPgEnum("ante_mortem_decision"),
    postMortemDecision: sanitaryDecisionPgEnum("post_mortem_decision"),
    anteMortemAt: timestamp("ante_mortem_at"),
    postMortemAt: timestamp("post_mortem_at"),
    condemnationReason: text("condemnation_reason"),
    // Disposition for condemned animals (e.g., ABP_CAT1 incineration)
    disposition: varchar("disposition", { length: 20 }),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_sanitary_movement").on(table.movementId),
    index("idx_sanitary_farm").on(table.farmId),
    index("idx_sanitary_inspector").on(table.inspectorSubjectId),
    pgPolicy("sanitary_inspection_access_policy", {
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
