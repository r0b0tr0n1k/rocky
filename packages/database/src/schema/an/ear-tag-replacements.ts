// ── Drizzle Schema: Ear Tag Replacements
// Based on: Eartags.PDF specification
// Tracks replacement of lost, damaged, or defective ear tags

import { pgTable, uuid, varchar, timestamp, date, integer, text, index, pgPolicy } from "drizzle-orm/pg-core";
import { farms } from "../hk/farms.js";
import { users } from "../sm/users.js";
import { rlsForFarmColumn, adminWrite } from "../rls-helpers.js";
import { earTagReplacementReasonPgEnum } from "../../schemas/enums/ear-tag-replacement-reason.js";
import { earTagReplacementStatusPgEnum } from "../../schemas/enums/ear-tag-replacement-status.js";
import { EAR_TAG_REPLACEMENT_STATUS } from "../../constants/ear-tag-replacement-status.js";

export const earTagReplacements = pgTable(
  "ear_tag_replacements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Reference
    replacementNumber: varchar("replacement_number", { length: 50 }).notNull().unique(),

    // Animal information
    animalId: uuid("animal_id").notNull(),
    oldTagNumber: varchar("old_tag_number", { length: 8 }).notNull(),
    newTagNumber: varchar("new_tag_number", { length: 8 }).notNull(),

    // Farm
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Reason
    reason: earTagReplacementReasonPgEnum("reason").notNull(),
    reasonDetails: text("reason_details"),

    // Status
    status: earTagReplacementStatusPgEnum("status").notNull().default(EAR_TAG_REPLACEMENT_STATUS.PENDING),

    // Dates
    reportedDate: date("reported_date").notNull(),
    replacementDate: date("replacement_date"),

    // People involved
    reportedBy: uuid("reported_by").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),

    // New tag allocation
    newTagAllocationId: uuid("new_tag_allocation_id"),

    // Digital evidence
    photoOldTagUrl: varchar("photo_old_tag_url", { length: 500 }),
    photoNewTagUrl: varchar("photo_new_tag_url", { length: 500 }),
    photoAnimalUrl: varchar("photo_animal_url", { length: 500 }),

    // Notes
    notes: text("notes"),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_ear_tag_replacements_number").on(table.replacementNumber),
    index("idx_ear_tag_replacements_animal").on(table.animalId),
    index("idx_ear_tag_replacements_farm").on(table.farmId),
    index("idx_ear_tag_replacements_status").on(table.status),
    index("idx_ear_tag_replacements_date").on(table.reportedDate),
    pgPolicy("ear_tag_replacement_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.farmId),
      withCheck: adminWrite,
    }),
  ],
);
