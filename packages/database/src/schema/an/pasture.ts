// ── Drizzle Schema: Pasture Declarations ──
// Replaces: FS - registration_MK(v0.91).pdf §Pasture (p11)
// Types: MOUNTAIN (seasonal), VILLAGE (daily)

import { sql } from "drizzle-orm";
import { boolean, date, index, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pastureTypePgEnum } from "../../schemas/enums/pasture-type.js";
import { conflictResolutionStatusPgEnum } from "../../schemas/enums/conflict-resolution-status.js";
import { CONFLICT_RESOLUTION_STATUS } from "../../constants/conflict-resolution-status.js";
import { ADMIN_ROLES, farmInOrgArea, farmOwnedByUser, isRole, isRoleIn, USER_ROLE } from "../rls-helpers.js";

export const pastureDeclarations = pgTable(
  "pasture_declarations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fromFarmId: uuid("from_farm_id").notNull(),
    toFarmId: uuid("to_farm_id").notNull(),

    departureDate: date("departure_date").notNull(),
    expectedReturnDate: date("expected_return_date").notNull(),
    pastureType: pastureTypePgEnum("pasture_type").notNull(),

    animalIds: uuid("animal_ids").array().notNull(),

    isActive: boolean("is_active").notNull().default(true),
    completedAt: date("completed_at"),

    // Conflict resolution (pasture invalidation audit trail)
    conflictResolutionStatus: conflictResolutionStatusPgEnum("conflict_resolution_status").notNull().default(CONFLICT_RESOLUTION_STATUS.NONE),
    invalidatedReason: text("invalidated_reason"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("idx_pasture_from").on(table.fromFarmId),
    index("idx_pasture_to").on(table.toFarmId),
    index("idx_pasture_type").on(table.pastureType),
    pgPolicy("pasture_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRole(USER_ROLE.VETERINARIAN)}
            AND (${farmInOrgArea(table.fromFarmId)}
                 OR ${farmInOrgArea(table.toFarmId)}))
        OR (${isRole(USER_ROLE.FARMER)}
            AND (${farmOwnedByUser(table.fromFarmId)}
                 OR ${farmOwnedByUser(table.toFarmId)}))
      )`,
    }),
  ],
);
