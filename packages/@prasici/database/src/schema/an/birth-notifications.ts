// ── Drizzle Schema: Birth Notifications ──
// Replaces: Workflow 17-04-03.pdf §Instance 8
// Tracks birth events, 20-day tagging deadlines, vet assignments

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	date,
	boolean,
	integer,
	text,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { farms } from "../hk/farms";

export const birthNotifications = pgTable(
	"birth_notifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Farm
		farmId: uuid("farm_id")
			.notNull()
			.references(() => farms.id),

		// Notification
		notificationDate: date("notification_date").notNull(),
		expectedBirthDate: date("expected_birth_date"),
		actualBirthDate: date("actual_birth_date"),

		// Birth
		numberOfCalves: integer("number_of_calves").notNull().default(1),
		motherAnimalId: uuid("mother_animal_id"),
		notes: text("notes"),

		// Source
		source: varchar("source", { length: 20 }).notNull().default("MOBILE"),

		// Status
		status: varchar("status", { length: 30 }).notNull().default("PENDING"),

		// Assignment
		assignedTo: uuid("assigned_to"),
		assignedAt: timestamp("assigned_at"),

		// 20-day deadline (legacy rule)
		taggingDeadline: date("tagging_deadline").notNull(),
		taggedAt: date("tagged_at"),
		taggingExceeded: boolean("tagging_exceeded").notNull().default(false),

		// Resulting animals
		animalIds: uuid("animal_ids").array(),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
		validTo: timestamp("valid_to"),
	},
	(table) => [
		index("idx_birth_notifications_farm").on(table.farmId),
		index("idx_birth_notifications_status").on(table.status),
		index("idx_birth_notifications_deadline").on(table.taggingDeadline),
		index("idx_birth_notifications_assigned").on(table.assignedTo),
		pgPolicy("birth_notification_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) IN ('VETERINARIAN', 'TECHNICIAN')
						AND (farm_id IN (
							SELECT f.id FROM farms f
							JOIN addresses a ON f.address_id = a.id
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						) OR assigned_to = current_setting('app.current_user_id', true)::uuid))
				OR (current_setting('app.current_role', true) = 'FARMER'
						AND farm_id IN (
							SELECT fs.farm_id FROM farm_subjects fs
							WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
						))
			`,
			withCheck: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN')
			`,
		}),
	],
);

export const birthNotificationsRelations = relations(
	birthNotifications,
	({ one }) => ({
		farm: one(farms, {
			fields: [birthNotifications.farmId],
			references: [farms.id],
		}),
	}),
);
