// ── Drizzle Schema: Unified Movement Table ──
// Replaces: Two-phase departure + arrival pattern
// Modern: Single record with parentMovementId for multi-leg (markets)

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
import { animals } from "./animals";
import { farms } from "../hk/farms";

export const movements = pgTable(
	"movements",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Animal
		animalId: uuid("animal_id")
			.notNull()
			.references(() => animals.id),

		// Movement endpoints
		fromFarmId: uuid("from_farm_id").references(() => farms.id),
		toFarmId: uuid("to_farm_id")
			.notNull()
			.references(() => farms.id),

		// Type
		type: varchar("type", { length: 30 }).notNull(),

		// Dates
		movementDate: date("movement_date").notNull(),
		arrivalDate: date("arrival_date"),

		// Multi-leg (market transactions: 4 legs linked)
		parentMovementId: uuid("parent_movement_id"),
		legOrder: integer("leg_order").default(0),

		// Documentation
		reason: varchar("reason", { length: 100 }),
		documentRef: varchar("document_ref", { length: 50 }),

		// Death
		deathDate: date("death_date"),
		deathCause: varchar("death_cause", { length: 100 }),

		// Import/Export
		importCountry: varchar("import_country", { length: 3 }),
		exportCountry: varchar("export_country", { length: 3 }),
		breedingState: varchar("breeding_state", { length: 3 }),
		breedingPlaceId: varchar("breeding_place_id", { length: 50 }),

		// Verification
		isVerified: boolean("is_verified").notNull().default(false),
		verifiedAt: timestamp("verified_at"),
		verifiedBy: uuid("verified_by"),

		// Audit
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
		validTo: timestamp("valid_to"),
	},
	(table) => [
		index("idx_movements_animal").on(table.animalId),
		index("idx_movements_date").on(table.movementDate),
		index("idx_movements_type").on(table.type),
		index("idx_movements_from").on(table.fromFarmId),
		index("idx_movements_to").on(table.toFarmId),
		index("idx_movements_parent").on(table.parentMovementId),
		pgPolicy("movement_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) IN ('VETERINARIAN', 'TECHNICIAN')
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
				OR (current_setting('app.current_role', true) IN ('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP')
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

export const movementsRelations = relations(movements, ({ one }) => ({
	animal: one(animals, {
		fields: [movements.animalId],
		references: [animals.id],
	}),
	fromFarm: one(farms, {
		fields: [movements.fromFarmId],
		references: [farms.id],
	}),
	toFarm: one(farms, {
		fields: [movements.toFarmId],
		references: [farms.id],
	}),
	parentMovement: one(movements, {
		fields: [movements.parentMovementId],
		references: [movements.id],
	}),
}));
