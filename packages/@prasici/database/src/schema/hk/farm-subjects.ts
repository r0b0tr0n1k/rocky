// ── Drizzle Schema: Farm-Subject Binding (with roles) ──
// Replaces: HK_KMG_SUBJ (Oracle HK.PDF)
// Represents the "Holder Keeper on Farm" relationship

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	integer,
	uniqueIndex,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { farms } from "./farms";
import { subjects } from "./subjects";

export const farmSubjects = pgTable(
	"farm_subjects",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		legacyId: integer("legacy_id").unique(),

		farmId: uuid("farm_id")
			.notNull()
			.references(() => farms.id, { onDelete: "cascade" }),
		subjectId: uuid("subject_id")
			.notNull()
			.references(() => subjects.id, { onDelete: "cascade" }),

		role: varchar("role", { length: 30 }).notNull(),

		isActive: boolean("is_active").notNull().default(true),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		validTo: timestamp("valid_to"),
	},
	(table) => [
		uniqueIndex("idx_farm_subjects_unique").on(
			table.farmId,
			table.subjectId,
			table.role,
		),
		index("idx_farm_subjects_farm").on(table.farmId),
		index("idx_farm_subjects_subject").on(table.subjectId),
		pgPolicy("farm_subject_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) IN ('VETERINARIAN', 'TECHNICIAN')
						AND farm_id IN (
							SELECT f.id FROM farms f
							JOIN addresses a ON f.address_id = a.id
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						))
				OR subject_id = current_setting('app.current_user_id', true)::uuid
			`,
		}),
	],
);

export const farmSubjectsRelations = relations(farmSubjects, ({ one }) => ({
	farm: one(farms, {
		fields: [farmSubjects.farmId],
		references: [farms.id],
	}),
	subject: one(subjects, {
		fields: [farmSubjects.subjectId],
		references: [subjects.id],
	}),
}));
