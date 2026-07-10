// Synchronous TanStack Query persister backed by Expo SQLite (ADR-0036 d5).
// The phone's react-query cache survives app restarts -> offline reads serve
// from here; syncDownload refreshes it on connect.

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { getLocalDb } from "./db";

let _persister: ReturnType<typeof createSyncStoragePersister> | null = null;

export function getQueryPersister() {
  if (_persister) return _persister;
  const db = getLocalDb();
  db.execSync(
    `CREATE TABLE IF NOT EXISTS query_cache (key TEXT PRIMARY KEY, value TEXT)`,
  );
  _persister = createSyncStoragePersister({
    storage: {
      getItem: (key) =>
        db
          .getFirstSync<{ value: string }>(`SELECT value FROM query_cache WHERE key = ?`, [key])
          ?.value ?? null,
      setItem: (key, value) => {
        db.runSync(
          `INSERT INTO query_cache (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          [key, value],
        );
      },
      removeItem: (key) => {
        db.runSync(`DELETE FROM query_cache WHERE key = ?`, [key]);
      },
    },
  });
  return _persister;
}
