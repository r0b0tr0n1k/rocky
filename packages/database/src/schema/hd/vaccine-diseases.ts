// ── Drizzle Schema: Vaccine-to-Disease Mapping ──
// Many-to-many: a vaccine can protect against multiple diseases
// (e.g., multivalent FMD vaccines), and a disease may have multiple vaccines

import { index, pgPolicy, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";
import { diseases } from "./diseases.js";
import { vaccines } from "./vaccines.js";

export const vaccineDiseases = pgTable(
  "vaccine_diseases",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // References
    vaccineId: uuid("vaccine_id")
      .notNull()
      .references(() => vaccines.id, { onDelete: "cascade" }),
    diseaseId: uuid("disease_id")
      .notNull()
      .references(() => diseases.id, { onDelete: "cascade" }),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    uniqueIndex("idx_vaccine_diseases_pair").on(table.vaccineId, table.diseaseId),
    index("idx_vaccine_diseases_vaccine").on(table.vaccineId),
    index("idx_vaccine_diseases_disease").on(table.diseaseId),
    pgPolicy("vaccine_disease_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
