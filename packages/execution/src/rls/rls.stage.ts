// ── RLS Stage ──
// PostgreSQL Row-Level Security via SET LOCAL on a transactional connection.
//
// CRITICAL: SET LOCAL is TRANSACTION-SCOPED.
// Without an explicit BEGIN...COMMIT, the setting is lost when the implicit
// auto-commit transaction ends. Subsequent queries on a different connection
// will NOT see the RLS variables.
//
// Solution:
//   1. BEGIN a transaction
//   2. Store the transactional connection in AsyncLocalStorage (nestjs-cls)
//      so ALL downstream repositories (via DatabaseProvider) use this connection
//   3. Execute SET LOCAL on the transactional connection (guaranteed to persist)
//   4. Execute business logic (all queries see RLS variables via DatabaseProvider)
//   5. COMMIT (SET LOCAL vars naturally expire)

import { Injectable } from "@nestjs/common";
import { db, TX_KEY, type Tx } from "@rocky/database";
import { sql } from "drizzle-orm";
import type { ClsService } from "nestjs-cls";
import type { ExecutionContext } from "../execution-context.js";

/**
 * RLS Stage configuration — the session variables to set.
 */
export interface RlsStageConfig {
  ctx: Pick<ExecutionContext, "principal" | "runtime">;
}

/**
 * RLS Stage — wraps execution in a transaction with SET LOCAL.
 * Transactional connection is stored in AsyncLocalStorage for DatabaseProvider.
 */
@Injectable()
export class RLSStage {
  constructor(private readonly cls: ClsService) { }

  /**
   * Execute a callback within an RLS-scoped transaction.
   *
   * @param config - RLS configuration (principal, runtime)
   * @param callback - Business logic to execute
   * @returns The callback's return value
   */
  async run<T>(config: RlsStageConfig, callback: (tx: Tx) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      // 1. Store transactional connection in AsyncLocalStorage
      //    DatabaseProvider.client will return THIS tx for all downstream queries
      this.cls.set(TX_KEY, tx);

      // 2. Execute SET LOCAL on the TRANSACTIONAL connection
      await tx.execute(sql`
        SELECT set_config('app.current_user_id', ${config.ctx.principal.id}, true);
        SELECT set_config('app.current_role', ${config.ctx.principal.roles[0] ?? "SYSTEM"}, true);
        SELECT set_config('app.current_org_id', ${config.ctx.principal.organization?.id ?? ""}, true);
        SELECT set_config('app.current_permissions', ${config.ctx.principal.permissions.join(",")}, true);
        SELECT set_config('app.current_trace_id', ${config.ctx.runtime.traceId}, true);
        SELECT set_config('app.current_locale', ${config.ctx.runtime.locale}, true);
        SELECT set_config('app.current_tenant', ${config.ctx.runtime.tenant ?? ""}, true);
      `);

      // 3. Execute business logic
      //    All downstream query calls go through DatabaseProvider which reads TX_KEY
      //    from AsyncLocalStorage, guaranteeing they use THIS transactional connection
      try {
        return await callback(tx);
      } finally {
        // 4. Clean up AsyncLocalStorage after transaction
        this.cls.set(TX_KEY, undefined);
      }
    });
  }
}
