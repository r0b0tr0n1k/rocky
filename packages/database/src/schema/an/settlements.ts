// ── Drizzle Schema: Settlements ──
// Provided/ingested reference layer of populated places (villages, towns, cities).
// Disease zones are anchored to the NEAREST settlement to an infected premises
// (ADR-0080): the catastrophe shapes are not hand-drawn by vets/farmers — the
// authoritative settlement + outbreak data is supplied to us on go-live.

import { index, pgPolicy, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { settlementTypePgEnum } from "../../schemas/enums/settlement-type.js";
import { geometry } from "../../geometry/postgis.js";
import { adminWrite } from "../rls-helpers.js";

export const settlements = pgTable(
	"settlements",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Identification
		name: varchar("name", { length: 200 }).notNull(),
		settlementType: settlementTypePgEnum("settlement_type").notNull(),

		// Reference location (point) — provided/ingested, not user-drawn.
		location: geometry("location"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("idx_settlements_location").using("gist", table.location),
		// Reference data: globally readable; writes restricted to admin (seed/import).
		pgPolicy("settlement_read_policy", {
			as: "permissive",
			to: "public",
			for: "select",
			using: sql`true`,
		}),
		pgPolicy("settlement_write_policy", {
			as: "permissive",
			to: "public",
			for: "all",
			using: sql`true`,
			withCheck: adminWrite,
		}),
	],
);
