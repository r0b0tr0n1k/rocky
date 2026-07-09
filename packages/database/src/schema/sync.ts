// ── Drizzle Schema: Sync Idempotency Ledger ──
// WO-081: offline-first sync engine.
// Global ledger (NOT tenant-scoped) that de-duplicates PDA upload records by
// their client-supplied idempotencyKey, so an interrupted upload is never
// applied twice. The ExecutionPipeline injects RLS context for all tenant
// queries; this table is intentionally global.

import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const syncIdempotency = pgTable("sync_idempotency", {
  idempotencyKey: varchar("idempotency_key").primaryKey(),
  entityType: varchar("entity_type").notNull(),
  entityId: uuid("entity_id"),
  createdBy: varchar("created_by").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SyncIdempotency = typeof syncIdempotency.$inferSelect;
export type NewSyncIdempotency = typeof syncIdempotency.$inferInsert;
