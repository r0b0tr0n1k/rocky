// ── Drizzle Schema: Sensor Readings ──
// Append-only time-series data from IoT devices.
// Each row is one sensor reading at a point in time.
//
// readingType and processingStage are branded pgEnums — consistent with all Rocky enums.
// Location is nullable PostGIS point — not all sensors provide GNSS.
// No UPDATE — errors are corrected by adding corrected readings.

import { index, jsonb, numeric, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { geometry } from "../../geometry/postgis.js";
import { readingTypePgEnum } from "../../schemas/enums/reading-type.js";
import { processingStagePgEnum } from "../../schemas/enums/processing-stage.js";
import { adminWrite, rlsForFarmColumn } from "../rls-helpers.js";
import { iotDevices } from "./iot-devices.js";
import { animals } from "./animals.js";
import { farms } from "../hk/farms.js";

export const sensorReadings = pgTable(
	"sensor_readings",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Source
		deviceId: uuid("device_id").notNull().references(() => iotDevices.id),
		animalId: uuid("animal_id").references(() => animals.id),
		farmId: uuid("farm_id").references(() => farms.id),

		// Temporal
		recordedAt: timestamp("recorded_at").notNull(),
		// When the sensor took the measurement (device timestamp)
		ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
		// When Rocky received the data (server timestamp)

		// Reading
		readingType: readingTypePgEnum("reading_type").notNull(),

		valueNumeric: numeric("value_numeric", { precision: 20, scale: 6 }),
		valueText: text("value_text"),
		unit: varchar("unit", { length: 20 }),

		// Location at time of reading (PostGIS Point)
		location: geometry("location"),

		// Raw payload for reprocessing
		rawPayload: jsonb("raw_payload"),

		// Processing stage
		processingStage: processingStagePgEnum("processing_stage").default("raw"),
		processedAt: timestamp("processed_at"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("idx_sensor_readings_device").on(table.deviceId),
		index("idx_sensor_readings_animal").on(table.animalId),
		index("idx_sensor_readings_farm").on(table.farmId),
		index("idx_sensor_readings_type").on(table.readingType),
		index("idx_sensor_readings_recorded").on(table.recordedAt),
		pgPolicy("sensor_reading_access_policy", {
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
