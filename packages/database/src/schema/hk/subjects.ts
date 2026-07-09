// ── Drizzle Schema: Subjects (Keepers/Holders) ──
// Replaces: HK_SUBJ (Oracle HK.PDF)

import { sql } from "drizzle-orm";
import { boolean, index, integer, pgPolicy, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { ADMIN_ROLES, adminWrite, farmInOrgArea, isRoleIn, USER_ROLE } from "../rls-helpers.js";
import { farms } from "./farms.js";

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Names (dual language - legacy SHORT_NAME/SHORT_NAME_1)
    shortName: varchar("short_name", { length: 50 }).notNull(),
    shortNameAlt: varchar("short_name_alt", { length: 50 }),
    firstName: varchar("first_name", { length: 50 }),
    firstNameAlt: varchar("first_name_alt", { length: 50 }),
    lastName: varchar("last_name", { length: 50 }),
    lastNameAlt: varchar("last_name_alt", { length: 50 }),

    // Organization (when subject is a legal entity)
    companyName: varchar("company_name", { length: 100 }),

    // Identification
    personalId: varchar("personal_id", { length: 20 }),
    vatNumber: varchar("vat_number", { length: 20 }),
    phoneNumber: varchar("phone_number", { length: 30 }),
    email: varchar("email", { length: 255 }),

    // Address (primary)
    addressId: uuid("address_id"),

    // Status
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_subjects_personal_id").on(table.personalId),
    index("idx_subjects_vat").on(table.vatNumber),
    index("idx_subjects_name").on(table.shortName),
    pgPolicy("subject_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES, USER_ROLE.VETERINARIAN)}
        OR ${table.id} IN (
          SELECT fs.subject_id FROM farm_subjects fs
          WHERE ${farmInOrgArea(sql`fs.farm_id`)}
        )
      )`,
      withCheck: adminWrite,
    }),
  ],
);
