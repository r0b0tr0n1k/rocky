// ── Drizzle Schema: Animal Registration ──
// Replaces: Legacy animal tables from FS - registration_MK(v0.91).pdf

import {
  boolean,
  check,
  date,
  index,
  integer,
  pgPolicy,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { ANIMAL_STATUS } from "../../constants/animal-status.js";
import { STATE_CODE } from "../../constants/state-code.js";
import { animalStatusPgEnum } from "../../schemas/enums/animal-status.js";
import { birthTypePgEnum } from "../../schemas/enums/birth-type.js";
import { parentTypePgEnum } from "../../schemas/enums/parent-type.js";
import { sexPgEnum } from "../../schemas/enums/sex.js";
import { stateCodePgEnum } from "../../schemas/enums/state-code.js";
import { farms } from "../hk/farms.js";
import { adminAndVetWrite, rlsForFarmColumn } from "../rls-helpers.js";

export const animals = pgTable(
  "animals",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Ear tag identification
    stateCode: stateCodePgEnum("state_code").notNull().default(STATE_CODE.MK),
    earTagNumber: varchar("ear_tag_number", { length: 8 }).notNull(),

    // Birth info
    birthDate: date("birth_date").notNull(),
    sex: sexPgEnum("sex").notNull(),
    breed: varchar("breed", { length: 50 }),
    birthType: birthTypePgEnum("birth_type"),
    birthWeight: integer("birth_weight"),

    // Parents
    motherId: uuid("mother_id"),
    fatherId: uuid("father_id"),

    // Current location
    currentFarmId: uuid("current_farm_id")
      .notNull()
      .references(() => farms.id),

    // Status
    status: animalStatusPgEnum("status").notNull().default(ANIMAL_STATUS.ALIVE),

    // Tagging (legacy: 1st tagging campaign flag)
    isFirstTagging: boolean("is_first_tagging").notNull().default(false),
    taggingDate: date("tagging_date"),

    // Import tracking
    imported: boolean("imported").notNull().default(false),
    importCountry: varchar("import_country", { length: 3 }),
    importDate: date("import_date"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_animals_ear_tag").on(table.stateCode, table.earTagNumber),
    index("idx_animals_farm").on(table.currentFarmId),
    index("idx_animals_status").on(table.status),
    index("idx_animals_mother").on(table.motherId),
    pgPolicy("animal_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.currentFarmId),
      withCheck: adminAndVetWrite,
    }),
    check("ck_animal_not_own_mother", sql`${table.motherId} IS DISTINCT FROM ${table.id}`),
  ],
);

// ── Animal Parent History (complex lineage support) ──
export const animalParents = pgTable(
  "animal_parents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => animals.id, { onDelete: "cascade" }),
    parentType: parentTypePgEnum("parent_type").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_animal_parents_animal").on(table.animalId),
    index("idx_animal_parents_parent").on(table.parentId),
    pgPolicy("animal_parent_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.animalId),
    }),
  ],
);
