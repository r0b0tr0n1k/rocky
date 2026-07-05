// ── Drizzle Schema: Cattle Passports ──
// Replaces: Workflow 17-04-03.pdf §Instance 11
// The central legal document of the I&R system

import { pgTable, uuid, varchar, timestamp, date, boolean, index, pgPolicy } from "drizzle-orm/pg-core";
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
import { passportStatusPgEnum } from "../../schemas/enums/passport-status";
import { stateCodePgEnum } from "../../schemas/enums/state-code";
import { deathCausePgEnum } from "../../schemas/enums/death-cause";
import { PASSPORT_STATUS } from "../../constants/passport-status";
import { STATE_CODE } from "../../constants/state-code";

export const cattlePassports = pgTable(
  "cattle_passports",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Passport identity
    passportNumber: varchar("passport_number", { length: 20 }).notNull().unique(),
    stateCode: stateCodePgEnum("state_code").notNull().default(STATE_CODE.MK),

    // Animal reference
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id),

    // Farm reference
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Passport lifecycle
    status: passportStatusPgEnum("status").notNull().default(PASSPORT_STATUS.ISSUED),
    issueDate: date("issue_date").notNull().defaultNow(),
    seizeDate: date("seize_date"),
    archiveDate: date("archive_date"),

    // Death tracking (for seized passports)
    deathDate: date("death_date"),
    deathCause: deathCausePgEnum("death_cause"),

    // Import tracking (for imported animals)
    countryOfOrigin: varchar("country_of_origin", { length: 3 }),
    foreignPassportNumber: varchar("foreign_passport_number", { length: 50 }),

    // Shipment tracking
    shippedToVs: boolean("shipped_to_vs").notNull().default(false),
    shippedAt: timestamp("shipped_at"),
    deliveredToKeeper: boolean("delivered_to_keeper").notNull().default(false),
    deliveredAt: timestamp("delivered_at"),

    // Reprint tracking
    isReprint: boolean("is_reprint").notNull().default(false),
    originalPassportId: uuid("original_passport_id"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_cattle_passports_animal").on(table.animalId),
    index("idx_cattle_passports_farm").on(table.farmId),
    index("idx_cattle_passports_status").on(table.status),
    index("idx_cattle_passports_number").on(table.passportNumber),
    pgPolicy("cattle_passport_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(...ORG_READ_ROLES)}
            AND ${farmInOrgArea(table.farmId)})
        OR (${isRoleIn(...FARM_READ_ROLES)}
            AND ${farmOwnedByUser(table.farmId)})
      )`,
    }),
  ],
);
