// ── Drizzle Schema: Animal Geofence Events ──
// Records when animals enter/exit geofence boundaries.
// Populated by either:
//   1. Manual logging by farmer/vet
//   2. Automated processing of sensor_readings with LOCATION type
//   3. Future real-time geofence evaluation engine
//
// For now: manual CRUD + basic query support. No event brokers.

import { index, pgPolicy, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { geometry } from "../../geometry/postgis.js";
import { geofenceEventTypePgEnum } from "../../schemas/enums/geofence-event-type.js";
import { geofenceEventSourcePgEnum } from "../../schemas/enums/geofence-event-source.js";
import { adminWrite, rlsForFarmColumn } from "../rls-helpers.js";
import { animals } from "./animals.js";
import { geofences } from "./geofences.js";

export const animalGeofenceEvents = pgTable(
	"animal_geofence_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// References
		animalId: uuid("animal_id").notNull().references(() => animals.id),
		geofenceId: uuid("geofence_id").notNull().references(() => geofences.id),
		farmId: uuid("farm_id"),

		// Event details
		eventType: geofenceEventTypePgEnum("event_type").notNull(),

		eventAt: timestamp("event_at").notNull(),

		// Location at event time (PostGIS Point)
		location: geometry("location"),

		// Source of the event
		source: geofenceEventSourcePgEnum("source").default("manual"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("idx_geofence_events_animal").on(table.animalId),
		index("idx_geofence_events_geofence").on(table.geofenceId),
		index("idx_geofence_events_farm").on(table.farmId),
		index("idx_geofence_events_type").on(table.eventType),
		index("idx_geofence_events_time").on(table.eventAt),
		pgPolicy("geofence_event_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`(
				${adminWrite}
				OR (${rlsForFarmColumn(table.farmId)})
			)`,
		}),
	],
);
