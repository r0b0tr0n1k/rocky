// ── Drizzle Schema: Ear Tag Types Catalog
// Based on: Eartags.PDF specification
// Defines types of ear tags (male, female, species-specific, etc.)

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
import { tagCategoryPgEnum } from "../../schemas/enums/tag-category.js";
import { adminWrite } from "../rls-helpers.js";

export const earTagTypes = pgTable(
  "ear_tag_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Type identification
    code: varchar("code", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    nameAlt: varchar("name_alt", { length: 100 }),

    // Category
    category: tagCategoryPgEnum("category").notNull(),
    tagGender: varchar("tag_gender", { length: 10 }),

    // Physical properties
    color: varchar("color", { length: 50 }),
    material: varchar("material", { length: 50 }),
    size: varchar("size", { length: 50 }),

    // Identification range (if applicable)
    prefix: varchar("prefix", { length: 10 }),
    numberRangeStart: integer("number_range_start"),
    numberRangeEnd: integer("number_range_end"),

    // Supplier info
    supplier: varchar("supplier", { length: 100 }),
    supplierCode: varchar("supplier_code", { length: 50 }),

    // Pricing
    unitPrice: varchar("unit_price", { length: 20 }),

    // Descriptive
    description: text("description"),
    imageUrl: varchar("image_url", { length: 500 }),

    // Status
    isActive: boolean("is_active").notNull().default(true),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_ear_tag_types_code").on(table.code),
    index("idx_ear_tag_types_category").on(table.category),
    pgPolicy("ear_tag_type_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
