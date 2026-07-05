// ── Base Repository ──
// All domain repositories extend this.
//
// Uses DatabaseProvider to transparently get the transactional connection
// when inside ExecutionPipeline.run(), or the global pool otherwise.
//
// Outside the pipeline → global db connection (standalone scripts, REPL)
// Inside the pipeline  → transactional connection (RLS vars active)

import type { DatabaseProvider } from "@rocky/database";

export class BaseRepository {
  constructor(protected readonly dbp: DatabaseProvider) {}

  /**
   * Get the active database client.
   * Inside ExecutionPipeline: returns the transactional connection with RLS vars.
   * Outside: returns the global pool.
   */
  protected get client() {
    return this.dbp.client;
  }
}
