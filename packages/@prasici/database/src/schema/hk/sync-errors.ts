// ── Drizzle Schema: Sync Error Log ──
// Replaces: HK_SYNC_ERRORS (Oracle HK.PDF)

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	integer,
	text,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const syncErrors = pgTable(
	"sync_errors",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		legacyId: integer("legacy_id"),

		farmId: uuid("farm_id"),
		addressId: uuid("address_id"),
		subjectId: uuid("subject_id"),

		errorType: varchar("error_type", { length: 30 }).notNull(),
		note: text("note"),

		resolved: boolean("resolved").notNull().default(false),
		resolvedAt: timestamp("resolved_at"),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
	},
	(table) => [
		index("idx_sync_errors_farm").on(table.farmId),
		index("idx_sync_errors_type").on(table.errorType),
		index("idx_sync_errors_resolved").on(table.resolved),
		pgPolicy("sync_error_access_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`
				current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
				OR (current_setting('app.current_role', true) = 'VETERINARIAN'
						AND farm_id IN (
							SELECT f.id FROM farms f
							JOIN addresses a ON f.address_id = a.id
							JOIN org_areas oa ON a.commune_id = oa.commune_id
							WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
						))
			`,
		}),
	],
);
