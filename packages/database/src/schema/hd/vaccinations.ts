// ── Drizzle Schema: Vaccination Events ──
// Replaces: docs/old/deseases.md HD_VACCINATIONS

import {
  pgTable,
  uuid,
  timestamp,
  date,
  boolean,
  text,
  index,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { animals } from "../an/animals";
import { farms } from "../hk/farms";
import { vaccines } from "./vaccines";
import { vaccineBatches } from "./vaccine-batches";
import {
  rlsForFarmColumn,
  adminAndVetWrite,
} from "../rls-helpers";
import { administrationRoutePgEnum } from "../../schemas/enums/administration-route";

export const vaccinations = pgTable(
  "vaccinations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Animal and farm references
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Vaccine references
    vaccineId: uuid("vaccine_id")
      .notNull()
      .references(() => vaccines.id),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => vaccineBatches.id),

    // Vet who administered
    vetId: uuid("vet_id").notNull(),

    // Vaccination details
    adminDate: date("admin_date").notNull(),
    route: administrationRoutePgEnum("route").notNull(),
    notes: text("notes"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_vaccinations_animal").on(table.animalId),
    index("idx_vaccinations_farm").on(table.farmId),
    index("idx_vaccinations_vaccine").on(table.vaccineId),
    index("idx_vaccinations_batch").on(table.batchId),
    index("idx_vaccinations_vet").on(table.vetId),
    index("idx_vaccinations_date").on(table.adminDate),
    pgPolicy("vaccination_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.farmId),
      withCheck: adminAndVetWrite,
    }),
  ],
);
