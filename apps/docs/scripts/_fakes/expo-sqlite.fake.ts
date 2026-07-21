// In-memory stand-in for `expo-sqlite` (offline doctrine test only).
//
// It backs the REAL `apps/mob/lib/offline/*.ts` orchestration logic against a
// plain-JS store, so the guillotine-style doc-test can exercise the offline
// subsystem without a native runtime. The SQL surface is intentionally minimal:
// only the statements `sync-queue.ts` / `persist.ts` actually issue are honoured.

type Row = Record<string, unknown>;

declare global {
  // eslint-disable-next-line no-var
  var __fakeSqliteTables: Map<string, Row[]>;
}

// State lives on globalThis so every instance of this fake module (the test
// file and the redirected `db.ts` import resolve to separate module instances
// under tsx) shares ONE store. Reset clears it in place.
globalThis.__fakeSqliteTables ??= new Map<string, Row[]>();
const tables: Map<string, Row[]> = globalThis.__fakeSqliteTables;

/** Clears all tables. Called in `beforeEach` so functional tests stay isolated. */
export function __resetFakeDb(): void {
  globalThis.__fakeSqliteTables.clear();
}

function get(name: string): Row[] {
  let rows = tables.get(name);
  if (!rows) {
    rows = [];
    tables.set(name, rows);
  }
  return rows;
}

function makeFakeDb() {
  return {
    execSync(sql: string): void {
      const m = /CREATE TABLE IF NOT EXISTS (\w+)/.exec(sql);
      if (m) get(m[1]!);
    },
    runSync(sql: string, params: unknown[] = []): void {
      const p = params as string[];
      if (sql.includes("INSERT OR IGNORE INTO sync_queue")) {
        const rows = get("sync_queue");
        rows.push({
          id: rows.length + 1,
          idempotency_key: p[0],
          type: p[1],
          payload: p[2],
          base_updated_at: p[3],
          status: "pending",
          error_message: null,
          attempts: 0,
          created_at: p[4],
        });
      } else if (sql.includes("INSERT INTO local_cache")) {
        const rows = get("local_cache");
        const i = rows.findIndex((r) => r.type === p[0] && r.id === p[1]);
        const rec: Row = { type: p[0], id: p[1], data_json: p[2], updated_at: p[3] };
        if (i >= 0) rows[i] = rec;
        else rows.push(rec);
      } else if (sql.includes("INSERT INTO sync_meta")) {
        const rows = get("sync_meta");
        const i = rows.findIndex((r) => r.key === p[0]);
        const rec: Row = { key: p[0], value: p[1] };
        if (i >= 0) rows[i] = rec;
        else rows.push(rec);
      } else if (sql.startsWith("UPDATE sync_queue SET status = 'synced'")) {
        const r = (tables.get("sync_queue") ?? []).find((r) => r.idempotency_key === p[0]);
        if (r) r.status = "synced";
      } else if (sql.startsWith("UPDATE sync_queue SET status = 'failed'")) {
        // params: [error_message, idempotency_key]
        const r = (tables.get("sync_queue") ?? []).find((r) => r.idempotency_key === p[1]);
        if (r) {
          r.status = "failed";
          r.error_message = p[0];
          r.attempts = Number(r.attempts) + 1;
        }
      } else if (sql.includes("UPDATE sync_queue SET status = ?")) {
        // params: [status, idempotency_key]
        const r = (tables.get("sync_queue") ?? []).find((rr) => rr.idempotency_key === p[1]);
        if (r) r.status = p[0];
      } else if (sql.includes("DELETE FROM sync_queue")) {
        const rows = tables.get("sync_queue") ?? [];
        const i = rows.findIndex((r) => r.idempotency_key === p[0]);
        if (i >= 0) rows.splice(i, 1);
      }
    },
    getAllSync(sql: string, params: unknown[] = []): Row[] {
      if (sql.includes("FROM sync_queue")) {
        const rows = tables.get("sync_queue") ?? [];
        return params[0] ? rows.filter((r) => r.status === params[0]) : rows;
      }
      if (sql.includes("FROM local_cache")) {
        const [type] = params as string[];
        return (tables.get("local_cache") ?? [])
          .filter((r) => r.type === type)
          .map((r) => ({ data_json: r.data_json }));
      }
      return [];
    },
    getFirstSync(sql: string, params: unknown[] = []): Row | null {
      if (sql.includes("FROM sync_meta")) {
        const [key] = params as string[];
        return (tables.get("sync_meta") ?? []).find((r) => r.key === key) ?? null;
      }
      return null;
    },
  };
}

export function openDatabaseSync(): ReturnType<typeof makeFakeDb> {
  return makeFakeDb();
}

export class SQLiteDatabase {}
