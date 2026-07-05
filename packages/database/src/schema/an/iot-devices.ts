// ── Drizzle Schema: IoT Device Registry ──
// Tracks IoT/sensor hardware (GNSS ear tags, LPWAN collars, ruminal boluses, etc.)
// Extends the pda_devices (smartphone) registry pattern for autonomous field devices.
//
// This is the foundational table for Phases 1-4 of the biologging roadmap.
// No event queues or real-time processing — just device inventory + assignment.

import { boolean, date, index, integer, jsonb, pgPolicy, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { iotDeviceStatusPgEnum } from "../../schemas/enums/iot-device-status.js";
import { transmissionTypePgEnum } from "../../schemas/enums/transmission-type.js";
import { adminWrite, rlsForFarmColumn } from "../rls-helpers.js";
import { animals } from "./animals.js";
import { farms } from "../hk/farms.js";

export const iotDevices = pgTable(
	"iot_devices",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Device identity
		deviceEui: varchar("device_eui", { length: 64 }).unique(),
		// EUI-64, IMEI, or similar globally unique identifier

		// Hardware metadata
		manufacturer: varchar("manufacturer", { length: 100 }),
		model: varchar("model", { length: 100 }),
		serialNumber: varchar("serial_number", { length: 100 }),
		firmwareVersion: varchar("firmware_version", { length: 30 }),

		// Transmission
		transmissionType: transmissionTypePgEnum("transmission_type"),
		transmissionIntervalSeconds: integer("transmission_interval_seconds"),

		// Current assignment
		assignedToAnimalId: uuid("assigned_to_animal_id").references(() => animals.id),
		assignedToFarmId: uuid("assigned_to_farm_id").references(() => farms.id),
		activationDate: date("activation_date"),
		deactivationDate: date("deactivation_date"),

		// Power
		batteryLevel: integer("battery_level"),
		batteryLastChecked: timestamp("battery_last_checked"),

		// Last contact
		lastTransmissionAt: timestamp("last_transmission_at"),

		// Status
		status: iotDeviceStatusPgEnum("status").notNull().default("active"),

		// Audit
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
		validTo: timestamp("valid_to"),
	},
	(table) => [
		index("idx_iot_devices_animal").on(table.assignedToAnimalId),
		index("idx_iot_devices_farm").on(table.assignedToFarmId),
		index("idx_iot_devices_status").on(table.status),
		index("idx_iot_devices_transmission").on(table.transmissionType),
		index("idx_iot_devices_last_tx").on(table.lastTransmissionAt),
		pgPolicy("iot_device_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`(
				${adminWrite}
				OR (${rlsForFarmColumn(table.assignedToFarmId)})
			)`,
			withCheck: adminWrite,
		}),
	],
);
