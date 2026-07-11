# ADR-0008: Testing Doctrine — Diamond Seal Testing Infrastructure

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-05 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The Rocky codebase had **zero tests**. The testing infrastructure needed to be designed from scratch, aligned with the existing Diamond Seal architecture (Drizzle → Dumb Zod → API Zod → Factory) and the architecture defined in the [Auth Architecture](../AUTH_ARCHITECTURE.md) and [Testing Doctrine](../TESTING_DOCTRINE.md).

The codebase has several specific properties that constrain the testing approach:

1. **Zod 4** (`zod: 4.4.3`) — The codebase uses Zod 4, which has a different type hierarchy from Zod 3. Specifically, `ZodObject` in Zod 4 does not satisfy the `ZodTypeAny` constraint that `z.infer<>` expects, causing type errors when using `z.infer` on drizzle-zod generated schemas.

2. **drizzle-zod** (`drizzle-orm/zod`) — The `createSelectSchema` factory produces `BuildSchema` types that extend Zod 4's `ZodObject` but do not satisfy the older `ZodTypeAny` constraint used by `z.infer`. The `_zod.output` property on the schema object provides direct access to the output type.

3. **vitest v4** — The codebase uses `vitest: ^4.1.9`. In vitest v4, `Mock` takes a single type argument (`Mock<T extends Procedure>`), not two (`Mock<Args, Return>`). `vi.fn<T>()` expects `T extends Procedure = (...args: any[]) => any`.

4. **PostgreSQL RLS** — Row-Level Security requires `SET LOCAL` session variables within explicit transactions. E2E tests must use a real Postgres database to verify RLS policies.

5. **neverthrow Result pattern** — All domain services return `Result<T, E>`. Error paths must be tested as first-class citizens, not exceptions.

## Decision

### Package Structure

Create `packages/testing/` as a reusable testing infrastructure package:

```txt
packages/testing/
├── package.json           ← @rocky/testing
├── tsconfig.json          ← exactOptionalPropertyTypes: false
├── vitest.config.ts       ← Vitest v4 configuration
└── src/
    ├── index.ts           ← Barrel export
    ├── setup.ts           ← Global setup (production DB guard)
    ├── factory/
    │   ├── base.ts        ← SchemaDataFactory<T> base class
    │   ├── type-helpers.ts ← InferSelectSchema<T> (Zod 4 compat bridge)
    │   ├── index.ts       ← Factory barrel
    │   └── factories/     ← Domain-specific factories
    └── scenarios/
        ├── index.ts       ← Scenario barrel
        ├── scenario-a.ts  ← API validator testing
        ├── scenario-b.ts  ← Domain service (mock repository)
        └── scenario-c.ts  ← E2E (real database)
```

### The Three Testing Scenarios

| Scenario | What You Test                          | How                                      | Database? | Tool                                   |
| -------- | -------------------------------------- | ---------------------------------------- | --------- | -------------------------------------- |
| **A**    | API Schema validation rules            | Factory + `.safeParse()`                 | ❌ No      | `scenarioA_validatorTest()`            |
| **B**    | Domain business logic (Result pattern) | Mock Repository + Factory                | ❌ No      | `mockRepoReturn()` / `mockRepoThrow()` |
| **C**    | Full pipeline (tRPC Router → DB)       | Real Postgres (testcontainers) + Factory | ✅ Yes     | `createE2EContext()`                   |

### Factory Pattern

All test factories extend `SchemaDataFactory<TRecord>` and follow these rules:

1. **Constructor defaults use `faker.helpers.arrayElement(VALUES)`** for random valid enum values
2. **State-specific creation methods use `DICTIONARY.KEY`** (compiler-verified) for static enum values
3. **No hardcoded string literals** for enum fields
4. **Type inference via `InferSelectSchema`** (not `z.infer`) to avoid Zod 3/4 type incompatibility

### Mocking Rules

1. **NEVER mock `@rocky/database`** — The physical laws of PostgreSQL cannot be mocked.
2. **Mock the Repository interface** — The shovel, not the physical storage.
3. **Always verify mock calls** — `expect(mockRepo.findById).toHaveBeenCalledWith(id)`.

### Zod 4 Type Bridge

`z.infer<typeof someSelectSchema>` does not work with drizzle-zod schemas in Zod 4 because `BuildSchema` (which extends `ZodObject`) does not satisfy `ZodTypeAny`. The solution is structural extraction:

```typescript
export type InferSelectSchema<T> = T extends {
  readonly _zod: { readonly output: infer O };
} ? O : never;
```

This reads `_zod.output` from the `ZodObject` internals, bypassing the generic constraint entirely.

### Vitest v4 Compatibility

In vitest v4:

- `Mock` takes 1 type argument: `Mock<() => Promise<T>>`
- `vi.fn<T>()` where `T extends Procedure = (...args: any[]) => any`
- `mockResolvedValue` expects `Awaited<ReturnType<T>>` which can be stricter than expected

Mock helpers use explicit casting via `(mock as any).mockResolvedValue(value)` to work around the `Awaited` constraint.

## Consequences

### Positive

1. **Type safety through the Diamond Seal**: Factory-generated data satisfies both Drizzle and Zod types simultaneously.
2. **No database mocking**: The physical reality of PostgreSQL is never abstracted away.
3. **Three clear testing levels**: Developers know exactly what to test and how.
4. **Fast unit tests**: Scenarios A and B run in milliseconds without infrastructure.
5. **Zod 4 compatible**: The `InferSelectSchema` bridge works with both Zod 3 and Zod 4 code.
6. **Production-ready E2E**: Testcontainers spin up real Postgres, run migrations, verify RLS policies.

### Negative

1. **Learning curve**: The Diamond Seal testing doctrine is opinionated. Developers must learn the factory + mock repository pattern.
2. **Factory maintenance**: Each new domain requires a new factory file. Adding a factory is more work than inline test data.
3. **Vitest v4 quirks**: The `Mock` type and `mockResolvedValue` `Awaited` constraint require explicit casting in some edge cases.
4. **Dynamic imports in scenario-c**: E2E context uses `Function('return import(...)')()` to avoid static module resolution failures, which is unconventional.

## Alternatives Considered

### A: `z.infer` on drizzle-zod schemas

**Rejected.** TypeScript compilation fails because drizzle-zod's `BuildSchema` extends `ZodObject` which doesn't satisfy Zod 4's `ZodTypeAny` constraint. The error surfaces in LSP even when `tsc --noEmit` passes with `skipLibCheck`.

### B: Hand-written record types instead of type inference

**Rejected but partially adopted.** Hand-writing types duplicates the schema definition and drifts over time. `InferSelectSchema` provides automatic type inference from the Drizzle schema, which is the correct abstraction.

### C: bun:test instead of vitest

**Rejected.** The codebase uses vitest v4 as the standard test runner (available in pnpm catalog). vitest provides better NestJS/tRPC integration than bun:test.

### D: Inline test data instead of factories

**Rejected.** Inline data is brittle, untyped, and drifts from the schema. Factories guarantee type compliance and make intent clear through named creation methods (`createDraft()`, `createPending()`, etc.).

## Migration Path

### Phase 1: Package Infrastructure (Done)

- [x] `packages/testing/package.json` — vitest + faker + tsconfig-paths
- [x] `SchemaDataFactory<T>` base class with runtime validation
- [x] `InferSelectSchema<T>` type bridge
- [x] `EarTagOrderFactory` and `FarmFactory` example factories
- [x] Scenario A/B/C helpers
- [x] `docs/TESTING_DOCTRINE.md` — doctrine document
- [x] `docs/adr/0008-testing-doctrine.md` — this ADR

### Phase 2: Domain Factories

- [ ] Add `AnimalFactory`, `MovementFactory`, `InspectionFactory`, etc.
- [ ] Add vendor-enum factories where needed (e.g., external system codes)

### Phase 3: Test Coverage

- [ ] Scenario A tests for all API validator schemas (in `packages/validators`)
- [ ] Scenario B tests for all domain services (in `packages/domains`)
- [ ] Scenario C E2E tests for critical tRPC router flows (in `apps/api`)

### Phase 4: CI Integration

- [ ] Add `pnpm test` pipeline in CI
- [ ] Add coverage reporting
- [ ] Add E2E test job with testcontainers

## References

- [Testing Doctrine](../TESTING_DOCTRINE.md) — full doctrine document
- [ADR-0001](0001-auth-vs-authorization-boundary.md) — Auth vs. Authorization Boundary
- [ADR-0003](0003-execution-pipeline-stages.md) — Execution Pipeline
- [ADR-0006](0006-rls-via-transactional-connection.md) — RLS via Transactional Connection
- `packages/testing/src/factory/base.ts` — SchemaDataFactory implementation
- `packages/testing/src/factory/type-helpers.ts` — Zod 4 compat bridge
