// ── Drizzle Schema: Farm Books ──
// Replaces: Workflow 17-04-03.pdf §Instance 1, 2, 3
// Lifecycle tracking for printed farm book bundles (holding ID card,
// keeper passport, blank cattle passports, tagging receipts)

import { sql } from "drizzle-orm";
import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farmBookStatusPgEnum } from "../../schemas/enums/farm-book-status.js";
import { farms } from "./farms.js";
import { ADMIN_ROLES, farmInOrgArea, isRoleIn, ORG_READ_ROLES } from "../rls-helpers.js";

export const farmBooks = pgTable(
  "farm_books",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Farm this book belongs to
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Status lifecycle
    status: farmBookStatusPgEnum("status").notNull(),

    // Timestamps for each stage
    assembledAt: timestamp("assembled_at"),
    printedAt: timestamp("printed_at"),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),

    // Who handled each stage
    assembledBy: uuid("assembled_by"),
    printedBy: uuid("printed_by"),

    // Delivery tracking
    shippedToVs: boolean("shipped_to_vs").notNull().default(false),
    deliveredToKeeper: boolean("delivered_to_keeper").notNull().default(false),
    vsId: uuid("vs_id"),

    // Reference to reprint chain
    reprintOf: uuid("reprint_of"),

    // Notes
    notes: text("notes"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_farm_books_farm").on(table.farmId),
    index("idx_farm_books_status").on(table.status),
    index("idx_farm_books_vs").on(table.vsId),
    pgPolicy("farm_book_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(...ORG_READ_ROLES)} AND ${farmInOrgArea(table.farmId)})
      )`,
    }),
  ],
);
