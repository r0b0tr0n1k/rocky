// ── Drizzle Schema: Animal Registration ──
// Replaces: Legacy animal tables from FS - registration_MK(v0.91).pdf

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	date,
	boolean,
	integer,
	uniqueIndex,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { farms } from "../hk/farms";
import { movements } from "./movements";
import { birthNotifications } from "./birth-notifications";

export const animals = pgTable(
	"animals",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Ear tag identification
		stateCode: varchar("state_code", { length: 3 }).notNull().default("MK"),
		earTagNumber: varchar("ear_tag_number", { length: 8 }).notNull(),

		// Birth info
		birthDate: date("birth_date").notNull(),
		sex: varchar("sex", { length: 10 }).notNull(),
		breed: varchar("breed", { length: 50 }),
		birthType: varchar("birth_type", { length: 20 }),
		birthWeight: integer("birth_weight"),

		// Parents
		motherId: uuid("mother_id"),
		fatherId: uuid("father_id"),

		// Current location
		currentFarmId: uuid("current_farm_id")
			.notNull()
			.references(() => farms.id),

		// Status
		status: varchar("status", { length: 20 }).notNull().default("ALIVE"),

		// Tagging (legacy: 1st tagging campaign flag)
		isFirstTagging: boolean("is_first_tagging").notNull().default(false),
		taggingDate: date("tagging_date"),

		// Import tracking
		imported: boolean("imported").notNull().default(false),
		importCountry: varchar("import_country", { length: 3 }),
		importDate: date("import_date"),

		// Audit
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
		validTo: timestamp("valid_to"),
	},
	(table) => [
		uniqueIndex("idx_animals_ear_tag").on(table.stateCode, table.earTagNumber),
		index("idx_animals_farm").on(table.currentFarmId),
		index("idx_animals_status").on(table.status),
		index("idx_animals_mother").on(table.motherId),
		pgPolicy("animal_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) IN ('VETERINARIAN', 'TECHNICIAN')
						AND current_farm_id IN (
							SELECT f.id FROM farms f
							JOIN addresses a ON f.address_id = a.id
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						))
				OR (current_setting('app.current_role', true) IN ('FARMER', 'SLAUGHTERHOUSE_OP')
						AND current_farm_id IN (
							SELECT fs.farm_id FROM farm_subjects fs
							JOIN subjects s ON fs.subject_id = s.id
							WHERE s.personal_id = current_setting('app.current_user_id', true)::text
						))
			`,
			withCheck: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN')
			`,
		}),
	],
);

export const animalsRelations = relations(animals, ({ one, many }) => ({
	currentFarm: one(farms, {
		fields: [animals.currentFarmId],
		references: [farms.id],
	}),
	mother: one(animals, {
		fields: [animals.motherId],
		references: [animals.id],
	}),
	movements: many(movements),
}));

// ── Animal Parent History (complex lineage support) ──
export const animalParents = pgTable(
	"animal_parents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		animalId: uuid("animal_id")
			.notNull()
			.references(() => animals.id, { onDelete: "cascade" }),
		parentId: uuid("parent_id")
			.notNull()
			.references(() => animals.id, { onDelete: "cascade" }),
		parentType: varchar("parent_type", { length: 10 }).notNull(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("idx_animal_parents_animal").on(table.animalId),
		index("idx_animal_parents_parent").on(table.parentId),
		pgPolicy("animal_parent_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR EXISTS (
					SELECT 1 FROM animals a
					WHERE a.id = animal_id
					AND a.current_farm_id IN (
						SELECT f.id FROM farms f
						JOIN addresses a2 ON f.address_id = a2.id
						JOIN org_areas oa ON a2.commune_id = oa.commune_id
						WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
					)
				)
			`,
		}),
	],
);
