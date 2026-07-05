# Execution Package

**Scope:** `packages/execution/` — ExecutionContext, pipeline stages, RLS, runtime, events
**Source spec:** `docs/AUTH_ARCHITECTURE.md` §Application Pipeline, §RLS as Infrastructure
**Last verified:** 2026-07-05 — Aligned to code after Phase 4

## Overview

Runtime execution infrastructure. Sets up the environment for every request: resolves identity into `ExecutionContext`, manages transactions, RLS session variables, audit events, and tracing.
**Every tRPC request, cron job, or future transport (RabbitMQ, CLI) runs through this pipeline.**

## Key Files

| File | Purpose |
|------|---------|
| `execution-context.ts` | `ExecutionContext { principal, request, runtime }` — the single canonical context object. |
| `execution-pipeline.ts` | `ExecutionPipeline` — composable `ExecutionStage[]` chain. Currently: TransactionStage → RLSStage. Extensible. |
| `runtime.builder.ts` | `RuntimeBuilder` — resolves locale (Accept-Language → profile → org → system default), traceId, requestId, tenant, clock. |
| `rls/rls.stage.ts` | `RLSStage` — wraps execution in `db.transaction()` + `SET LOCAL` for pgPolicy. Stores tx in CLS via `TX_KEY`. |
| `events/event-emitter.ts` | `ExecutionEventEmitter` — in-process pub/sub for ExecutionStarted/Completed/Failed events. |
| `events/execution-events.ts` | Lifecycle event types: `ExecutionStarted`, `ExecutionCompleted`, `ExecutionFailed`. |

## Pipeline Stages (In Order)

| Stage | Purpose | Status |
|-------|---------|--------|
| TransactionStage | `BEGIN` transaction | 🔲 Not yet extracted (currently in RLSStage) |
| RLSStage | `SET LOCAL app.current_user_id`, `SET LOCAL app.current_role`, etc. | ✅ |
| PolicyStage | `PolicyResolver.evaluate()` via global middleware | ✅ In apps/api |
| TraceStage | Start OpenTelemetry span | 🔲 Future |
| MetricsStage | Start timer | 🔲 Future |
| AuditStage | Record execution event | 🔲 Future |

## DatabaseProvider Integration

```typescript
// In RLSStage:
const tx = await db.transaction(async (tx) => {
  cls.set(TX_KEY, tx);   // Store tx in CLS
  await tx.execute(sql`SELECT set_config('app.current_user_id', ...)`);
  await callback();      // Business logic runs on tx
});

// In any repository:
this.client  // → DatabaseProvider.client returns cls.get(TX_KEY) ?? this.db
            // → transactional connection if inside pipeline, else global pool
```

## Cross-Package Dependencies

| Package | Dependency |
|---------|-----------|
| `@rocky/auth` | AuthResult → PrincipalResolver chain |
| `@rocky/authorization` | Principal type, PolicyEngine |
| `@rocky/database` | DatabaseProvider, TX_KEY, Drizzle DB type |
| `nestjs-cls` | ClsService for AsyncLocalStorage transaction injection |
