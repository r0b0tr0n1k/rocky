// ── Drizzle Schema: Ear Tag Takeovers
// Based on: Eartags.PDF - ET_TAKEOVERS
// Persists supplier collection events for audit trail and cancellation checks

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  index,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { earTagOrders } from "./ear-tag-orders.js";
import { organizations } from "../sm/organizations.js";
import { users } from "../sm/users.js";
import { USER_ROLE, isRoleIn, currentOrgId } from "../rls-helpers.js";
import { takeoverStatusPgEnum } from "../../schemas/enums/takeover-status.js";
import { TAKEOVER_STATUS } from "../../constants/takeover-status.js";

export const earTagTakeovers = pgTable(
  "ear_tag_takeovers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Order being taken over (collected)
    orderId: uuid("order_id")
      .notNull()
      .references(() => earTagOrders.id),

    // Supplier performing the takeover
    supplierOrganizationId: uuid("supplier_organization_id")
      .notNull()
      .references(() => organizations.id),

    // Status
    status: takeoverStatusPgEnum("status").notNull().default(TAKEOVER_STATUS.COMPLETED),

    // Collection details
    totalTagsCollected: integer("total_tags_collected").notNull(),

    // File reference (for generated .txt export)
    exportedFileName: varchar("exported_file_name", { length: 255 }),

    // Notes
    notes: text("notes"),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_takeovers_order").on(table.orderId),
    index("idx_takeovers_supplier").on(table.supplierOrganizationId),
    index("idx_takeovers_status").on(table.status),
    pgPolicy("ear_tag_takeover_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
        OR ${table.supplierOrganizationId} = ${currentOrgId}
      )`,
      withCheck: sql`(
        ${isRoleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN, USER_ROLE.VD_STAFF)}
        OR ${table.supplierOrganizationId} = ${currentOrgId}
      )`,
    }),
  ],
);
