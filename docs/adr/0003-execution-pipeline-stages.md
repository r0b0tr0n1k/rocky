# ADR-0003: Execution Pipeline as Composable Stages

| Key            | Value               |
| -------------- | ------------------- |
| **Status**     | Accepted            |
| **Date**       | 2026-07-05          |
| **Author**     | Architecture Review |
| **Supersedes** | None                |

---

## Context

The current request execution flow is implemented as NestJS middleware (`ProtectedMiddleware`, `RLSMiddleware`) applied via `@UseMiddlewares` decorators. Each middleware performs one step (session check, SET LOCAL for RLS, permission check) and optionally enriches the context.

This approach has limitations:

1. **Transport coupling**: Middleware is tRPC-specific. Cron jobs, RabbitMQ consumers, and CLI commands cannot reuse the same middleware.
2. **Ordering is implicit**: The execution order depends on decorator ordering, which is easy to misconfigure.
3. **Monolithic `ExecutionService.run()`**: As the architecture grows (audit, tracing, metrics, feature flags, timeouts, retries, rate limiting, idempotency), a single `run()` method accumulates too many responsibilities.
4. **No lifecycle hooks**: There is no standard way to execute code before/after the business handler (e.g., start trace span before, record audit after).

## Decision

**Model the execution pipeline as composable `ExecutionStage` components.** Each stage performs one concern and delegates to the next stage. The pipeline is configured once and reused across all transports.

```typescript
export interface ExecutionStage {
  readonly name: string;
  execute(ctx: ExecutionContext, next: () => Promise<void>): Promise<void>;
}
```

### Built-in Stages

```txt
TransactionStage   → BEGIN transaction
RLSStage           → SET LOCAL session variables on transactional connection
TraceStage         → Start/end OpenTelemetry span
MetricsStage       → Record duration and success/failure
PolicyStage        → Evaluate @Policy({ action: "..." })
AuditStage         → Subscribe to ExecutionCompleted event, record audit trail
EventsStage        → Emit ExecutionStarted / ExecutionCompleted / ExecutionFailed events
```

### Composition

```typescript
const pipeline = new ExecutionPipeline([
  TransactionStage,
  RLSStage,          // Must be after TransactionStage — needs tx connection
  TraceStage,
  MetricsStage,
  PolicyStage,       // Must be before handler — rejects unauthorized requests
  EventsStage,       // Emits lifecycle events (other stages subscribe)
  AuditStage,        // Subscribes to ExecutionCompleted
]);

await pipeline.run(ctx, handler);
```

Stages are composed in order. Each stage can:

- Enrich the context before passing to the next stage
- Wrap the next stage's execution (e.g., transaction BEGIN/COMMIT)
- Skip remaining stages (e.g., PolicyStage throws on unauthorized)
- Subscribe to lifecycle events (e.g., AuditStage listens for ExecutionCompleted)

## Consequences

### Positive

1. **Transport-agnostic**: The same pipeline runs for tRPC, REST, GraphQL, RabbitMQ, cron, CLI.
2. **Single-responsibility stages**: Each stage is independently testable, replaceable, and removable.
3. **Explicit ordering**: The pipeline array defines execution order unambiguously.
4. **Extensible**: Future concerns (feature flags, timeouts, retries, rate limiting, idempotency) are new stages — no existing code changes.
5. **Lifecycle events**: Stages communicate via events rather than direct calls. Audit doesn't need to know about ExecutionPipeline internals.

### Negative

1. **Execution order is critical**: `RLSStage` must follow `TransactionStage`, `PolicyStage` must precede the handler. Misordering causes subtle bugs. Mitigated by well-documented stage dependencies.
2. **Debugging complexity**: Stack traces span multiple stages. Mitigated by structured logging with stage names.
3. **Performance overhead**: Each stage adds a function call and Promise resolution. For the 7 built-in stages, overhead is negligible (< 0.5ms).

## Stage Dependencies

```txt
TransactionStage  ← Must be first (BEGIN)
  ├── RLSStage            ← Requires transactional connection
  ├── TraceStage          ← Independent
  ├── MetricsStage        ← Independent
  ├── PolicyStage         ← Must precede handler
  ├── EventsStage         ← Emits events (other stages subscribe)
  │     └── AuditStage    ← Subscribes to ExecutionCompleted
  └── Handler executes
```

## Alternatives Considered

### A: Keep NestJS middleware model

**Rejected.** NestJS middleware is transport-specific. A `RLSMiddleware` written for tRPC cannot be reused by a RabbitMQ consumer or cron job.

### B: Single `ExecutionService.run()` with hardcoded steps

**Rejected.** This is the initial proposal but fails the extensibility test. Adding a `FeatureFlagStage` would require modifying the core `run()` method. Composable stages avoid this.

### C: NestJS Interceptors

**Rejected.** Interceptors are HTTP-specific and cannot wrap non-HTTP execution (cron, RabbitMQ).

## References

- [AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md) — Refinement 7: Execution Pipeline and Refinement 8: Audit via Lifecycle Events
- `apps/api/src/trpc/middlewares/` — current tRPC-specific middlewares
