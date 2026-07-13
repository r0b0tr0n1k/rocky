// ── Drizzle Schema: Disease Master Data ──
// Replaces: docs/old/deseases.md HD_DISEASES

import { boolean, index, integer, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";
import { diseaseCategoryPgEnum } from "../../schemas/enums/disease-category.js";
import { controlMeasuresPgEnum } from "../../schemas/enums/control-measures.js";

export const diseases = pgTable(
  "diseases",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Disease identification
    name: varchar("name", { length: 100 }).notNull().unique(),
    notifiable: boolean("notifiable").notNull().default(false),
    description: text("description"),

    // AHL Annex II tiering + international identity (ADR-0089)
    diseaseCategory: diseaseCategoryPgEnum("disease_category").notNull(),
    woahCode: varchar("woah_code", { length: 50 }).unique(),
    euAnnexRef: varchar("eu_annex_ref", { length: 50 }),
    controlMeasures: controlMeasuresPgEnum("control_measures"),

    // Quarantine periods (disease-specific)
    quarantineDays: integer("quarantine_days"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_diseases_notifiable").on(table.notifiable),
    index("idx_diseases_category").on(table.diseaseCategory),
    index("idx_diseases_woah").on(table.woahCode),
    pgPolicy("disease_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
