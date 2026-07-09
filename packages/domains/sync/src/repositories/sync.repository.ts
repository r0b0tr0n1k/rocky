/**
 * Sync Repository
 *
 * @description Idempotency ledger + direct movements read for sync download.
 *   Shovels, not announcers — no events, no business logic.
 *   RLS context is injected by the ExecutionPipeline; queries here are scoped
 *   automatically. The sync_idempotency table is intentionally global.
 */

import { movements, syncIdempotency } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { eq } from "drizzle-orm";

export interface MarkProcessedInput {
  idempotencyKey: string;
  entityType: string;
  entityId: string | null;
  createdBy: string;
  payload?: unknown;
}

export class SyncRepository extends BaseRepository {
  /** True if this idempotencyKey has already been applied. */
  async isProcessed(idempotencyKey: string): Promise<boolean> {
    const [row] = await this.client
      .select({ idempotencyKey: syncIdempotency.idempotencyKey })
      .from(syncIdempotency)
      .where(eq(syncIdempotency.idempotencyKey, idempotencyKey))
      .limit(1);
    return Boolean(row);
  }

  /** The previously-stored recordId for an already-processed key (if any). */
  async getProcessed(idempotencyKey: string): Promise<{ recordId: string | null } | undefined> {
    const [row] = await this.client
      .select({ recordId: syncIdempotency.entityId })
      .from(syncIdempotency)
      .where(eq(syncIdempotency.idempotencyKey, idempotencyKey))
      .limit(1);
    return row ? { recordId: row.recordId } : undefined;
  }

  /**
   * Record that a key has been processed. Idempotent: if the key already exists
   * (e.g. a concurrent retry), the insert is a no-op.
   */
  async markProcessed(rec: MarkProcessedInput): Promise<void> {
    await this.client
      .insert(syncIdempotency)
      .values({
        idempotencyKey: rec.idempotencyKey,
        entityType: rec.entityType,
        entityId: rec.entityId,
        createdBy: rec.createdBy,
        payload: rec.payload ?? null,
      })
      .onConflictDoNothing({ target: syncIdempotency.idempotencyKey });
  }

  /**
   * Direct movements read for sync download. RLS applies via the
   * ExecutionPipeline-injected context. MovementService has no simple list
   * method, so we query the table directly.
   */
  async listMovements(limit: number) {
    return this.client.select().from(movements).limit(limit);
  }
}
