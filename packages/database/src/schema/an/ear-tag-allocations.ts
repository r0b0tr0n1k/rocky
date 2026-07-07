// ── Drizzle Schema: Ear Tag Allocations to Farms
// Based on: Eartags.PDF specification
// Tracks distribution of ear tags from central inventory to farms

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
import { ALLOCATION_STATUS } from "../../constants/allocation-status.js";
import { DISTRIBUTION_METHOD } from "../../constants/distribution-method.js";
import { allocationStatusPgEnum } from "../../schemas/enums/allocation-status.js";
import { contingentTypePgEnum } from "../../schemas/enums/contingent-type.js";
import { distributionMethodPgEnum } from "../../schemas/enums/distribution-method.js";
import { farms } from "../hk/farms.js";
import { organizations } from "../sm/organizations.js";
import { adminWrite, rlsForFarmColumn } from "../rls-helpers.js";
import { users } from "../sm/users.js";

export const earTagAllocations = pgTable(
  "ear_tag_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Contingent type (supplier block, VD reserve, VS distribution)
    contingentType: contingentTypePgEnum("contingent_type"),

    // Farm receiving the tags
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id),

    // Supplier (nullable for central reserves)
    supplierOrganizationId: uuid("supplier_organization_id").references(() => organizations.id),

    // Allocation reference
    allocationNumber: varchar("allocation_number", { length: 50 }).notNull().unique(),
    allocationDate: date("allocation_date").notNull(),

    // Tags in this allocation
    typeId: uuid("type_id").notNull(),
    quantity: integer("quantity").notNull(),

    // Tag range (if sequential)
    tagRangeStart: varchar("tag_range_start", { length: 8 }),
    tagRangeEnd: varchar("tag_range_end", { length: 8 }),

    // Individual tag IDs (array for non-sequential allocations)
    tagIds: uuid("tag_ids").array(),

    // Distribution details
    distributionMethod: distributionMethodPgEnum("distribution_method")
      .notNull()
      .default(DISTRIBUTION_METHOD.VD_DELIVERY),
    deliveryDate: date("delivery_date"),
    receivedBy: uuid("received_by").references(() => users.id),
    receivedDate: timestamp("received_date"),

    // Digital evidence (for field delivery)
    signatureData: text("signature_data"),
    photoUrl: varchar("photo_url", { length: 500 }),
    gpsLocation: varchar("gps_location", { length: 100 }),

    // Status
    status: allocationStatusPgEnum("status").notNull().default(ALLOCATION_STATUS.PENDING),

    // Notes
    notes: text("notes"),

    // Internal tracking
    requestedBy: uuid("requested_by").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_ear_tag_allocations_number").on(table.allocationNumber),
    index("idx_ear_tag_allocations_farm").on(table.farmId),
    index("idx_ear_tag_allocations_date").on(table.allocationDate),
    index("idx_ear_tag_allocations_status").on(table.status),
    pgPolicy("ear_tag_allocation_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: rlsForFarmColumn(table.farmId),
      withCheck: adminWrite,
    }),
  ],
);
