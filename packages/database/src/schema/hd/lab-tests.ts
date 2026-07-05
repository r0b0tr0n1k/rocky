// ── Drizzle Schema: Laboratory Test Results ──
// Covers: serology (rabies titration, TB, brucellosis),
//         PCR, culture, ELISA — all pathogen-specific tests
// References: import health cert requirements for animal trade

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  numeric,
  text,
  boolean,
  index,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { animals } from "../an/animals";
import { farms } from "../hk/farms";
import { diseases } from "./diseases";
import { rlsForFarmColumn, adminAndVetWrite } from "../rls-helpers";
import { testTypePgEnum } from "../../schemas/enums/test-type";
import { testResultPgEnum } from "../../schemas/enums/test-result";

export const labTests = pgTable(
  "lab_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Animal and farm references
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // What was tested
    diseaseId: uuid("disease_id")
      .notNull()
      .references(() => diseases.id),

    // Test details
    testType: testTypePgEnum("test_type").notNull(),
    testMethod: varchar("test_method", { length: 100 }),
    result: testResultPgEnum("result").notNull(),
    resultNumeric: numeric("result_numeric", { precision: 10, scale: 3 }),
    resultUnit: varchar("result_unit", { length: 20 }),
    interpretation: text("interpretation"),

    // Laboratory info
    labName: varchar("lab_name", { length: 200 }),
    labSampleId: varchar("lab_sample_id", { length: 50 }),

    // Dates
    sampleDate: date("sample_date").notNull(),
    resultDate: date("result_date").notNull(),

    // Certificate (for import health certs)
    certificateRef: varchar("certificate_ref", { length: 50 }),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_lab_tests_animal").on(table.animalId),
    index("idx_lab_tests_farm").on(table.farmId),
    index("idx_lab_tests_disease").on(table.diseaseId),
    index("idx_lab_tests_type").on(table.testType),
    index("idx_lab_tests_date").on(table.resultDate),
    pgPolicy("lab_test_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.farmId),
      withCheck: adminAndVetWrite,
    }),
  ],
);
