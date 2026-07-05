# ADR 0011: Diamond Seal Layer Boundaries

**Status:** Accepted  
**Date:** 2026-07-05  
**Author:** RobotFarm  
**Supersedes:** N/A

## Context

Without explicit layer boundaries, codebases degenerate into circular dependencies, leaky abstractions, and "spaghetti" imports. Repositories publish events, routers contain business logic, and validators import domain internals. Each violation erodes testability, type safety, and reasoning about the system.

The Diamond Seal doctrine defines four distinct layers, each with a precise purpose, import scope, and behavioral contract. Without a documented boundary contract, developers lack a single source of truth for "what goes where."

## Decision

We adopt a **four-layer Diamond Seal boundary contract** with strict import/behavior rules per file type. Every file in the codebase must comply with its layer's rules.

### Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    L5 — Routers (router.ts)              │
│              Thin controllers, no business logic          │
│              Import: validators/api, domain services      │
├──────────────────────────────────────────────────────────┤
│                    L4 — Services (service.ts)             │
│              Business logic, orchestrate repo + events    │
│              Only layer that may publish events (future)  │
├──────────────────────────────────────────────────────────┤
│                    L4 — Repositories (repository.ts)      │
│              Data access, sole gatekeeper to database     │
│              Extends BaseRepository, no validation        │
├──────────────────────────────────────────────────────────┤
│                    L1 — Validators (api.ts)               │
│              Input/output schemas for tRPC routers        │
│              Uses .strict(), .omit({ tenantId: true })    │
└──────────────────────────────────────────────────────────┘
```

### Detailed Contracts

#### L1 — API Validators (`packages/validators/src/api/*.api.ts`)

**Purpose:** Input/output schemas for tRPC routers

**Must use:**
- `.strict()` on all response schemas
- `.omit({ tenantId: true })` on tenant-scoped create schemas
- `tenantId` stripping on `createInputSchema`
- `satisfies z.ZodType<T>` or `as z.ZodType<T>` (last resort) on all schemas
- `NoDrift`/`NoDriftSimple` guillotines to prevent schema/interface drift
- `ActivateGuillotines` export to enforce drift checks

**Import only from:**
- `@repo/database/zod` — Drizzle-Zod derived schemas
- `@repo/validators/enums` — branded enum schemas
- `@repo/database/constants` — internal enums

**Must NOT import:**
- `events/`, `integrations/`, `domains/`, `queue/`

**File naming:** `<domain>.api.ts`

#### L5 — Routers (`apps/api/src/**/*.router.ts`)

**Purpose:** Expose tRPC procedures, delegate to services, unwrap `Result<T,E>`

**LAW 1 (Router Does NOT Think):**
- No business logic
- No direct DB access
- No event publishing

**Import only from:**
- `@repo/validators/api` — input/output schemas
- `@repo/validators/enums` — enum schemas
- `@repo/validators/errors` — `TRPC_ERROR_MAP`
- `@repo/domains-*` — domain services (via DI only)
- `@repo/trpc` — `createResultUnwrapper`
- `@rocky/authorization` — `@Policy()` decorator
- `@nestjs/common` / `nestjs-trpc` / `@trpc/server`

**NEVER import:**
- `integrations/`, `events/`, `database/`, `domains/schemas/`, `domains/*/src/repositories/`

**Pattern:** `return unwrapResult(result)` — NEVER `return result.data`

**File naming:** `<domain>.router.ts`

#### L4 — Domain Services (`packages/domains/<domain>/src/**/*.service.ts`)

**Purpose:** Business logic, orchestrate repositories

**Import allowed from:**
- `@repo/validators/api` — API types and response schemas
- `@repo/database/constants` — enum dictionaries
- `@repo/domains-shared` — `ok()` / `err()` / `Result`
- `@repo/logger` / `nestjs-pino`
- Own `<domain>.repository.ts`, `<domain>.errors.ts`, own `flows/`
- Cross-domain repos/services (via DI only)

**NEVER import:**
- `@repo/validators/integrations`
- `@repo/validators/internal`
- `@repo/validators/api/*` for DB types
- L3 adapter packages (`@repo/telegram`, `@repo/asterisk-ami`, etc.)
- `@repo/database/zod` — use `typeof table.$inferInsert` instead

**Return type:** Always `Promise<Result<T, E>>`

**Pattern:** `validate` → inject tenant context → delegate to repo → return `ok()` / `err()`

**File naming:** `<feature>.service.ts`

#### L4 — Domain Repositories (`packages/domains/<domain>/src/**/*.repository.ts`)

**Purpose:** Sole gatekeeper to the database

**Extends:** `BaseRepository` (from `@repo/domains-shared`)

**Import allowed from:**
- `@repo/database` — barrel (tables, relations)
- `@repo/database/constants` — enum dictionaries
- Own `<domain>.module.ts`, local types

**NEVER import:**
- `@repo/validators/*`
- `@repo/domains-*`
- `@repo/queue`, `@repo/queue/src/`
- `integrations/`

**NEVER publish events** — only services publish (LAW 4 anti-pattern)

**NEVER return API types** — return DB entity types only (`typeof table.$inferSelect`)

**File naming:** `<entity>.repository.ts`

### Summary Table

| Rule | api.ts (L1) | router.ts (L5) | service.ts (L4) | repository.ts (L4) |
|------|-------------|----------------|-----------------|-------------------|
| Can publish events | ❌ | ❌ | ✅ (future) | ❌ |
| Can call domain services | ❌ | ✅ via DI | ✅ via DI | ❌ |
| Can access database | ❌ | ❌ | ❌ (use repo) | ✅ |
| Can import validators/api | — | ✅ | ✅ | ❌ |
| Can import validators/events | ❌ | ❌ | ✅ (future) | ❌ |
| Can import domains-\* | ❌ | ✅ (services) | ✅ (except forbidden) | ❌ |
| Can import queue | ❌ | ❌ | ✅ (future) | ❌ |
| Returns Result\<T,E\> | N/A | runtime unwrap | ✅ | may return Result |
| Pattern | `satisfies z.ZodType` | `return unwrapResult()` | `repo → ok()/err()` | `BaseRepository` |
| Drift prevention | `NoDrift` guillotines | N/A | N/A | N/A |

## Consequences

### Positive

- **Clear ownership:** Every developer knows exactly what to put where
- **No circular dependencies:** Strict import boundaries prevent cycles
- **Testability:** Layers can be mocked at defined boundaries
- **Type safety:** Each layer returns appropriate types (API vs DB)
- **Reasoning:** Business logic lives in services, data access in repositories
- **Onboarding:** New developers learn the architecture in minutes

### Negative

- **Enforcement requires discipline:** CI checks needed for import rules
- **Cross-boundary refactors:** Moving code between layers requires careful import auditing
- **Boilerplate:** Repositories must always use `withRls()` and `validate()`

### Neutral

- **Repository pattern:** Known pattern, well-documented in NestJS ecosystem
- **Result type pattern:** Requires understanding of `neverthrow` at boundaries

## Implementation

### CI Enforcement

```typescript
// scripts/check-layer-boundaries.ts — enforces import rules per file type
// Run: pnpm check:layers
// Rules: api.ts → no domains/ imports, router.ts → no database/ imports, etc.
```

### Code Review Checklist

- [ ] Does `api.ts` use `.strict()`, `.omit({ tenantId: true })`, and `satisfies`?
- [ ] Does `api.ts` have `NoDrift` guillotines and `ActivateGuillotines` export?
- [ ] Does `router.ts` contain business logic? (It shouldn't)
- [ ] Does `router.ts` use `@Policy()` for authorization? (Not inline checks)
- [ ] Does `service.ts` return `Result<T,E>`?
- [ ] Does `repository.ts` extend `BaseRepository` and avoid forbidden imports?
- [ ] Are imports within each layer's allowed scope?
- [ ] Does `repository.ts` avoid publishing events or importing validators?

## Alternatives Considered

### 1. Single-Layer Architecture (NestJS Default)

**Why rejected:** Default NestJS encourages logic in controllers and services mixed with DB access. No import boundaries.

### 2. Clean Architecture (Outer → Inner)

**Why rejected:** Over-engineered for this codebase size. Diamond Seal layers are simpler and sufficient.

### 3. No Enforcement

**Why rejected:** Codebases inevitably degenerate. Explicit contracts prevent entropy.

## Current State (July 2026)

### Implemented

- **Import boundaries:** All 81 files pass forbidden import checks (100% clean)
- **Result types:** All 22 services return `Promise<Result<T, E>>` (100%)
- **Router thinness:** 18/20 routers are pure delegates (90%)
- **Repository purity:** 20/20 repositories publish zero events (100%)
- **Diamond Seal compliance:** 11/19 api.ts files have guillotines (58%)

### Known Violations

- **notification.router.ts:** Inline role-based auth (should use `@Policy()`), manual TRPCError throws
- **8 api.ts files:** Missing `satisfies` and/or guillotines (archive, holdings, organizations, pda-devices, rbac, registration, subjects, users)
- **risk-analysis.service.ts:** Direct DB access (documented exception for cross-table analytics)
- **todo.service.ts:** Demo domain with no repository (intentional simplification)

## Future Roadmap

### Planned Additions

- **Observability (`@repo/observability`):** `withSpan()` tracing for service layer operations
- **Event System (`@repo/queue`):** `EventPublisher` for async domain events
- **`@repo/validators/events`:** Event payload type schemas
- **`ValidatedRepository`:** Enhanced base class with `withRls()` and `validate()` support

These additions will be implemented when the codebase reaches sufficient scale to justify the infrastructure overhead. Current direct cross-domain calls are adequate for the present domain count.

## References

- [Diamond Seal Validation Doctrine](../../packages/validators/src/utils/type-bridge.ts)
- [NestJS Providers](https://docs.nestjs.com/providers)
- [neverthrow Result Pattern](https://neverthrow.gitbook.io/neverthrow)

## Related ADRs

- ADR 0008: Diamond Seal Testing Doctrine
- ADR 0010: Date Coercion Architecture
