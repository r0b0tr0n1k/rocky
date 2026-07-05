// ── Drizzle Schema: Ear Tag Procurement Orders
// Based on: Eartags.PDF specification
// Tracks orders for ear tag procurement from suppliers

import {
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
import { EAR_TAG_ORDER_STATUS } from "../../constants/ear-tag-order-status.js";
import { earTagOrderStatusPgEnum } from "../../schemas/enums/ear-tag-order-status.js";
import { adminWrite, rlsForOrgColumn } from "../rls-helpers.js";
import { organizations } from "../sm/organizations.js";
import { users } from "../sm/users.js";

export const earTagOrders = pgTable(
  "ear_tag_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Order identification
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    orderDate: date("order_date").notNull(),

    // Organization placing the order
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    supplierOrganizationId: uuid("supplier_organization_id")
      .references(() => organizations.id),

    // Supplier information
    supplierName: varchar("supplier_name", { length: 100 }).notNull(),
    supplierCode: varchar("supplier_code", { length: 50 }),
    supplierContact: varchar("supplier_contact", { length: 100 }),
    supplierAddress: text("supplier_address"),

    // Order details by type (JSON text)
    items: text("items").notNull(),

    // Totals
    totalQuantity: integer("total_quantity").notNull(),
    totalAmount: varchar("total_amount", { length: 20 }),

    // Delivery
    expectedDeliveryDate: date("expected_delivery_date"),
    actualDeliveryDate: date("actual_delivery_date"),

    // Status
    status: earTagOrderStatusPgEnum("status").notNull().default(EAR_TAG_ORDER_STATUS.DRAFT),

    // Approval workflow
    requestedBy: uuid("requested_by").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),

    // Notes
    notes: text("notes"),
    internalNotes: text("internal_notes"),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_ear_tag_orders_number").on(table.orderNumber),
    index("idx_ear_tag_orders_org").on(table.organizationId),
    index("idx_ear_tag_orders_date").on(table.orderDate),
    index("idx_ear_tag_orders_status").on(table.status),
    pgPolicy("ear_tag_order_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForOrgColumn(table.organizationId),
      withCheck: adminWrite,
    }),
  ],
);
