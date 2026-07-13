// ── Drizzle Schema: Disease × Species-Group Applicability (the 1882 Annex matrix) ──
// Each row = one disease × species/vector × the category subset it is listed under
// (e.g. Brucellosis × Bison ssp. = {B,D,E}; × Perissodactyla = {E}). ADR-0095.

import { boolean, index, pgPolicy, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";
import { diseaseCategoryPgEnum } from "../../schemas/enums/disease-category.js";
import { applicabilityRolePgEnum } from "../../schemas/enums/applicability-role.js";
import { diseases } from "./diseases.js";
import { speciesGroups } from "./species-groups.js";

export const diseaseSpeciesApplicability = pgTable(
  "disease_species_applicability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diseaseId: uuid("disease_id").notNull().references(() => diseases.id),
    speciesGroupId: uuid("species_group_id").notNull().references(() => speciesGroups.id),
    role: applicabilityRolePgEnum("role").notNull(),
    categories: diseaseCategoryPgEnum("categories").array().notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_dsa_disease").on(table.diseaseId),
    index("idx_dsa_species").on(table.speciesGroupId),
    index("idx_dsa_role").on(table.role),
    pgPolicy("dsa_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
