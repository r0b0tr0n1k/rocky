// ── Drizzle Schema: Unified Movement Table ──
// Replaces: Two-phase departure + arrival pattern
// Modern: Single record with parentMovementId for multi-leg (markets)

import { pgTable, uuid, varchar, timestamp, date, boolean, integer, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { animals } from "./animals.js";
import { farms } from "../hk/farms.js";
import {
  isRoleIn,
  farmInOrgArea,
  farmOwnedByUser,
  ADMIN_ROLES,
  ORG_READ_ROLES,
  FARM_READ_ROLES,
} from "../rls-helpers.js";
import { movementTypePgEnum } from "../../schemas/enums/movement-type.js";
import { deathCausePgEnum } from "../../schemas/enums/death-cause.js";

export const movements = pgTable(
  "movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Animal
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id),

    // Movement endpoints
    fromFarmId: uuid("from_farm_id").references(() => farms.id),
    toFarmId: uuid("to_farm_id")
      .notNull()
      .references(() => farms.id),

    // Type
    type: movementTypePgEnum("type").notNull(),

    // Dates
    movementDate: date("movement_date").notNull(),
    arrivalDate: date("arrival_date"),

    // Multi-leg (market transactions: 4 legs linked)
    parentMovementId: uuid("parent_movement_id"),
    legOrder: integer("leg_order").default(0),
    movementGroupId: uuid("movement_group_id"),

    // Documentation
    reason: varchar("reason", { length: 100 }),
    documentRef: varchar("document_ref", { length: 50 }),

    // Death
    deathDate: date("death_date"),
    deathCause: deathCausePgEnum("death_cause"),

    // Import/Export
    importCountry: varchar("import_country", { length: 3 }),
    exportCountry: varchar("export_country", { length: 3 }),
    breedingState: varchar("breeding_state", { length: 3 }),
    breedingPlaceId: varchar("breeding_place_id", { length: 50 }),

    // Verification
    isVerified: boolean("is_verified").notNull().default(false),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: uuid("verified_by"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_movements_animal").on(table.animalId),
    index("idx_movements_date").on(table.movementDate),
    index("idx_movements_type").on(table.type),
    index("idx_movements_from").on(table.fromFarmId),
    index("idx_movements_to").on(table.toFarmId),
    index("idx_movements_parent").on(table.parentMovementId),
    pgPolicy("movement_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(...ORG_READ_ROLES)}
            AND (${farmInOrgArea(table.fromFarmId)}
                 OR ${farmInOrgArea(table.toFarmId)}))
        OR (${isRoleIn(...FARM_READ_ROLES)}
            AND (${farmOwnedByUser(table.fromFarmId)}
                 OR ${farmOwnedByUser(table.toFarmId)}))
      )`,
    }),
  ],
);
