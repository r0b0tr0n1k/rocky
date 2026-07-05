// ── DatabaseProvider — Transparent Transactional Connection ──
//
// Returns the transactional connection when inside ExecutionPipeline.run(),
// falls back to the global pool for direct queries.
//
// This is THE solution to the Transaction Scoping Problem:
//   SET LOCAL is transaction-scoped. Without explicit BEGIN...COMMIT,
//   the setting is lost when the implicit auto-commit transaction ends.
//   By always using the tx from AsyncLocalStorage, we guarantee all
//   queries run on the SAME connection where SET LOCAL was executed.
//
// Usage in repositories:
//   ```typescript
//   @Injectable()
//   export class FarmRepository {
//     constructor(private readonly dbp: DatabaseProvider) {}
//
//     async findById(id: string) {
//       return this.dbp.client
//         .select()
//         .from(farms)
//         .where(eq(farms.id, id));
//     }
//   }
//   ```
//
// Usage outside pipelines (standalone scripts, REPL):
//   DatabaseProvider falls back to the global db connection.

import { Injectable } from "@nestjs/common";
import type { ClsService } from "nestjs-cls";
import { type DB, db, type Tx } from "./index.js";

export const TX_KEY = "execution:tx";

@Injectable()
export class DatabaseProvider {
  constructor(readonly cls: ClsService) {
    this.__cls = cls;
  }

  // Private field for getCurrentTx access
  private readonly __cls: ClsService;

  /**
   * Get the active database client.
   * Returns the transactional connection if inside ExecutionPipeline.run(),
   * otherwise returns the global pool.
   */
  get client(): Tx | DB {
    const tx = this.__cls.get<Tx | undefined>(TX_KEY);
    return tx ?? db;
  }

  /**
   * Get the current transactional connection (if within a pipeline).
   * Useful for explicit transaction handling.
   */
  get currentTx(): Tx | undefined {
    return this.__cls.get<Tx | undefined>(TX_KEY);
  }
}

/**
 * Static accessor for DatabaseProvider's current tx.
 * Use in contexts where DI isn't available (standalone scripts, REPL).
 */
export function getCurrentTx(cls: ClsService): Tx | undefined {
  return cls.get(TX_KEY);
}
