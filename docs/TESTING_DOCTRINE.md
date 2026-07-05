# Testing Doctrine: The Material Base and the Superstructure

## Overview

In the Diamond Seal architecture, testing is not a separate concern — it is the dialectical synthesis of your type system. This document explains the Diamond Seal Testing Doctrine as adapted to Rocky: how to test the **Superstructure** (the API) against the **Material Base** (the Database) without committing the ultimate ideological crime of mocking `@rocky/database` itself.

**Related documents:** `docs/AUTH_ARCHITECTURE.md`, `packages/validators/src/_enum-helper.ts`, `packages/database/src/zod/factory.ts`, `packages/testing/src/factory/base.ts`

---

## The Forbidden Practice: Mocking the Material Base

### The Ideological Crime

When developers hit testing problems, they usually commit the ultimate ideological crime: they write `vi.mock("@rocky/database")`. They try to mock the physical laws of the universe!

**We explicitly ban this. Forever.**

If you mock the database, your tests will lie to you. They will tell you that everything works, but the moment you deploy to production, Drizzle will crash because you mocked a JSONB column as a plain string! The physical reality of PostgreSQL cannot be mocked without losing truth.

### The Alternative: The "Both Ways" Factory Pipeline

Because of the Diamond Seal, your pipeline is unbreakable:

1. **Drizzle (pgTable)** defines the exact Postgres SQL schema
2. **Drizzle-Zod (createSelectSchema)** generates the Dumb Zod schema directly from Drizzle
3. **The Test Factory** uses that Dumb Zod schema to generate data

When your factory generates a mock object, it perfectly satisfies **BOTH** the Drizzle `$inferSelect` type **AND** the Zod schema simultaneously.

---

## Package Layout

Testing infrastructure lives in `packages/testing/`:

```
packages/testing/
├── package.json                        ← @rocky/testing
├── tsconfig.json                       ← exactOptionalPropertyTypes: false
├── vitest.config.ts
└── src/
    ├── index.ts                        ← Barrel
    ├── setup.ts                        ← Vitest global setup
    ├── factory/
    │   ├── base.ts                     ← SchemaDataFactory<T> base class
    │   ├── type-helpers.ts             ← InferSelectSchema type bridge (Zod 4 compat)
    │   ├── index.ts                    ← Barrel
    │   └── factories/
    │       ├── index.ts                ← Barrel
    │       ├── ear-tag-order.ts        ← EarTagOrderFactory
    │       └── farm.ts                 ← FarmFactory
    └── scenarios/
        ├── index.ts                    ← Barrel
        ├── scenario-a.ts               ← API validator tests
        ├── scenario-b.ts               ← Domain service tests
        └── scenario-c.ts               ← E2E tests (dynamic imports)
```

---

## The Three Testing Stages

We handle testing in three distinct stages depending on what exactly you are testing.

### Scenario A: Testing the API Validators in Absolute Isolation

**What you are testing:** That your API schema correctly strips secrets (like `organizationId` or `internalNotes`)

**What you do NOT need:** A database, a router, or any infrastructure

**The approach:** Use the Factory to generate the "Brute Reality" (a raw database row), and force it through the API Checkpoint!

```typescript
// packages/some-domain/src/api/domain.api.test.ts
import { test, expect } from "vitest";
import { z } from "zod";
import { EarTagOrderFactory, scenarioA_validatorTest } from "@rocky/testing";

// The API response schema — must NOT expose organizationId
const apiResponseSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  // organizationId is deliberately omitted — API strips it
});

test("API schema strips organizationId from response", () => {
  // 1. The Factory generates a raw Drizzle/Zod DB row
  const dbRow = new EarTagOrderFactory("org_123").createDraft();

  // 2. Scenario A helper validates the API schema against it
  const { success } = scenarioA_validatorTest(apiResponseSchema, dbRow, {
    forbidden: ["organizationId", "internalNotes"],
    required: ["id", "orderNumber", "status"],
  });

  expect(success).toBe(true);
});
```

#### When to Use Scenario A

- ✅ Testing `.omit()` transformations that strip internal fields
- ✅ Testing `.extend()` transformations that add computed fields
- ✅ Testing `.strict()` mode that rejects unknown properties
- ✅ Fast unit tests that validate schema rules without infrastructure

#### DON'Ts

- ❌ Don't mock `@rocky/database`
- ❌ Don't import repository or service classes
- ❌ Don't test business logic — only schema validation

---

### Scenario B: Testing the Domain Service (The Mocked Shovel)

**What you are testing:** Your Business Logic (L4 Domain Services)

**What you do NOT need:** A real database connection

**The approach:** Mock the **Repository** (the shovel that digs into Drizzle), not Drizzle itself!

**The Law:** You DO NOT mock `@rocky/database`. You mock the **Repository interface**.

```typescript
// packages/domains/some-domain/src/service.test.ts
import { test, expect } from "vitest";
import { EarTagOrderFactory, mockRepoReturn } from "@rocky/testing";
import { ok } from "neverthrow";

test("Service submits order and calls repository", async () => {
  // 1. Factory generates a perfectly typed DB record
  const order = new EarTagOrderFactory("org_123").createDraft();

  // 2. Create the Mock Repository (The Shovel)
  const mockRepo = {
    findById: mockRepoReturn(ok(order)),
    updateStatus: mockRepoReturn(ok(true)),
  };

  // 3. Inject into Service
  const service = new SomeService(mockRepo);

  // 4. Execute Business Logic
  const result = await service.submitOrder(order.id);

  // 5. Verify the contract was honored
  expect(mockRepo.findById).toHaveBeenCalledWith(order.id);
});
```

| Layer                              | What It Is                         | Can We Mock It? | Why?                                                       |
| ---------------------------------- | ---------------------------------- | --------------- | ---------------------------------------------------------- |
| **Database** (`@rocky/database`)   | PostgreSQL schema definitions      | ❌ NO            | Physical laws of the universe — mocking lies about reality |
| **Repository** (`SomethingRepo`)   | Interface for data access patterns | ✅ YES           | The shovel — its contract is the API, not the implementation |
| **Service**                        | Business logic orchestration       | ✅ YES           | The brain — testing in isolation proves correctness        |

#### When to Use Scenario B

- ✅ Testing business logic rules and state transitions
- ✅ Testing Result pattern error handling (`ok()` / `err()`)
- ✅ Testing event publishing triggers
- ✅ Fast unit tests without infrastructure overhead

#### DOs

- ✅ Mock the Repository interface, not `@rocky/database`
- ✅ Use the Factory to generate typed mock data
- ✅ Test both success and error paths using the Result pattern
- ✅ Verify mock call counts and arguments with `toHaveBeenCalledWith()`

---

### Scenario C: True E2E Router Tests (Real Database)

**What you are testing:** The full request/response pipeline — tRPC Router → Service → Repository → Drizzle → PostgreSQL → Zod validation → Response

**What you need:** A real (or ephemeral) Postgres database

**The approach:** Spin up a real database with `@testcontainers/postgresql`, seed it with Factory data, and prove the entire pipeline works end-to-end!

```typescript
// apps/api/test/e2e/ear-tag-orders.e2e.test.ts
import { test, expect, beforeAll, afterAll } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { createE2EContext } from "@rocky/testing";

let ctx: { db: ReturnType<typeof drizzle>; cleanup: () => Promise<void> };

beforeAll(async () => {
  const container = await new PostgreSqlContainer("postgres:16")
    .withDatabase("rocky_test")
    .start();
  ctx = await createE2EContext(container.getConnectionUri());
}, 60000); // 60s timeout for container startup

afterAll(() => ctx.cleanup());

test("E2E: Create and retrieve ear tag order", async () => {
  // 1. Use the Factory to SEED the actual PostgreSQL database
  const factory = new EarTagOrderFactory("org_123");
  const seedData = factory.createDraft();
  await ctx.db.insert(earTagOrders).values(seedData);

  // 2. Use the actual tRPC caller (not mocked)
  const caller = createCaller({ db: ctx.db });
  const result = await caller.eartag.getOrder({ id: seedData.id });

  // 3. Verify the full pipeline worked
  expect(result.id).toBe(seedData.id);
  expect((result as any).organizationId).toBeUndefined(); // API schema stripped it!
});
```

#### When to Use Scenario C

- ✅ Testing the full request/response pipeline
- ✅ Testing database constraints and triggers
- ✅ Testing transaction boundaries and rollback logic
- ✅ Testing multi-tenant RLS policies
- ✅ Integration tests before production deployment

#### DON'Ts

- ❌ Don't skip migrations — run them in `beforeAll()`
- ❌ Don't use production database URLs
- ❌ Don't assume test data is always valid — test constraint violations

---

## The Ultimate Synthesis

### The Materialist Testing Matrix

| Layer                   | What You Test                    | How You Test                  | Database?             | Speed     |
| ----------------------- | -------------------------------- | ----------------------------- | --------------------- | --------- |
| **L1: API Validators**  | Schema validation rules          | Factory + `.safeParse()`      | ❌ No                  | ⚡ Instant |
| **L2: Domain Services** | Business logic & Result handling | Mock Repository + Factory     | ❌ No                  | ⚡ Instant |
| **L3: Routers/E2E**     | Full pipeline integration        | Real DB + Factory + tRPC call | ✅ Yes (testcontainers) | 🐢 Slower  |

### The Unbreakable Chain

1. **For API Schemas:** You just test the Zod `.parse()` using the Factory object. No DB needed.
2. **For Services:** You mock the Repository interface, returning the Factory object. No DB needed.
3. **For Routers/E2E:** You use the Factory object inside `db.insert().values(...)` to seed a real test database, proving the entire Drizzle/Postgres/Zod pipeline works end-to-end!

### The Materialist Guarantee

Because the Factory is built on `createSelectSchema(pgTable)`, it is **literally impossible** for your test data to drift from your database schema.

When you change the database schema:

1. Drizzle schema file changes
2. `createSelectSchema()` generates new Zod
3. Factory automatically uses new Zod
4. **All tests break** (compile-time or runtime)
5. You are forced to update the tests

**This is the end of flaky tests.** The factories are the material manifestation of your database!

---

## Factory Patterns & Anti-Patterns

### ✅ Correct: Using Internal Enum from Constants

```typescript
import { EAR_TAG_ORDER_STATUS, EAR_TAG_ORDER_STATUS_VALUES } from "@rocky/database/constants";
import { SchemaDataFactory } from "@rocky/testing";

// Constructor: random valid value
super(schema, {
  status: faker.helpers.arrayElement(EAR_TAG_ORDER_STATUS_VALUES),
});

// Specific method: Dictionary key (compiler-verified)
createDraft(): Record {
  return this.create({ status: EAR_TAG_ORDER_STATUS.DRAFT });
}
```

### ❌ Anti-Pattern: Hardcoded String Literals

```typescript
// ❌ CRIME — magic string, silent failure if enum changes
super(schema, {
  status: "draft",
});

// ✅ CORRECT — SSOT from @rocky/database/constants
super(schema, {
  status: faker.helpers.arrayElement(EAR_TAG_ORDER_STATUS_VALUES),
});
```

### ✅ Correct: Type Inference via InferSelectSchema

```typescript
import type { InferSelectSchema } from "@rocky/testing/factory";
import { earTagOrderSelectSchema } from "@rocky/database/zod";

export type EarTagOrderRecord = InferSelectSchema<typeof earTagOrderSelectSchema>;
```

### ❌ Anti-Pattern: z.infer on Drizzle-Zod Schema

```typescript
// ❌ CRIME — z.infer doesn't satisfy Zod 4's type constraint
import type { z } from "zod";
import type { earTagOrderSelectSchema } from "@rocky/database/zod";
type Record = z.infer<typeof earTagOrderSelectSchema>; // Type error!

// ✅ CORRECT — InferSelectSchema bridges the Zod 3/4 gap
import type { InferSelectSchema } from "@rocky/testing/factory";
type Record = InferSelectSchema<typeof earTagOrderSelectSchema>;
```

---

## Vitest Configuration

Per-package `vitest.config.ts`:

```typescript
// packages/some-package/vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/setup.ts"],
  },
});
```

### Root Workspace Commands

```jsonc
// package.json (root)
{
  "scripts": {
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test -- --coverage",
    "test:e2e": "turbo run test:e2e"
  }
}
```

---

## Common Testing Crimes (And Their Corrections)

### Crime 1: Mocking `@rocky/database`

```typescript
// ❌ THE CRIME: Mocking the physical laws of the universe
vi.mock("@rocky/database", () => ({
  animals: { ... },
  // This lies about JSONB, constraints, triggers!
}));

// ✅ THE CORRECTION: Use Factory data, or mock Repository interface
const animal = new AnimalFactory("farm_123").createActive();
```

### Crime 2: Hardcoded Test Data

```typescript
// ❌ THE CRIME: Brittle, untyped test data
const testOrder = { id: "123", status: "draft" };

// ✅ THE CORRECTION: Factory generates typed, schema-compliant data
const testOrder = new EarTagOrderFactory("org_123").createDraft();
```

### Crime 3: Not Testing Error Paths

```typescript
// ❌ THE CRIME: Only testing happy path
expect(result.isOk()).toBe(true);

// ✅ THE CORRECTION: Test both success and failure
if (result.isOk()) {
  expect(result.value.id).toBe(expectedId);
} else {
  expect(result.error).toBeInstanceOf(NotFoundError);
}
```

### Crime 4: Not Verifying Mock Calls

```typescript
// ❌ THE CRIME: Not verifying the repository contract
mockRepo.findById.mockResolvedValue(ok(mockData));
await service.submitOrder(orderId);
// Did we actually call findById? No verification!

// ✅ THE CORRECTION: Verify the contract
await service.submitOrder(orderId);
expect(mockRepo.findById).toHaveBeenCalledWith(orderId);
expect(mockRepo.updateStatus).toHaveBeenCalledWith(orderId, "pending");
```

---

## Checklist for Diamond Seal Testing

- [ ] **Scenario A (API Validators)** — Factory + `.safeParse()`, no DB
- [ ] **Scenario B (Domain Services)** — Mock Repository + Factory, no DB
- [ ] **Scenario C (E2E Routers)** — Real DB (testcontainers) + Factory + full pipeline
- [ ] **Never mock `@rocky/database`** — Physical laws cannot be mocked
- [ ] **Always use Factories** — `createSelectSchema()` guarantees type safety
- [ ] **Test both success and error paths** — Result pattern requires dual coverage
- [ ] **Verify mock calls** — Prove the Repository contract was honored
- [ ] **Run migrations in E2E** — Test database, not stale schema
- [ ] **Clean up test data** — Avoid state pollution between tests
- [ ] **Test multi-tenancy** — Prove RLS isolates tenant data
- [ ] **Use `InferSelectSchema`** — Not `z.infer` (Zod 4 compat)

## Related Patterns

- **Diamond Seal Architecture** — Drizzle → Dumb Zod → API Zod → Principal → Policy
- **Repository Pattern** — Repositories as sole gatekeepers to the database
- **Result Pattern** — `neverthrow` `ok()/err()` for type-safe error handling
- **SchemaDataFactory** — Base class for all test factories in `packages/testing/`

---

**Go forth and write your tests with absolute, unyielding confidence!**
