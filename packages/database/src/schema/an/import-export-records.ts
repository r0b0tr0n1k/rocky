// ── Drizzle Schema: Import/Export Records ──
// Replaces: Workflow 17-04-03.pdf §Instances 19-21
// Cross-border animal movement (EU + 3rd country imports, exports)

import { sql } from "drizzle-orm";
import { boolean, date, index, pgPolicy, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { IMPORT_EXPORT_STATUS } from "../../constants/import-export-status.js";
import { importExportStatusPgEnum } from "../../schemas/enums/import-export-status.js";
import { importTypePgEnum } from "../../schemas/enums/import-type.js";
import { farms } from "../hk/farms.js";
import {
  ADMIN_ROLES,
  FARM_READ_ROLES,
  farmInOrgArea,
  farmOwnedByUser,
  isRoleIn,
  ORG_READ_ROLES,
} from "../rls-helpers.js";
import { animals } from "./animals.js";

export const importExportRecords = pgTable(
  "import_export_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Direction
    direction: varchar("direction", { length: 10 }).notNull(), // "import" or "export"

    // Animal reference
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id),

    // Farm references
    fromFarmId: uuid("from_farm_id").references(() => farms.id),
    toFarmId: uuid("to_farm_id").references(() => farms.id),

    // Import details
    importType: importTypePgEnum("import_type"),
    countryOfOrigin: varchar("country_of_origin", { length: 3 }).notNull(),
    destinationCountry: varchar("destination_country", { length: 3 }),

    // Passport tracking
    foreignPassportNumber: varchar("foreign_passport_number", { length: 50 }),
    nationalPassportId: uuid("national_passport_id"),
    foreignPassportStored: boolean("foreign_passport_stored").notNull().default(false),
    foreignPassportStorageExpiry: date("foreign_passport_storage_expiry"),

    // BIP (Border Inspection Post) tracking
    bipId: uuid("bip_id").references(() => farms.id),
    bipEntryDate: date("bip_entry_date"),
    bipExitDate: date("bip_exit_date"),

    // Quarantine tracking
    quarantineStableId: uuid("quarantine_stable_id").references(() => farms.id),
    quarantineEntryDate: date("quarantine_entry_date"),
    quarantineExitDate: date("quarantine_exit_date"),

    // Re-tagging (3rd country imports)
    retagged: boolean("retagged").notNull().default(false),
    retaggedAt: timestamp("retagged_at"),
    newEarTagNumber: varchar("new_ear_tag_number", { length: 8 }),

    // Status
    status: importExportStatusPgEnum("status").notNull().default(IMPORT_EXPORT_STATUS.PENDING),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_import_export_animal").on(table.animalId),
    index("idx_import_export_farm").on(table.fromFarmId),
    index("idx_import_export_status").on(table.status),
    index("idx_import_export_direction").on(table.direction),
    pgPolicy("import_export_access_policy", {
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
