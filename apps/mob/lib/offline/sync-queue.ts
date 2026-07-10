// ── Outbox (sync_queue) + local cache + sync cursor ──
// Mirrors the server-side transactional outbox (ADR-0012) but client-side and
// per-device. idempotency_key = deviceId + local uuid (ADR-0036 WO-081 d7) so
// retries / multi-device edits dedupe or conflict correctly.

import { getLocalDb } from "./db";
import type { SyncDownloadResponse } from "@rocky/validators/api";

export type SyncItemStatus = "pending" | "syncing" | "failed" | "synced";

export type SyncQueueRow = {
  id: number;
  idempotency_key: string;
  type: string;
  payload: unknown;
  base_updated_at: string | null;
  status: SyncItemStatus;
  error_message: string | null;
  attempts: number;
  created_at: string;
};

export function enqueueMutation(opts: {
  type: string;
  payload: unknown;
  baseUpdatedAt?: string | null;
  deviceId: string;
}): string {
  const idempotencyKey = opts.deviceId + ":" + uuidv4();
  getLocalDb().runSync(
    `INSERT OR IGNORE INTO sync_queue
       (idempotency_key, type, payload, base_updated_at, status, attempts, created_at)
     VALUES (?, ?, ?, ?, 'pending', 0, ?)`,
    [
      idempotencyKey,
      opts.type,
      JSON.stringify(opts.payload),
      opts.baseUpdatedAt ?? null,
      new Date().toISOString(),
    ],
  );
  return idempotencyKey;
}

export function listQueue(status?: SyncItemStatus): SyncQueueRow[] {
  const db = getLocalDb();
  const rows = db.getAllSync<Omit<SyncQueueRow, "payload"> & { payload: string }>(
    status
      ? `SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC`
      : `SELECT * FROM sync_queue ORDER BY created_at ASC`,
    status ? [status] : [],
  );
  return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
}

export function setStatus(idempotencyKey: string, status: SyncItemStatus): void {
  getLocalDb().runSync(`UPDATE sync_queue SET status = ? WHERE idempotency_key = ?`, [
    status,
    idempotencyKey,
  ]);
}

export function markSynced(idempotencyKey: string): void {
  getLocalDb().runSync(`UPDATE sync_queue SET status = 'synced' WHERE idempotency_key = ?`, [
    idempotencyKey,
  ]);
}

export function markFailed(idempotencyKey: string, error: string): void {
  getLocalDb().runSync(
    `UPDATE sync_queue SET status = 'failed', error_message = ?, attempts = attempts + 1
     WHERE idempotency_key = ?`,
    [error, idempotencyKey],
  );
}

// Local dismissal only — the server-side error_corrections ticket persists.
export function dismissQueueItem(idempotencyKey: string): void {
  getLocalDb().runSync(`DELETE FROM sync_queue WHERE idempotency_key = ?`, [idempotencyKey]);
}

// ── local_cache (materialized server reality) ──

export function upsertCache(type: string, id: string, data: unknown, updatedAt?: string | null): void {
  getLocalDb().runSync(
    `INSERT INTO local_cache (type, id, data_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(type, id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`,
    [type, id, JSON.stringify(data), updatedAt ?? null],
  );
}

export function getCacheByType(type: string): unknown[] {
  return getLocalDb()
    .getAllSync<{ data_json: string }>(`SELECT data_json FROM local_cache WHERE type = ?`, [type])
    .map((r) => JSON.parse(r.data_json));
}

// Persist a syncDownload snapshot into the local cache + advance the cursor.
export function storeDownload(res: SyncDownloadResponse): void {
  const buckets: Record<string, Array<{ id?: string; updatedAt?: string | Date | null }>> = {
    animal: res.animals as never,
    farm: res.farms as never,
    movement: res.movements as never,
    inspection: res.inspections as never,
    earTag: res.earTags as never,
    disease: res.diseases as never,
    vaccine: res.vaccines as never,
    vaccineBatch: res.batches as never,
    vaccineDisease: res.vaccineDiseases as never,
  };
  for (const [type, rows] of Object.entries(buckets)) {
    for (const row of rows) {
      if (row?.id) {
        upsertCache(
          type,
          String(row.id),
          row,
          row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
        );
      }
    }
  }
  setMeta("watermark", res.watermark ? new Date(res.watermark).toISOString() : new Date().toISOString());
}

// ── sync_meta (cursor) ──

export function setMeta(key: string, value: string): void {
  getLocalDb().runSync(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export function getMeta(key: string): string | null {
  return (
    getLocalDb()
      .getFirstSync<{ value: string }>(`SELECT value FROM sync_meta WHERE key = ?`, [key])
      ?.value ?? null
  );
}

// RFC-4122 v4 generator (no global crypto dependency on Hermes).
function uuidv4(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}
