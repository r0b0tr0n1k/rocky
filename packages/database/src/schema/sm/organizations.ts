// ── Drizzle Schema: Organizations & Areas ──
// Replaces: SM_ORGANIZATIONS, SM_ORG_AREA (Oracle SM.PDF)

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { USER_ROLE, isRoleIn, currentOrgId, ADMIN_ROLES } from "../rls-helpers.js";
import { orgTypePgEnum } from "../../schemas/enums/org-type.js";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name1: varchar("name1", { length: 100 }).notNull(),
    name2: varchar("name2", { length: 100 }),
    name3: varchar("name3", { length: 100 }),

    address: jsonb("address").$type<{
      street: string;
      city: string;
      zipCode: string;
    }>(),

    phone: varchar("phone", { length: 30 }),
    fax: varchar("fax", { length: 30 }),
    email: varchar("email", { length: 255 }),

    orgType: orgTypePgEnum("org_type").notNull(),
    parentId: uuid("parent_id"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_org_type").on(table.orgType),
    index("idx_org_parent").on(table.parentId),
    pgPolicy("org_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(USER_ROLE.SUPER_ADMIN, USER_ROLE.VD_ADMIN)}
        OR ${table.id} = ${currentOrgId}
        OR ${table.parentId} = ${currentOrgId}
      )`,
    }),
  ],
);

// ── Organization Coverage Areas (replaces SM_ORG_AREA) ──
export const orgAreas = pgTable(
  "org_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    communeId: uuid("commune_id"),
    region: varchar("region", { length: 100 }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_org_area_org").on(table.organizationId),
    pgPolicy("org_area_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.organizationId} = ${currentOrgId}
      )`,
    }),
  ],
);
