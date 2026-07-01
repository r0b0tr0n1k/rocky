// ── Drizzle Schema: Pasture Declarations ──
// Replaces: FS - registration_MK(v0.91).pdf §Pasture (p11)
// Types: MOUNTAIN (seasonal), VILLAGE (daily)

import {
	pgTable,
	uuid,
	varchar,
	boolean,
	timestamp,
	date,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const pastureDeclarations = pgTable(
	"pasture_declarations",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		fromFarmId: uuid("from_farm_id").notNull(),
		toFarmId: uuid("to_farm_id").notNull(),

		departureDate: date("departure_date").notNull(),
		expectedReturnDate: date("expected_return_date").notNull(),
		pastureType: varchar("pasture_type", { length: 20 }).notNull(),

		animalIds: uuid("animal_ids").array().notNull(),

		isActive: boolean("is_active").notNull().default(true),
		completedAt: date("completed_at"),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
	},
	(table) => [
		index("idx_pasture_from").on(table.fromFarmId),
		index("idx_pasture_to").on(table.toFarmId),
		index("idx_pasture_type").on(table.pastureType),
		pgPolicy("pasture_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) = 'VETERINARIAN'
						AND (from_farm_id IN (
							SELECT f.id FROM farms f
							JOIN addresses a ON f.address_id = a.id
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						) OR to_farm_id IN (
							SELECT f.id FROM farms f
							JOIN addresses a ON f.address_id = a.id
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						)))
				OR (current_setting('app.current_role', true) = 'FARMER'
						AND (from_farm_id IN (
							SELECT fs.farm_id FROM farm_subjects fs
							WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
						) OR to_farm_id IN (
							SELECT fs.farm_id FROM farm_subjects fs
							WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
						)))
			`,
		}),
	],
);
