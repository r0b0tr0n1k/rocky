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
import { ClsService } from "nestjs-cls";
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
    return this.cls.run(async () => {
      return db.transaction(async (tx) => {
        this.cls.set(TX_KEY, tx);

        await tx.execute(sql`SELECT set_config('app.current_user_id', ${config.ctx.principal.id}, true)`);
        await tx.execute(sql`SELECT set_config('app.current_role', ${config.ctx.principal.roles[0] ?? "SYSTEM"}, true)`);
        await tx.execute(sql`SELECT set_config('app.current_org_id', ${config.ctx.principal.organization?.id ?? ""}, true)`);
        await tx.execute(sql`SELECT set_config('app.current_permissions', ${config.ctx.principal.permissions.join(",")}, true)`);
        await tx.execute(sql`SELECT set_config('app.current_trace_id', ${config.ctx.runtime.traceId}, true)`);
        await tx.execute(sql`SELECT set_config('app.current_locale', ${config.ctx.runtime.locale}, true)`);
        await tx.execute(sql`SELECT set_config('app.current_tenant', ${config.ctx.runtime.tenant ?? ""}, true)`);

        try {
          return await callback(tx);
        } finally {
          this.cls.set(TX_KEY, undefined);
        }
      });
    });
  }
}
