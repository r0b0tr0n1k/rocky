# Authentication & Authorization Architecture

> *"The point is not to add Better Auth. The point is to resolve the contradiction between identity and authorization."*

---

## Target Architecture

```
HTTP / Cron / RabbitMQ / CLI
         │
         ▼
┌────────────────────┐
│ Authentication     │  ← packages/auth: Cookie → Better Auth → AuthResult
│ Resolver           │
└────────┬───────────┘
         │ AuthResult { session, user }
         ▼
┌────────────────────┐
│ Principal          │  ← packages/authorization: SM user + RBAC → Principal
│ Resolver           │
└────────┬───────────┘
         │ Principal { id, roles, permissions, org, accessLevel, claims }
         ▼
┌────────────────────┐
│ Runtime            │  ← packages/execution: locale, traceId, tenant, clock
│ Builder            │
└────────┬───────────┘
         │ ExecutionContext { principal, request, runtime }
         ▼
┌─────────────────────────────────────────────────┐
│              Execution Pipeline                  │
│                                                  │
│  ExecutionMiddleware  →  begin pipeline          │
│  ├─ RLSStage          →  BEGIN + SET LOCAL (tx)   │
│  ├─ PolicyStage       →  PolicyResolver (global) │
│  │   └─ Reads @Policy() + @RegisterPolicy()      │
│  │   └─ Evaluates action/authenticated/roles     │
│  ├─ Handler executes → business logic            │
│  │   └─ Principal passed to domain services      │
│  │   └─ pgPolicy enforces row-level security     │
│  └─ COMMIT / ROLLBACK                            │
└─────────────────────────────────────────────────┘
```

## Package Layout

```
packages/
  auth/                         ← Authentication
    src/
      better-auth.ts            ← Auth singleton instance
      auth.resolver.ts          ← Cookie → Better Auth → AuthResult
      auth.module.ts            ← @Global() NestJS module
      client.ts                 ← createRockyAuthClient()

  authorization/                ← Principal + Policy
    src/
      principal/
        principal.ts            ← Principal interface + class
        principal.resolver.ts   ← AuthResult → Principal
        principals.ts           ← ANONYMOUS, SYSTEM
      policies/
        policy.decorator.ts     ← @Policy({ action, authenticated, ... })
        policy.registry.ts      ← Static Map: "alias.method" → PolicyMetadata
        register-policy.decorator.ts  ← @RegisterPolicy("alias")
        engine.ts               ← PolicyEngine.evaluate(principal, policy)
      authorization.module.ts   ← @Global() NestJS module

  execution/                    ← Runtime pipeline
    src/
      execution-context.ts      ← ExecutionContext, RequestContext, RuntimeContext
      execution-pipeline.ts     ← Composable ExecutionStage[]
      runtime.builder.ts        ← Locale, traceId, tenant
      events/
        execution-events.ts     ← ExecutionStarted/Completed/Failed
        event-emitter.ts        ← In-process pub/sub
      outbox/
        outbox-publisher.ts     ← OutboxEventPublisher
      repositories/
        business-rule.repository.ts ← BusinessRuleRepository
      services/
        execution.service.ts    ← ExecutionService
      rls/
        rls.stage.ts            ← BEGIN + SET LOCAL via transaction
      execution.module.ts       ← @Global() NestJS module

  database/                     ← Schemas, migrations
    src/
      database.provider.ts      ← Transparent tx vs global db via CLS

  domains/                      ← Business logic (receives Principal)
    animal/ eartag/ farm/ movement/ health/
    inspection/ archive/ passport/ correction/
    notification/ organization/ user/ subject/

apps/
  api/
    src/
      trpc/
        middlewares/
          execution.middleware.ts  ← Pipeline entry point
          policy.resolver.ts      ← Global policy evaluation
          logging.middleware.ts
      routers/                    ← 20 tRPC routers (use @Policy decorators)
      jobs/                       ← Cron jobs (CorrectionConsistency, Retention, RiskAnalysis)
```

## Principal Interface

```typescript
export interface Principal {
  readonly id: string;             // SM user ID
  readonly username: string;
  readonly roles: ReadonlyArray<string>;
  readonly permissions: ReadonlyArray<string>;
  readonly organization: { readonly id: string } | null;
  readonly accessLevel: "all" | "organization" | "own";
  readonly claims: Readonly<Record<string, unknown>>;
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  isAdmin(): boolean;
}
```

## @Policy Decorator System

```typescript
// Router — declares ACTIONS, not permissions
@Router({ alias: "farm" })
@RegisterPolicy("farm")
@Policy({ authenticated: true })
export class FarmRouter {
  @Query(...) async list() {}       // any authenticated user

  @Mutation(...)
  @Policy({ action: "eartag:order" })
  async placeOrder() {}              // + eartag:order permission
}

// PolicyResolver (global middleware) evaluates at runtime:
//   PolicyRegistry.get("farm.list") → { authenticated: true }
//   PolicyEngine.evaluate(principal, policy) → { allowed: true/false }
```

### Decorator Order (Critical)

```typescript
@Router({ alias: "farm" })          // 3rd (nestjs-trpc registration)
@RegisterPolicy("farm")             // 2nd (scans @Policy metadata, registers)
@Policy({ authenticated: true })    // 1st (sets metadata via Reflect)
export class FarmRouter {}
```

## Auth → AuthZ Boundary

```
IDENTITY (packages/auth)
  "Who is this?"
  - Better Auth sessions
  - NEVER knows roles/permissions/orgs

AUTHORIZATION (packages/authorization)
  "What may they do?"
  - RBAC, policy engine, @Policy()
  - NEVER knows about animals/eartags/farms

EXECUTION (packages/execution)
  "What is the runtime environment?"
  - RLS, transactions, audit, tracing
  - DatabaseProvider via CLS
```

## Error Sovereignty Doctrine

1. **Neverthrow** — `Result<T, E>` from domain services
2. **Error code parsimony** — consolidate to `NOT_FOUND`, `FORBIDDEN`, `DATABASE_ERROR`
3. **Church and State** — services return `Result`, routers map to `TRPCError`

## Migration Status (July 2026)

| Phase                   | Status | Notes                                                                                                                                                            |
| ----------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1: Scaffold Packages    | ✅ Done | auth, authorization, execution packages created                                                                                                                  |
| 2: Principal + Pipeline | ✅ Done | Principal, PrincipalResolver, ExecutionPipeline, DatabaseProvider                                                                                                |
| 3: Migrate Routers      | ✅ Done | All 20 routers use ctx.execution.principal — stacked middleware removed                                                                                          |
| 4: @Policy Decorator    | ✅ Done | PolicyRegistry, @RegisterPolicy(), PolicyResolver global middleware                                                                                              |
| 5: Cleanup              | ✅ Done | Legacy columns deprecated (@deprecated tags), passwordHash nullable, auth relations in central relations.ts, tRPC types regenerated (20 routers, 93+ procedures) |

## Database

- 68 tables, 87 enums, 8 pgRoles, 156 indexes, 68 FKs, 39 RLS policies
- Host: `192.168.1.109:5432/tbot`, User: `tbot`
- Schema changes: `scripts/db-recreate.sh` (full reset) or Drizzle Kit migrations

## Key Architecture Decisions

| ADR  | Decision                                            |
| ---- | --------------------------------------------------- |
| 0001 | Auth vs Authorization: separate packages            |
| 0002 | Principal as canonical actor                        |
| 0003 | Composable execution pipeline stages                |
| 0004 | Policy actions not permissions                      |
| 0005 | Transport adapters in apps/ (not reusable packages) |
| 0006 | RLS via transactional connection (SET LOCAL)        |
| 0007 | Audit via lifecycle events                          |
| 0008 | Testing Doctrine                                    |
