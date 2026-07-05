// ── Drizzle Schema: Ear Tag Inventory
// Based on: Eartags.PDF specification
// Individual ear tag tracking with full lifecycle management

import { sql } from "drizzle-orm";
import {
  boolean,
  date,
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
import { EAR_TAG_STATUS } from "../../constants/ear-tag-status.js";
import { STATE_CODE } from "../../constants/state-code.js";
import { earTagStatusPgEnum } from "../../schemas/enums/ear-tag-status.js";
import { stateCodePgEnum } from "../../schemas/enums/state-code.js";
import { ADMIN_ROLES, adminWrite, allocationOwnedByUser, isRoleIn } from "../rls-helpers.js";
import { earTagTypes } from "./ear-tag-types.js";

export const earTags = pgTable(
  "ear_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Ear tag identification (MK + 8-digit number)
    stateCode: stateCodePgEnum("state_code").notNull().default(STATE_CODE.MK),
    tagNumber: varchar("tag_number", { length: 8 }).notNull(),

    // Type reference
    typeId: uuid("type_id")
      .notNull()
      .references(() => earTagTypes.id),

    // Current status
    status: earTagStatusPgEnum("status").notNull().default(EAR_TAG_STATUS.AVAILABLE),

    // Order tracking
    orderId: uuid("order_id"),

    // Allocation tracking
    allocationId: uuid("allocation_id"),

    // Animal tracking (when applied)
    animalId: uuid("animal_id"),
    appliedDate: date("applied_date"),

    // Quality control
    isDefective: boolean("is_defective").notNull().default(false),
    defectReason: text("defect_reason"),
    qualityChecked: boolean("quality_checked").notNull().default(false),
    qualityCheckedBy: uuid("quality_checked_by"),
    qualityCheckedAt: timestamp("quality_checked_at"),

    // Batch information
    batchNumber: varchar("batch_number", { length: 50 }),
    manufactureDate: date("manufacture_date"),
    expiryDate: date("expiry_date"),

    // Notes
    notes: text("notes"),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_ear_tags_tag").on(table.stateCode, table.tagNumber),
    index("idx_ear_tags_status").on(table.status),
    index("idx_ear_tags_type").on(table.typeId),
    index("idx_ear_tags_order").on(table.orderId),
    index("idx_ear_tags_allocation").on(table.allocationId),
    index("idx_ear_tags_animal").on(table.animalId),
    pgPolicy("ear_tag_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${allocationOwnedByUser(table.allocationId)}
      )`,
      withCheck: adminWrite,
    }),
  ],
);
