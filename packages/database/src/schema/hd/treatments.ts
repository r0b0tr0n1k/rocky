// ── Drizzle Schema: Treatment / Diagnosis Events ──
// Replaces: docs/old/deseases.md HD_TREATMENTS

import { boolean, date, index, pgPolicy, pgTable, text, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { animals } from "../an/animals.js";
import { farms } from "../hk/farms.js";
import { adminAndVetWrite, rlsForFarmColumn } from "../rls-helpers.js";
import { diseases } from "./diseases.js";

export const treatments = pgTable(
  "treatments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Animal and farm references
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Disease (nullable - routine checkups have no diagnosis)
    diseaseId: uuid("disease_id").references(() => diseases.id),

    // Vet who diagnosed/treated
    vetId: uuid("vet_id").notNull(),

    // Treatment details
    diagnosisDate: date("diagnosis_date").notNull(),
    treatmentDesc: text("treatment_desc"),
    isolated: boolean("isolated").notNull().default(false),

    // Antimicrobial resistance (AMR) tracking
    antibioticName: varchar("antibiotic_name", { length: 100 }),
    amrFlag: boolean("amr_flag").notNull().default(false),
    withdrawalPeriod: integer("withdrawal_period"),

    // Notifiable disease alert linkage
    alertTriggeredAt: timestamp("alert_triggered_at", { withTimezone: true }),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_treatments_animal").on(table.animalId),
    index("idx_treatments_farm").on(table.farmId),
    index("idx_treatments_disease").on(table.diseaseId),
    index("idx_treatments_vet").on(table.vetId),
    index("idx_treatments_date").on(table.diagnosisDate),
    pgPolicy("treatment_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.farmId),
      withCheck: adminAndVetWrite,
    }),
  ],
);
