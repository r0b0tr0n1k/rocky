# ADR-0006: RLS via Transactional Connection

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-05 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

PostgreSQL Row-Level Security (RLS) policies in the Rocky codebase use `current_setting('app.current_user_id', true)` to filter rows. The current `RLSMiddleware` sets these session variables via `db.execute()`:

```typescript
// Current code — apps/api/src/trpc/middlewares/rls.middleware.ts
await db.execute(sql`
  SELECT set_config('app.current_user_id', ${user.smUserId}, true);
  SELECT set_config('app.current_role', ${highestRole}, true);
  SELECT set_config('app.current_org_id', ${orgId ?? ""}, true);
`);
```

**This has a critical flaw**: `set_config(..., true)` sets the variable with `LOCAL` scope — meaning it only persists for the **current transaction**. Since `db.execute()` runs in an implicit auto-commit transaction, the `SET LOCAL` variables are **immediately lost** when the statement completes.

Subsequent queries via `db.select()` or `db.query()` may land on a **different connection** from the pool (`postgres` driver, `max: 20`), making RLS enforcement **unreliable**. It may appear to work when the pool reuses the same connection in rapid succession, but this is accidental, not guaranteed.

## Decision

**Wrap all RLS-enforcing requests in an explicit PostgreSQL transaction.** The `SET LOCAL` variables are set on the transactional connection (`tx`) and persist for the duration of the request. The transactional connection is injected into downstream code via `AsyncLocalStorage` (using the already-configured `nestjs-cls`).

### Implementation

```typescript
// packages/execution/src/pipeline/stages/rls.stage.ts
export const RLSStage: ExecutionStage = {
  name: "RLS",
  async execute(ctx, next) {
    const db = /* injected DB */;
    const cls = /* injected ClsService */;

    return db.transaction(async (tx) => {
      // Store tx in AsyncLocalStorage — all downstream code can access it
      cls.set(TX_KEY, tx);

      // SET LOCAL on the transactional connection — persists for duration of tx
      await tx.execute(sql`
        SELECT set_config('app.current_user_id', ${ctx.principal.id}, true);
        SELECT set_config('app.current_role', ${ctx.principal.roles[0] ?? 'SYSTEM'}, true);
        SELECT set_config('app.current_org_id', ${ctx.principal.organization?.id ?? ''}, true);
        SELECT set_config('app.current_permissions', ${ctx.principal.permissions.join(',')}, true);
        SELECT set_config('app.current_trace_id', ${ctx.runtime.traceId}, true);
        SELECT set_config('app.current_locale', ${ctx.runtime.locale}, true);
      `);

      await next();
    });
  },
};
```

### DatabaseProvider for Transparent Transaction Access

```typescript
// packages/database/src/database.provider.ts
@Injectable()
export class DatabaseProvider {
  constructor(
    private readonly db: DB,
    private readonly cls: ClsService,
  ) {}

  /** Returns transactional client if inside RLSStage, else global db */
  get client(): Tx | DB {
    return this.cls.get(TX_KEY) ?? this.db;
  }
}
```

Repositories use `this.dbp.client` instead of `this.db` — the provider transparently resolves the correct connection.

## Consequences

### Positive

1. **Guaranteed RLS enforcement**: `SET LOCAL` persists for the entire request lifecycle within the transaction.
2. **No prop-drilling**: Repositories access `tx` via `DatabaseProvider.client` — no signature changes needed.
3. **Uses existing infrastructure**: `nestjs-cls` is already configured globally in `app.module.ts`.
4. **Audit + trace piggyback**: The transaction scope naturally includes audit and trace data.
5. **Works for all transports**: tRPC, cron jobs, RabbitMQ consumers all use the same RLS stage.

### Negative

1. **All requests become transactional**: Even read-only requests wrap in `BEGIN...COMMIT`. For a PostgreSQL pool of 20, this is acceptable — read transactions don't block. For extreme read loads, a read-only fast path could be added later.
2. **Transaction duration matters**: Long-running business logic holds a connection and an open transaction. Mitigated by timeouts and monitoring.
3. **One connection per request**: Each request consumes one pool connection for its duration. With `max: 20` and typical request times < 100ms, this handles ~200 req/s — adequate for the current scale.

### Immediate Fix for Current RLSMiddleware

Before the full pipeline migration, the current `RLSMiddleware` should be patched to wrap in a transaction:

```typescript
// apps/api/src/trpc/middlewares/rls.middleware.ts — PATCHED
async use(opts: MiddlewareOptions<AppContext>) {
  return db.transaction(async (tx) => {
    cls.set(TX_KEY, tx);

    await tx.execute(sql`
      SELECT set_config('app.current_user_id', ${user.smUserId}, true);
      SELECT set_config('app.current_role', ${highestRole}, true);
      SELECT set_config('app.current_org_id', ${orgId ?? ""}, true);
    `);

    return next(opts);
  });
}
```

## Alternatives Considered

### A: `SET SESSION` instead of `SET LOCAL`

**Rejected.** `SET SESSION` persists for the entire connection lifetime. Without explicit `RESET`, the session variables leak across requests if the pool reuses connections. `SET LOCAL` is the correct scope — it just needs a transaction boundary to be meaningful.

### B: Pass `tx` explicitly to every service method

**Rejected.** Requires changing every service and repository signature (`createFarm(tx, input)` instead of `createFarm(input)`). AsyncLocalStorage achieves the same result without prop-drilling.

### C: Single-connection pool (`max: 1`)

**Rejected.** In development, `max: 1` would mask the problem. In production, `max: 1` creates a bottleneck. The transaction approach works correctly with any pool size.

## References

- [AUTH_ARCHITECTURE.md](https://github.com/r0b0tr0n1k/rocky/blob/main/docs/AUTH_ARCHITECTURE.md) — CRITICAL: Transaction Scoping Problem
- [PostgreSQL SET documentation](https://www.postgresql.org/docs/current/sql-set.html)
- `packages/database/src/index.ts` — postgres client with `max: 20`
- `packages/trpc/src/middleware/withRls.ts` — current `injectRlsContext` utility
