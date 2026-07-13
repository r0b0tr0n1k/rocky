// ── Drizzle Schema: AHL Species Groups (reference) ──
// Taxonomic groups + vectors from Reg (EU) 2018/1882 Annex (ADR-0095).
// Distinct from the 5 traceability SPECIES enum; bridges via mapsToSpecies.

import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";
import { speciesRankPgEnum } from "../../schemas/enums/species-rank.js";
import { speciesPgEnum } from "../../schemas/enums/species.js";

export const speciesGroups = pgTable(
  "species_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Taxonomy
    code: varchar("code", { length: 60 }).notNull().unique(),
    scientificName: varchar("scientific_name", { length: 160 }),
    commonName: varchar("common_name", { length: 120 }),
    rank: speciesRankPgEnum("rank").notNull(),
    parentCode: varchar("parent_code", { length: 60 }),

    // Bridge to the 5 traceability species (ADR-0085); null when no single mapping
    mapsToSpecies: speciesPgEnum("maps_to_species"),

    // Vector flag — disease agent transmitted by this group (e.g. Culicoides spp.)
    isVector: boolean("is_vector").notNull().default(false),
    euAnnexRef: varchar("eu_annex_ref", { length: 50 }),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_species_groups_rank").on(table.rank),
    index("idx_species_groups_vector").on(table.isVector),
    index("idx_species_groups_parent").on(table.parentCode),
    pgPolicy("species_group_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
