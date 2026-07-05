# ADR-0007: Audit via Lifecycle Events

| Key            | Value               |
| -------------- | ------------------- |
| **Status**     | Accepted            |
| **Date**       | 2026-07-05          |
| **Author**     | Architecture Review |
| **Supersedes** | None                |

---

## Context

The initial `ExecutionService.run()` proposal coupled audit, tracing, and metrics directly inside the execution method:

```typescript
// Initial proposal (coupled):
async run<T>(ctx: ExecutionContext, callback: () => Promise<T>): Promise<T> {
  return this.db.transaction(async (tx) => {
    // ... RLS setup ...
    const result = await callback();
    await this.auditService.record(ctx, result);  // ← Execution knows about Audit
    await this.traceService.endSpan(ctx.execution.traceId);  // ← Execution knows about Trace
    return result;
  });
}
```

This creates **permanent coupling**:

1. **ExecutionService depends on AuditService**: Adding audit, trace, and metrics creates three hard dependencies.
2. **New concerns require editing ExecutionService**: Adding error reporting, billing events, or analytics requires modifying the core execution path.
3. **Ordering is hardcoded**: The order of audit → trace → metrics is baked into the method body.
4. **Tests require all dependencies**: Testing `ExecutionService` requires mocking audit, trace, and metrics.

## Decision

**Execution exposes lifecycle events. Audit, tracing, and metrics subscribe to events.** The execution pipeline knows nothing about its observers.

### Lifecycle Events

```typescript
export interface ExecutionStarted {
  type: "execution:started";
  ctx: ExecutionContext;
  timestamp: Date;
}

export interface ExecutionCompleted {
  type: "execution:completed";
  ctx: ExecutionContext;
  result: unknown;
  durationMs: number;
  timestamp: Date;
}

export interface ExecutionFailed {
  type: "execution:failed";
  ctx: ExecutionContext;
  error: Error;
  durationMs: number;
  timestamp: Date;
}

export type ExecutionEvent = ExecutionStarted | ExecutionCompleted | ExecutionFailed;
```

### Event Emitter

```typescript
@Injectable()
export class ExecutionEventEmitter {
  private readonly subscribers = new Set<(event: ExecutionEvent) => void | Promise<void>>();

  emit(event: ExecutionEvent): void {
    for (const sub of this.subscribers) {
      sub(event);  // Fire-and-forget — subscribers handle their own errors
    }
  }

  subscribe(handler: (event: ExecutionEvent) => void | Promise<void>): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }
}
```

### Subscribers (Registered Once at Startup)

```typescript
// apps/api/src/audit/audit.subscriber.ts
@Injectable()
export class AuditSubscriber {
  constructor(
    private readonly auditService: AuditService,
    private readonly events: ExecutionEventEmitter,
  ) {
    this.events.subscribe(async (event) => {
      if (event.type === "execution:completed") {
        await this.auditService.record(event.ctx, event.result);
      }
    });
  }
}

// apps/api/src/telemetry/trace.subscriber.ts
@Injectable()
export class TraceSubscriber {
  constructor(private readonly events: ExecutionEventEmitter) {
    this.events.subscribe((event) => {
      if (event.type === "execution:started") {
        startSpan(event.ctx.runtime.traceId);
      }
      if (event.type === "execution:completed") {
        endSpan(event.ctx.runtime.traceId);
      }
    });
  }
}

// apps/api/src/telemetry/metrics.subscriber.ts
@Injectable()
export class MetricsSubscriber {
  constructor(private readonly events: ExecutionEventEmitter) {
    this.events.subscribe((event) => {
      if (event.type === "execution:completed") {
        recordDuration(event.ctx.request.transport, event.durationMs);
      }
    });
  }
}
```

### EventsStage in the Pipeline

```typescript
export const EventsStage: ExecutionStage = {
  name: "Events",
  async execute(ctx, next) {
    const emitter = /* injected ExecutionEventEmitter */;
    const start = Date.now();

    emitter.emit({ type: "execution:started", ctx, timestamp: new Date() });

    try {
      const result = await next();
      emitter.emit({
        type: "execution:completed", ctx, result,
        durationMs: Date.now() - start, timestamp: new Date(),
      });
    } catch (error) {
      emitter.emit({
        type: "execution:failed", ctx, error: error as Error,
        durationMs: Date.now() - start, timestamp: new Date(),
      });
      throw error;
    }
  },
};
```

## Consequences

### Positive

1. **Zero coupling**: `ExecutionPipeline` has no imports from audit, trace, or metrics packages.
2. **Extensible**: New observers (error reporting, billing events, analytics, compliance logging) are new subscribers — no pipeline changes.
3. **Testable in isolation**: `ExecutionPipeline` tests don't need to mock audit/trace/metrics.
4. **Ordering is subscriber-controlled**: Subscribers can be registered in any order. The pipeline doesn't care.
5. **Optional subscribers**: In test environments, no subscribers are registered. In production, all are. No code branches needed.

### Negative

1. **Fire-and-forget risk**: If a subscriber throws, the event loop continues but the error may be swallowed. Mitigated by wrapping subscribers in try/catch within the emitter.
2. **No guaranteed delivery**: If the process crashes between `ExecutionCompleted` emission and the audit subscriber's write, the audit record is lost. Mitigated by transactional outbox pattern (future ADR).
3. **Discovery**: It's not immediately obvious which subscribers are active. Mitigated by logging subscriber registration at startup.

### Subscriber Registration Order

Subscribers should follow a convention for ordering when they depend on side effects:

```typescript
// Registration order (in app.module.ts):
{ provide: APP_SUBSCRIBER, useClass: TraceSubscriber },     // 1. Trace starts first
{ provide: APP_SUBSCRIBER, useClass: MetricsSubscriber },   // 2. Metrics independent
{ provide: APP_SUBSCRIBER, useClass: AuditSubscriber },     // 3. Audit may read metrics
```

## Alternatives Considered

### A: Direct method calls in ExecutionService

**Rejected.** This is the initial proposal that couples execution to audit, trace, and metrics.

### B: NestJS event emitter (`@nestjs/event-emitter`)

**Considered.** NestJS's `EventEmitter2` supports async subscribers and wildcards. It would work but adds a framework dependency to the execution package. A simple in-process emitter keeps the execution package framework-agnostic.

### C: OpenTelemetry hooks

**Considered for tracing specifically.** OpenTelemetry's auto-instrumentation can wrap database calls without explicit trace code. However, for business-level spans ("animal:create took 45ms"), explicit trace points in the pipeline are more useful. The `TraceSubscriber` approach allows mixing OTel auto-instrumentation with custom spans.

## References

- [AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md) — Refinement 8: Audit via Lifecycle Events
- `apps/api/src/app.module.ts` — current NestJS module configuration
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
