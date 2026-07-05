// ── Drizzle Schema: Address Hierarchy with PostGIS ──
// Replaces: HK_STATES, HK_ZIP_CODES, HK_COMMUNES, HK_ADMIN_UNITS, HK_ADDRESSES
// Modern: PostGIS geometry(Point, 4326) replaces X/Y/Z coordinates

import { sql } from "drizzle-orm";
import { boolean, index, integer, pgPolicy, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";

// ── STATES ──
export const states = pgTable(
  "states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),
    name: varchar("name", { length: 50 }).notNull(),
    shortName: varchar("short_name", { length: 3 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => ({
    shortNameIdx: uniqueIndex("idx_states_short_name").on(table.shortName),
  }),
);

// ── ZIP CODES ──
export const zipCodes = pgTable(
  "zip_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),
    name: varchar("name", { length: 50 }).notNull(),
    zipCode: varchar("zip_code", { length: 20 }).notNull(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => ({
    zipIdx: index("idx_zip_codes_code").on(table.zipCode),
    stateIdx: index("idx_zip_codes_state").on(table.stateId),
  }),
);

// ── COMMUNES ──
export const communes = pgTable(
  "communes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),
    name: varchar("name", { length: 50 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => ({
    nameIdx: index("idx_communes_name").on(table.name),
  }),
);

// ── ADMIN UNITS ──
export const adminUnits = pgTable(
  "admin_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),
    name: varchar("name", { length: 50 }).notNull(),
    auId: varchar("au_id", { length: 20 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => ({
    auIdIdx: index("idx_admin_units_auid").on(table.auId),
  }),
);

// ── ADDRESSES (PostGIS powered) ──
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    // Address text
    city: varchar("city", { length: 30 }).notNull(),
    street: varchar("street", { length: 50 }),
    houseNumber: varchar("house_number", { length: 10 }).notNull(),
    houseNumberAdd: varchar("house_number_add", { length: 5 }),

    // Foreign keys
    zipCodeId: uuid("zip_code_id")
      .notNull()
      .references(() => zipCodes.id),
    communeId: uuid("commune_id").references(() => communes.id),
    adminUnitId: uuid("admin_unit_id").references(() => adminUnits.id),

    // Location (PostGIS point - replaces legacy X/Y/Z NUMBER(10,3))
    location: varchar("location", { length: 100 }),

    // Geocoding cache
    geocodedAddress: varchar("geocoded_address", { length: 500 }),
    geocodedAt: timestamp("geocoded_at"),

    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_addresses_zip").on(table.zipCodeId),
    index("idx_addresses_commune").on(table.communeId),
    index("idx_addresses_city").on(table.city),
    pgPolicy("address_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`true`,
      withCheck: adminWrite,
    }),
  ],
);
