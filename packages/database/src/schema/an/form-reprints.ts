// ── Drizzle Schema: Form Reprints ──
// Replaces: Workflow 17-04-03.pdf §Instance 17
// Document consumption/loss tracking and reprint workflow

import { sql } from "drizzle-orm";
import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { REPRINT_STATUS } from "../../constants/reprint-status.js";
import { reprintReasonPgEnum } from "../../schemas/enums/reprint-reason.js";
import { reprintStatusPgEnum } from "../../schemas/enums/reprint-status.js";
import { farms } from "../hk/farms.js";
import {
  ADMIN_ROLES,
  FARM_READ_ROLES,
  farmInOrgArea,
  farmOwnedByUser,
  isRoleIn,
  ORG_READ_ROLES,
} from "../rls-helpers.js";

export const formReprints = pgTable(
  "form_reprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Farm requesting reprint
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Document details
    documentType: varchar("document_type", { length: 100 }).notNull(),
    originalDocumentRef: varchar("original_document_ref", { length: 100 }),

    // Reason
    reason: reprintReasonPgEnum("reason").notNull(),
    notes: text("notes"),

    // Reprint lifecycle
    status: reprintStatusPgEnum("status").notNull().default(REPRINT_STATUS.REQUESTED),
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),

    // Shipment tracking
    shippedToVs: boolean("shipped_to_vs").notNull().default(false),
    deliveredToKeeper: boolean("delivered_to_keeper").notNull().default(false),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_form_reprints_farm").on(table.farmId),
    index("idx_form_reprints_status").on(table.status),
    index("idx_form_reprints_reason").on(table.reason),
    pgPolicy("form_reprint_access_policy", {
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
