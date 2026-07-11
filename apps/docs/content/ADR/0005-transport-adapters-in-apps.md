# ADR-0005: Transport Adapters in `apps/api/adapters/`

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-05 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The initial architecture proposal included `packages/transport/` as a workspace package containing tRPC, GraphQL, and REST adapters. This was based on the idea that transport adapters are "shared infrastructure" across applications.

However, Rocky currently has one backend application (`apps/api/`). Transport adapters are:

1. **Deployment-specific**: The tRPC adapter uses `nestjs-trpc` decorators, which are specific to this NestJS application. A different application might use plain tRPC or Fastify.
2. **Tightly coupled to NestJS DI**: Adapters use NestJS decorators (`@Router`, `@Query`, `@Mutation`, `@Ctx`) and dependency injection.
3. **Application entry points**: Each adapter wires the same pipeline differently. The adapter IS the application boundary.
4. **Not shared across deployables**: The mobile app, web app, and cron jobs are consumers of the API — they don't need the adapter packages.

## Decision

**Transport adapters live in `apps/api/adapters/`, not in a reusable `packages/transport/`.**

```txt
apps/api/
  adapters/
    trpc/             ← tRPC adapter (current, using nestjs-trpc)
    rest/             ← Future REST adapter
    graphql/          ← Future GraphQL adapter
    rabbitmq/         ← Future RabbitMQ consumer
    sip/              ← Future SIP/ARI event handler
    mqtt/             ← Future IoT/MQTT event handler
    cli/              ← Future CLI command handlers
```

### Reusable packages remain business-focused

```txt
packages/
  auth/               ← Authentication (Better Auth, sessions)
  authorization/      ← Principal, policy engine
  execution/          ← Pipeline, runtime context, events
  database/           ← Schemas, migrations, DatabaseProvider
  domains/            ← Business logic (animal, eartag, farm, ...)
```

### What Each Adapter Does

Every adapter follows the same pattern:

```typescript
// 1. Resolve authentication (transport-specific extraction)
const authResult = await authResolver.resolve(transportInput);

// 2. Resolve principal (always the same — regardless of transport)
const principal = await principalResolver.resolve(authResult);

// 3. Build execution context
const ctx = { principal, request: { transport: "trpc" }, runtime };

// 4. Execute through pipeline (always the same)
await pipeline.run(ctx, handler);
```

The only transport-specific code is step 1 (extracting the cookie/token from the specific protocol) and step 3 (building the request metadata).

## Consequences

### Positive

1. **Reusable packages stay lean**: `packages/` contains only business-focused, transport-agnostic code.
2. **Adapters are free to use framework-specific APIs**: The tRPC adapter uses `nestjs-trpc` decorators without forcing that dependency on other packages.
3. **Easy to add/remove transports**: Adding REST support creates a new directory under `adapters/`. It doesn't bloat `packages/`.
4. **Clear application boundary**: `apps/api/adapters/` IS the application. `packages/` IS the platform.
5. **No premature abstraction**: If we only ever use tRPC, we haven't created an unnecessary `packages/transport/` package.

### Negative

1. **Pattern duplication across adapters**: The 4-step pattern (resolve auth → resolve principal → build context → pipeline.run) is duplicated in each adapter. Mitigated by extracting a shared adapter utility within `apps/api/`.

2. **Future multi-application reuse**: If a second backend application is created, adapters may need to be copied or extracted. This is acceptable — extraction at that point is informed by actual reuse needs, not speculation.

## Shared Adapter Utility

To minimize duplication within `apps/api/`:

```typescript
// apps/api/adapters/shared/pipeline-adapter.ts
export abstract class PipelineAdapter {
  constructor(
    protected readonly authResolver: AuthResolver,
    protected readonly principalResolver: PrincipalResolver,
    protected readonly runtimeBuilder: RuntimeBuilder,
    protected readonly pipeline: ExecutionPipeline,
  ) {}

  protected async execute(
    transportInput: TransportInput,
    handler: () => Promise<unknown>,
  ): Promise<unknown> {
    const authResult = await this.authResolver.resolve(transportInput);
    if (!authResult) {
      return this.pipeline.run(ANONYMOUS_CONTEXT, handler);
    }

    const principal = await this.principalResolver.resolve(authResult);
    const runtime = this.runtimeBuilder.resolve(transportInput, principal);
    const ctx: ExecutionContext = { principal, request: transportInput.request, runtime };

    return this.pipeline.run(ctx, handler);
  }
}
```

## Alternatives Considered

### A: `packages/transport/` as reusable package

**Rejected.** Transport adapters are deployment-specific and framework-coupled. Extracting them to a reusable package prematurely adds complexity without proven reuse.

### B: Adapters in `apps/api/src/adapters/`

**Accepted as implementation detail.** The `apps/api/adapters/` directory is a sibling to `src/`, highlighting that adapters are the application's external boundary.

## References

- [AUTH_ARCHITECTURE.md](https://github.com/r0b0tr0n1k/rocky/blob/main/docs/AUTH_ARCHITECTURE.md) — Refinement 9: Transport Adapters in `apps/api/adapters/`
- `apps/api/src/routers/` — current tRPC routers
- `apps/api/src/app.module.ts` — NestJS module wiring
