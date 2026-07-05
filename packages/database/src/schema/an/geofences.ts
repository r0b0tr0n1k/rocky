// ── Drizzle Schema: Geofences ──
// Livestock geofence definitions for farm/pasture boundaries and exclusion zones.
// Geometry stored as jsonb with Zod validation (GeofenceGeometry discriminated union).
// PostGIS polygon column can be added later for spatial query performance.
//
// Uses the existing GeofenceGeometry types from packages/database/src/geometry/
// which were already written but had no production table to attach to.

import type { GeofenceGeometry } from "../../geometry/coordinate-schema.js";
import { boolean, index, jsonb, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { fenceTypePgEnum } from "../../schemas/enums/fence-type.js";
import { adminWrite, rlsForFarmColumn } from "../rls-helpers.js";
import { farms } from "../hk/farms.js";
import { pastureDeclarations } from "./pasture.js";

export const geofences = pgTable(
	"geofences",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Identification
		name: varchar("name", { length: 200 }).notNull(),
		description: text("description"),

		// Farm/pasture association
		farmId: uuid("farm_id").notNull().references(() => farms.id),
		pastureId: uuid("pasture_id").references(() => pastureDeclarations.id),

		// Geofence shape — validated at API layer via GeofenceGeometry Zod schema
		geometry: jsonb("geometry").$type<GeofenceGeometry>().notNull(),

		// Type
		fenceType: fenceTypePgEnum("fence_type").notNull(),

		// Status
		isActive: boolean("is_active").notNull().default(true),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
		validTo: timestamp("valid_to"),
	},
	(table) => [
		index("idx_geofences_farm").on(table.farmId),
		index("idx_geofences_pasture").on(table.pastureId),
		index("idx_geofences_type").on(table.fenceType),
		index("idx_geofences_active").on(table.isActive),
		pgPolicy("geofence_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`(
				${adminWrite}
				OR (${rlsForFarmColumn(table.farmId)})
			)`,
			withCheck: adminWrite,
		}),
	],
);
