// ── Drizzle Schema: Farms (Holding Register) ──
// Replaces: HK_KMG (Oracle HK.PDF)
// Modern: verification_status replaces legacy temporary tables
//         PostGIS location replaces X/Y/Z coordinates
//         Digital signature + photo for field registration

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	integer,
	text,
	index,
	uniqueIndex,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { addresses } from "./addresses";

export const farms = pgTable(
	"farms",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		legacyId: integer("legacy_id").unique(),

		// 9-digit Farm ID with check digit (legacy formula preserved)
		farmId: varchar("farm_id", { length: 9 }).notNull().unique(),

		// Address relationship
		addressId: uuid("address_id")
			.notNull()
			.references(() => addresses.id),

		// Farm identification
		name: varchar("name", { length: 50 }),
		type: varchar("type", { length: 30 }).notNull().default("FARM"),

		// Hierarchy
		parentFarmId: uuid("parent_farm_id"), // self-referencing FK handled in relations

		// ★ VERIFICATION STATUS — replaces temp tables ★
		verificationStatus: varchar("verification_status", { length: 30 })
			.notNull()
			.default("PENDING_VD_APPROVAL"),
		verificationNote: text("verification_note"),
		verifiedAt: timestamp("verified_at"),
		verifiedBy: uuid("verified_by"),

		// Data source
		dataSource: varchar("data_source", { length: 20 })
			.notNull()
			.default("MOBILE"),

		// GPS location (captured during field registration)
		location: varchar("location", { length: 100 }),

		// Digital evidence
		digitalSignature: text("digital_signature"),
		signatureCapturedAt: timestamp("signature_captured_at"),
		photoUrl: varchar("photo_url", { length: 500 }),

		// Audit
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
		updatedBy: uuid("updated_by"),
		validTo: timestamp("valid_to"),
	},
	(table) => [
		uniqueIndex("idx_farms_farm_id").on(table.farmId),
		index("idx_farms_address").on(table.addressId),
		index("idx_farms_verification").on(table.verificationStatus),
		index("idx_farms_parent").on(table.parentFarmId),
		index("idx_farms_type").on(table.type),
		pgPolicy("farm_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) IN ('VETERINARIAN', 'TECHNICIAN')
						AND address_id IN (
							SELECT a.id FROM addresses a
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						))
				OR (current_setting('app.current_role', true) IN ('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP')
						AND id IN (
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

export const farmsRelations = relations(farms, ({ one, many }) => ({
	address: one(addresses, {
		fields: [farms.addressId],
		references: [addresses.id],
	}),
	parentFarm: one(farms, {
		fields: [farms.parentFarmId],
		references: [farms.id],
	}),
	subjects: many(farmSubjects),
}));

// Re-export needed for farmSubjects relation (circular import)
import { farmSubjects } from "./farm-subjects";
