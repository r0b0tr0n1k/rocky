// ── Drizzle Schema: Slaughter Records ──
// Replaces: FS - registration_MK(v0.91).pdf §Slaughtering (p10)

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	date,
	integer,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const slaughterRecords = pgTable(
	"slaughter_records",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		animalId: uuid("animal_id"),
		fromFarmId: uuid("from_farm_id"),
		slaughterhouseId: uuid("slaughterhouse_id").notNull(),

		arrivalDate: date("arrival_date"),
		slaughterDate: date("slaughter_date").notNull(),
		slaughterNumber: varchar("slaughter_number", { length: 50 }),
		massType: varchar("mass_type", { length: 20 }),
		mass: integer("mass"),

		importCountry: varchar("import_country", { length: 3 }),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
	},
	(table) => [
		index("idx_slaughter_animal").on(table.animalId),
		index("idx_slaughter_house").on(table.slaughterhouseId),
		index("idx_slaughter_date").on(table.slaughterDate),
		pgPolicy("slaughter_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) = 'VETERINARIAN'
						AND slaughterhouse_id IN (
							SELECT f.id FROM farms f
							JOIN addresses a ON f.address_id = a.id
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						))
				OR (current_setting('app.current_role', true) = 'SLAUGHTERHOUSE_OP'
						AND slaughterhouse_id IN (
							SELECT fs.farm_id FROM farm_subjects fs
							WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
						))
			`,
		}),
	],
);
