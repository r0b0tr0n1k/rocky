// ── Drizzle Schema: Farms (Holding Register) ──
// Replaces: HK_KMG (Oracle HK.PDF)
// Modern: verification_status replaces legacy temporary tables
//         PostGIS location replaces X/Y/Z coordinates
//         Digital signature + photo for field registration

import {
  boolean,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { DATA_SOURCE } from "../../constants/data-source.js";
import { FARM_TYPE } from "../../constants/farm-type.js";
import { VERIFICATION_STATUS } from "../../constants/verification-status.js";
import { geometry } from "../../geometry/postgis.js";
import { dataSourcePgEnum } from "../../schemas/enums/data-source.js";
import { farmTypePgEnum } from "../../schemas/enums/farm-type.js";
import { verificationStatusPgEnum } from "../../schemas/enums/verification-status.js";
import { adminAndVetWrite, rlsForFarmColumn } from "../rls-helpers.js";
import { addresses } from "./addresses.js";

export const farms = pgTable(
  "farms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // 9-digit Farm ID with check digit (legacy formula preserved)
    farmId: varchar("farm_id", { length: 9 }).notNull().unique(),

    // Address relationship
    addressId: uuid("address_id")
      .notNull()
      .references(() => addresses.id),

    // Farm identification
    name: varchar("name", { length: 50 }),
    type: farmTypePgEnum("type").notNull().default(FARM_TYPE.FARM),

    // Hierarchy
    parentFarmId: uuid("parent_farm_id"),

    // ★ VERIFICATION STATUS - replaces temp tables ★
    verificationStatus: verificationStatusPgEnum("verification_status")
      .notNull()
      .default(VERIFICATION_STATUS.PENDING_VD_APPROVAL),
    verificationNote: text("verification_note"),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: uuid("verified_by"),

    // Data source
    dataSource: dataSourcePgEnum("data_source").notNull().default(DATA_SOURCE.MOBILE),

    // GPS location (captured during field registration)
    // Uses SRID 4326 (WGS84) - standard GPS coordinate system
    // Insert with: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    location: geometry("location"),

    // Digital evidence
    digitalSignature: text("digital_signature"),
    signatureCapturedAt: timestamp("signature_captured_at"),
    photoUrl: varchar("photo_url", { length: 500 }),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_farms_farm_id").on(table.farmId),
    index("idx_farms_address").on(table.addressId),
    index("idx_farms_verification").on(table.verificationStatus),
    index("idx_farms_parent").on(table.parentFarmId),
    index("idx_farms_type").on(table.type),
    index("idx_farms_location_gist").using("gist", table.location),
    pgPolicy("farm_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.id),
      withCheck: adminAndVetWrite,
    }),
  ],
);
