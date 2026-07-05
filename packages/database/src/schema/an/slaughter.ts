// ── Drizzle Schema: Slaughter Records ──
// Replaces: FS - registration_MK(v0.91).pdf §Slaughtering (p10)

import { sql } from "drizzle-orm";
import { date, index, integer, pgPolicy, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { weighingTypePgEnum } from "../../schemas/enums/weighing-type.js";
import { ADMIN_ROLES, farmInOrgArea, farmOwnedByUser, isRole, isRoleIn, USER_ROLE } from "../rls-helpers.js";

export const slaughterRecords = pgTable(
  "slaughter_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    animalId: uuid("animal_id"),
    fromFarmId: uuid("from_farm_id"),
    slaughterhouseId: uuid("slaughterhouse_id").notNull(),

    arrivalDate: date("arrival_date"),
    slaughterDate: date("slaughter_date").notNull(),
    slaughterNumber: varchar("slaughter_number", { length: 50 }),
    massType: weighingTypePgEnum("mass_type"),
    mass: integer("mass"),

    importCountry: varchar("import_country", { length: 3 }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    index("idx_slaughter_animal").on(table.animalId),
    index("idx_slaughter_house").on(table.slaughterhouseId),
    index("idx_slaughter_date").on(table.slaughterDate),
    pgPolicy("slaughter_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRole(USER_ROLE.VETERINARIAN)}
            AND ${farmInOrgArea(table.slaughterhouseId)})
        OR (${isRole(USER_ROLE.SLAUGHTERHOUSE_OP)}
            AND ${farmOwnedByUser(table.slaughterhouseId)})
      )`,
    }),
  ],
);
