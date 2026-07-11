// ── Local offline database (raw Expo SQLite, no ORM — ADR-0036 §WO-081 d1) ──
// The PDA holds a *materialized cache* of the server's reality: the castrated
// field-entity set (animals/farms/movements/inspections/ear_tags + health
// master data) plus the outbox (`sync_queue`) and a sync cursor (`sync_meta`).
// It is explicitly DENIED rbac/users/audit_log/system_parameters — those are
// never selected by syncDownload (see packages/domains/sync).

import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

// The offline subsystem is NATIVE-ONLY (ADR-0036 §WO-081 d1). The browser is a
// dev-only UI surface; the PDA's SQLite cache/outbox run on a simulator/device.
// We detect web without importing `react-native` (db.ts is also loaded by the
// offline doc-test under tsx, where `react-native` cannot resolve).
export const IS_WEB = typeof document !== "undefined";

export const DB_NAME = "rocky_offline.db";

let _db: SQLiteDatabase | null = null;

function migrate(db: SQLiteDatabase) {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sync_queue (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT UNIQUE NOT NULL,
      type            TEXT NOT NULL,
      payload         TEXT NOT NULL,
      base_updated_at TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      error_message   TEXT,
      attempts        INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS local_cache (
      type       TEXT NOT NULL,
      id         TEXT NOT NULL,
      data_json  TEXT NOT NULL,
      updated_at TEXT,
      PRIMARY KEY (type, id)
    );
    CREATE TABLE IF NOT EXISTS sync_meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS query_cache (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

/** Synchronous, memoized local DB handle.
 *
 *  Native-only (ADR-0036): on web we never open the native SQLite DB, so the
 *  PDA's offline cache/outbox are unavailable in the browser — they are exercised
 *  on a simulator/device. Throwing here fails loudly if a caller skips its guard.
 */
export function getLocalDb(): SQLiteDatabase {
  if (IS_WEB) {
    throw new Error("getLocalDb() is native-only (ADR-0036); offline cache unavailable on web.");
  }
  if (!_db) {
    _db = openDatabaseSync(DB_NAME);
    migrate(_db);
  }
  return _db;
}
