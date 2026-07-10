> *Adapted from the Diamond Seal `@repo/*` doctrine to the Rocky `@rocky/*` monorepo — package scope `@repo/*` → `@rocky/*` and tooling `bun` → `pnpm`. Example entities (`rides`, `hr`, `telephony`, …) are illustrative; substitute your real `@rocky/domains-*` package.*

# Router Patterns & Anti-Patterns

## Overview

tRPC Routers are the **Diplomats** of the Diamond Seal architecture. They sit at Layer 5 — the outermost edge of the backend — and speak two languages: the language of the Frontend (tRPC procedures, JSON) and the language of the Domain (service calls, canonical types).

**The Router's only job:** Receive request → Validate input → Hand to service → Unwrap result → Return response.

The Router does **not** think. It does **not** decide. It does **not** contain business logic.

**Diamond Seal position:** Layer 5 (Application Layer) — between Frontend (L6) and Domain Services (L4).

**Related panopticon rules:** `LAW1`, `LAW3I`, `LAW5S`, `LAW19B`, `law30` (NAPI: force `z.strictObject()` in api/ and events/ validators)

**Related documents:** `ROUTER_DESIGN.md` (ideological crimes + canonical blueprint), `RESULT_MONAD_AND_ERROR_SOVEREIGNTY.md` (Result pattern)

---

## Core Diagnosis: The Missing `@Output()` (the "orphan @Output" trap)

> **TL;DR** — If your `nestjs-trpc` generated client file type-imports your backend router classes (`ReturnType<XxxRouter["method"]>`), you get **TS6059** ("File is not under `rootDir`") and, if you "fix" it by depending on the backend package, a **circular dependency**. The real fix is not to rewire imports — it's to give every router procedure an `@Output` schema. With `@Output` present, generation emits `as any` and imports nothing from the backend.

### 1. How nestjs-trpc generation actually works (the crux)

For each `@Query`/`@Mutation`, the generator decides the output type of the client like this:

| Procedure has… | Generator emits for the output | Backend import pulled in? |
| --- | --- | --- |
| `@Output(schema)` (the `output:` key in the decorator options) | `as any` | **No** |
| no `output:` | `Awaited<ReturnType<RouterClass["method"]>>` | **Yes** (imports the router class from `@rocky/api/src/trpc/routers/...`) |

So **any procedure missing `output:` drags the entire backend source into the consumer's type program.** The fix is purely: make every procedure have `output:`. No import rewriting, no new package dependency.

> **Note:** `@Output` is **not** a separate decorator. It is a *key in the decorator options object*: `@Query({ input: z..., output: mySchema })` / `@Mutation({ input: z..., output: mySchema })`.

### 2. Symptoms you'll see

- **TS6059**: `File '.../apps/api/src/trpc/routers/archive.router.ts' is not under 'rootDir' '.../packages/trpc/src'.` in `packages/trpc`.
- `turbo run build --dry` → `Circular package dependency detected: @rocky/api, @rocky/trpc` (if someone "fixed" it by adding `@rocky/api` to `packages/trpc`).
- Frontend type errors cascading from `Cannot find module '@rocky/trpc'` once `@AppRouter` silently becomes `any` (because the bare specifier failed to resolve).

### 3. The WRONG approach (what we did first, then reverted)

**Do not do this:**

- Add `"@rocky/api": "workspace:*"` to `packages/trpc/package.json`.
- Add an `IMPORT_REWRITE` block to the post-generate patch script (e.g. `scripts/patch-trpc-transformer.mjs`) that rewrites the router imports from a source path to the `@rocky/api/...` alias.

**Why it's wrong:** it makes `packages/trpc` depend on `apps/api`, which depends on `packages/trpc` transitively → **circular dependency**. It also leaves the type unsound. It only *hides* ts6059; it doesn't remove the backend-class import.

**Reversion checklist (if you ever see this pattern):**

- Remove the `@rocky/api` dep from the transport package.
- Delete the `IMPORT_REWRITE_TARGETS` / router-import-rewrite block from the patch script (keep only the legitimate `superjson` transformer injection).
- Re-run generation; confirm `0` `from "@rocky/api"` lines remain.

### 4. The CORRECT approach (what we shipped)

Give every procedure a real `output` schema.

#### 4.1 Inventory the orphans

Grep the generated file for `ReturnType<`. Each hit = one procedure missing `@Output`. Count them and map to routers.

#### 4.2 Create the missing response schemas (Diamond Seal conventions)

In the validators package (`@rocky/validators/api/*.api.ts`), add schemas following these rules:

- **Single entity:** reuse the existing `*ResponseSchema` (usually `selectSchema.omit({ createdBy, validTo }).strip()`).
- **List/paginated:** `z.object({ data: z.array(XResponseSchema), total: z.number(), limit: z.number(), offset: z.number() }).strip()`.
- **Array-only** (e.g. `getVaccineDiseases`, `iot.listGeofences`): `z.array(XResponseSchema)` — do **not** call `.strip()` on a `ZodArray` (it has no such method; only `ZodObject` does).
- **Primitive/flag returns:** `z.object({ deleted: z.boolean() }).strip()`, `z.object({ blocked: z.boolean() }).strip()`.
- **Genuinely unmodeled** (e.g. a raw YAML/printed form): `z.any()` or `z.array(z.unknown())` — acceptable only when there is no schema, not as a lazy default.
- **void returns:** `z.void()` (e.g. a delete-style mutation that returns nothing).

> **Convention reminder:** response schemas use `.strip()` (strip unknown keys). Request schemas use `.pick(...)`/`.strictObject(...)`. Do **not** use `.strict()` on response schemas — it caused a separate systemic bug (see §6).

#### 4.3 Wire `output:` into each router

For each orphan procedure, add `output: <schema>` to its decorator and import the schema from `@rocky/validators/api`.

- Use minimal, unique edits (decorator line + method-signature line). Long multi-procedure blocks drift because a formatter runs on save and the `oldText` stops matching.
- For procedures that share `@Query({ input: idParam })`, disambiguate by the method name in the 2-line match (e.g. `getById` vs `shipToVs` vs `deliverToKeeper`).
- For multi-line inline input schemas (e.g. `listRiskAnalyses`, `listGeofenceEvents`), insert `output:` right after the `input:` object closes — and include any `@Policy(...)` decorator line that sits between the decorator and the method, or the match will fail.

#### 4.4 Rebuild + regenerate

```bash
cd packages/validators && pnpm build   # so dist exposes the new schemas (routers import from dist, not src)
pnpm generate:trpc  # run from repo root   # regenerates the client. Confirm 0 ReturnType< and 0 backend imports
```

#### 4.5 Export `AppRouter` properly from the transport package

- Add `export type { AppRouter } from "./generated/server.js";` to `packages/trpc/src/index.ts`.
- Add a `"."` entry to `packages/trpc/package.json` `exports` (pointing to `./dist/index.js` / `./dist/index.d.ts`). Without this, the bare `@rocky/trpc` import fails while subpaths like `@rocky/trpc/superjson` still resolve — and that single failure cascades into hundreds of fake `{}`/`void`/`any` errors in every frontend form.
- Fix the `./generated` subpath export if it points at a non-existent `generated/index` (it should be `generated/server`).
- `cd packages/trpc && pnpm build`.

#### 4.6 Point the frontends at the real type

- **Web** (`apps/web/src/trpc/client.ts`): `import type { AppRouter } from "@rocky/trpc";` (was `"./server.js"`).
- **Mobile** (`@rocky/mobile-app/lib/trpc`): `import type { AppRouter } from "@rocky/trpc";`.
- Delete any fake `server.ts` files that are not generated artifacts (they cause the `useContext`/`useUtils`/`Provider` collision error in `createTRPCReact`).
- Remove those fake files from the patch script's `TARGETS` list.

### 5. Verification checklist (run all)

```bash
grep -c "ReturnType<" packages/trpc/src/generated/server.ts    # → 0
grep -c 'from "@rocky/api' packages/trpc/src/generated/server.ts # → 0
cd packages/trpc && pnpm exec tsc --noEmit                          # exit 0 (literal ts6059 test)
cd apps/api && pnpm run build                                   # nest build → 0 issues
cd apps/web && pnpm exec tsc --noEmit                               # exit 0
pnpm turbo run build --dry                                      # graph resolves, no circular dep
grep -n "@rocky/api" packages/trpc/package.json                   # → empty
```

### 6. Other landmines hit on the way (so you don't repeat them)

- **`.strict()` on response schemas:** a systemic bug where response schemas used `.omit({...}).strict()`. `strict()` rejects extra keys and, combined with `{}` client inputs, surfaced as `unrecognized_keys` / `{}` type errors. Fix: response schemas use `.strip()`, request schemas use `.pick()`/`.strictObject()`.
- **`ZodArray` has no `.strip()`:** `z.array(X).strip()` is a type/runtime error. Use `z.array(X)` alone.
- **Stale diagnostics:** the `lens_diagnostics` cache lagged behind the real state. Trust live LSP + actual `tsc`/`nest build` over the cached summary.
- **Formatter race on large edits:** editing an entire router's procedures in one big block frequently failed with "content drift" because the formatter rewrote the file between read and edit. Fix in small 2-line chunks.
- **`createTRPCReact` vs `createTRPCContext`:** web uses the v11 `createTRPCContext<AppRouter>()`; mobile still uses v10 `createTRPCReact<AppRouter>()`. Both work against the same generated `AppRouter` as long as it has no key named `useContext`/`useUtils`/`Provider` (which only happened with the fake `server` file).

### 7. How to avoid the whole trap next time

- **Make `@Output` mandatory in code review.** Every new `@Query`/`@Mutation` must declare `output:`. A procedure without it is a future ts6059 — treat it as a build-blocking lint, not a style nit. (See **P4**.)
- **Never add a backend-package dependency to your transport/types package.** If you're tempted to depend on `@rocky/api` from `@rocky/trpc`, stop — the fix is schemas, not imports.
- **Keep the post-generate patch script to its one legitimate job** (injecting `transformer: superjson` into `initTRPC.create`, which `nestjs-trpc` omits). No import rewriting.
- **Add a CI guard:** a step that fails if the generated file contains `ReturnType<` or `from "@rocky/api"` (or whatever your backend alias is). That catches the regression at PR time instead of at `tsc`.

---

## ✅ Patterns (What TO Do)

### P1: Import Only From Allowed Packages

```typescript
// ✅ CORRECT — routers import only from these packages
import { Injectable } from "@nestjs/common"; // NestJS
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc"; // tRPC decorators
import { TRPCError } from "@trpc/server"; // tRPC errors
import { createResultUnwrapper } from "@rocky/trpc"; // Result unwrapping
import {
  type CreateRideInput,
  createRideInputSchema,
} from "@rocky/validators/api"; // API schemas
import { type Ride, rideSchema } from "@rocky/validators/api"; // API types + schemas
import { RIDE_TRPC_ERROR_MAP } from "@rocky/validators/errors"; // Error maps
import { RidesService } from "@rocky/domains-rides"; // Domain services
import { RequireAdminMiddleware } from "../middlewares"; // Auth middleware
import type { AppContext } from "../"; // tRPC context
```

**Allowed imports:**

- `@rocky/validators/api` — API input/output schemas and types
- `@rocky/validators/enums` — Zod enum schemas
- `@rocky/validators/errors` — TRPC error maps
- `@rocky/domains-*` — domain services (via DI)
- `@rocky/trpc` — `createResultUnwrapper`
- `@rocky/authorization` — `Policy` / `Public` decorators (auth boundary declaration)
- `@rocky/domains-shared` — `TenantContextService`, shared utilities
- `@nestjs/common` — `Injectable`, `Inject`
- `nestjs-trpc` — `@Router`, `@Query`, `@Mutation`, `@Input`, `@Ctx`, `@UseMiddlewares`
- `@trpc/server` — `TRPCError`
- `../middlewares` — local middleware (auth guards)
- `../` — `AppContext` type

### P2: Define the Result Unwrapper Once

```typescript
// ✅ CORRECT — create unwrapper at module level, reuse in all methods
import { createResultUnwrapper } from "@rocky/trpc";
import { RIDE_TRPC_ERROR_MAP } from "@rocky/validators/errors";

const unwrapResult = createResultUnwrapper(RIDE_TRPC_ERROR_MAP);

@Router({ alias: "rides" })
@Injectable()
export class RidesRouter {
  async create(@Input() input: CreateRideInput): Promise<CreateRideOutput> {
    const result = await this._ridesService.create(input);
    return unwrapResult(result); // ← reuse
  }
}
```

### P3: Always Declare Explicit Return Types

```typescript
// ✅ CORRECT — every method has explicit return type
@Query({ output: ridesListOutputSchema })
async listPending(
  @Input() input: DispatchPaginationInput,
  @Ctx() ctx: AppContext,
): Promise<RidesListOutput> {                    // ← EXPLICIT
  const result = await this._ridesService.listPending(input);
  return unwrapResult(result);
}

@Mutation({ input: createRideInputSchema, output: createRideOutputSchema })
async create(
  @Input() input: CreateRideInput,
  @Ctx() ctx: AppContext,
): Promise<CreateRideOutput> {                   // ← EXPLICIT
  const result = await this._ridesService.create(input);
  return unwrapResult(result);
}
```

**Why:** Without explicit return types, `nestjs-trpc` infers the service's return type. If the service returns a DB row with `tenantId`, it leaks to the frontend. The explicit type forces output through the API schema boundary.

### P4: Use `@Input()` and `@Output()` Decorators

```typescript
// ✅ CORRECT — declare input/output schemas in decorators
@Query({
  input: getDriverLocationInputSchema,
  output: driverLocationResponseSchema,
})
async getDriverLocation(
  @Input() input: GetDriverLocationInput,
): Promise<DriverLocationResponse> {
  // ...
}

@Mutation({
  input: createRideInputSchema,
  output: createRideOutputSchema,
})
async create(
  @Input() input: CreateRideInput,
): Promise<CreateRideOutput> {
  // ...
}
```

> **Why `@Output` is mandatory — not optional:** When `output:` is omitted, `nestjs-trpc` infers the return type by importing the backend router class, which leaks backend source into client builds and causes **TS6059**. Every `@Query`/`@Mutation` MUST declare `output:`. This is a build-blocking rule, not a style nit — see **Core Diagnosis: The Missing `@Output()`** above.

### P5: Use `@UseMiddlewares()` for Authorization

> Base authentication is declared with `@Policy` (see **P5b**). `@UseMiddlewares(RequireAdminMiddleware)` layers an *admin* requirement on top of that base gate for admin-only routers (e.g. `webhooks`).

```typescript
// ✅ CORRECT — middleware for auth, not inline checks
@UseMiddlewares(RequireAdminMiddleware)
@Mutation({ input: forceAssignDriverInputSchema, output: forceAssignDriverOutputSchema })
async forceAssignDriver(
  @Input() input: ForceAssignDriverInput,
  @Ctx() ctx: AppContext,
): Promise<ForceAssignDriverOutput> {
  const result = await this._ridesService.forceAssignDriver(input);
  return unwrapResult(result);
}
```

### P5b: Declare `@Policy` (or `@Public`) on Every Router

Every router MUST declare an auth boundary at the class level. The Execution Pipeline's `PolicyResolver` maps the incoming procedure path `<routerAlias>.<method>` to a registered `@Policy`, so the `@Policy` alias MUST equal the `@Router` alias (the procedure path's first segment).

```typescript
// ✅ CORRECT — @Policy alias matches @Router alias, placed ABOVE @Router
import { Policy } from "@rocky/authorization";

@Policy({ alias: "rides", authenticated: true })
@Router({ alias: "rides" })
@Injectable()
export class RidesRouter { /* ... */ }
```

```typescript
// ✅ CORRECT — public inbound router escapes the guard with @Public
import { Public } from "@rocky/authorization";

@Public("magicLink")
@Router({ alias: "magicLink" })
@Injectable()
export class MagicLinkRouter { /* ... */ }
```

**Rules:**

- `@Policy({ alias, authenticated: true })` — authenticates any logged-in principal. The `alias` MUST equal the `@Router` alias.
- `@Public("<key>")` — marks a router as publicly reachable (no principal required). Use ONLY for genuine inbound public endpoints (currently only `magicLink`). Every other router gets `@Policy`.
- **Defer `permission`:** do NOT set `permission` on `@Policy` yet. Permissions are not seeded, so adding one would 403 every call. Granular permission checks are a later seeding task.
- `@UseMiddlewares(RequireAdminMiddleware)` (P5) layers an admin requirement ON TOP of `@Policy` for admin-only routers.

**Why:** Without `@Policy`/`@Public`, `PolicyResolver` cannot resolve the procedure and `PrincipalGuard` rejects it. The decorator is the authoritative, visible declaration of the router's auth boundary — the security-visibility principle the Diamond Seal demands.

### P6: Keep Auth Scaffolding Minimal

```typescript
// ✅ CORRECT — auth scaffolding only, no business logic
@Mutation({ input: deleteUserInputSchema, output: successOutputSchema })
async deleteUser(
  @Input() input: UserIdInput,
  @Ctx() ctx: AppContext,
): Promise<SuccessOutput> {
  // Auth scaffolding — OK
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Everything else → Domain Service
  const result = await this._userService.deleteUser(input.id, ctx.user.id);
  return unwrapResult(result);
}
```

### P7: Use Micro-Routers (≤200 lines each)

```
apps/api/src/
├── hr/
│   ├── shift-templates.router.ts    @Router({ alias: 'hr.shiftTemplates' })
│   ├── time-tracking.router.ts      @Router({ alias: 'hr.timeTracking' })
│   ├── payroll.router.ts            @Router({ alias: 'hr.payroll' })
│   └── hr.module.ts                 (imports all HR sub-routers)
├── telephony/
│   ├── calls.router.ts              @Router({ alias: 'telephony.calls' })
│   ├── sms.router.ts                @Router({ alias: 'telephony.sms' })
│   └── pbx.router.ts                @Router({ alias: 'telephony.pbx' })
└── rides/
    ├── rides.router.ts              @Router({ alias: 'rides' })
    ├── rides-search.router.ts       @Router({ alias: 'rides.search' })
    └── rides-subscriptions.router.ts @Router({ alias: 'rides.subscriptions' })
```

**Rule:** No router file shall exceed **200 lines**. If it does, split into sub-routers.

### P8: Use Standalone Helper Functions for Output Mapping

```typescript
// ✅ CORRECT — helper functions for DB → API output mapping
function mapRideToListItem(ride: EnrichedRide): RideListItem {
  return rideListItemSchema.parse({
    id: ride.id,
    status: ride.status,
    passengerName: ride.passengerName,
    driverName: ride.driverName,
    pickupAddress: ride.pickupAddress,
    createdAt: ride.createdAt,
  });
}

@Query({ output: ridesListOutputSchema })
async listPending(@Input() input: DispatchPaginationInput): Promise<RidesListOutput> {
  const result = await this._ridesService.listPending(input);
  const data = unwrapResult(result);
  return {
    rides: data.rides.map(mapRideToListItem),
    total: data.total,
    page: data.page,
  };
}
```

### P9: Use Dot-Notation Aliases

```typescript
// ✅ CORRECT — dot-notation for micro-router aliases
@Router({ alias: 'hr.shiftTemplates' })
@Injectable()
export class ShiftTemplatesRouter { ... }

@Router({ alias: 'telephony.calls' })
@Injectable()
export class TelephonyCallsRouter { ... }

@Router({ alias: 'mobile.driver' })
@Injectable()
export class MobileDriverRouter { ... }
```

### P10: Handle Not-Found Explicitly

```typescript
// ✅ CORRECT — throw TRPCError for not-found
@Query({ output: rideDetailsSchema })
async getDetails(@Input() input: RideIdInput): Promise<RideDetails> {
  const result = await this._service.getById(input.id);
  const ride = unwrapResult(result);

  if (!ride) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Ride not found' });
  }

  return ride;
}
```

---

## ❌ Anti-Patterns (What NOT To Do)

### 🔴 AP0: NEVER Use Private Methods in Router Classes (CRITICAL BUG)

`nestjs-trpc` uses `MetadataScanner.getAllMethodNames()` to discover router methods. It returns **all** methods, including private ones. For private methods without `@Query`/`@Mutation`/`@Subscription` decorators, the generator returns an empty string `''`. All results are joined with `,
`, creating stray commas:

```typescript
// ❌ BROKEN: Generated server.ts with stray comma
mobileDriver: t.router({
  getEarnings: publicProcedure.input(...).query(async () => "PLACEHOLDER" as any),
,                                    // ← STRAY COMMA — SYNTAX ERROR
})
mobilePassenger: t.router({          // ← Cannot find name!
```

**Root cause in `nestjs-trpc`:**

```javascript
// procedure.generator.js
generateProcedureString(procedure) {
  const decorator = decorators.find(d => d.name === ProcedureType.Mutation || ...);
  if (!decorator) {
    return '';  // ← Returns empty string for private methods!
  }
}

// router.generator.js
return procedures
  .map(this.procedureGenerator.generateProcedureString)
  .join(',\n');  // ← Empty strings create stray commas!
```

**The fix — move ALL helper functions outside the class:**

```typescript
// ❌ BROKEN: Private method causes stray comma
@Router({ alias: "mobileDriver" })
@Injectable()
export class MobileDriverRouter {
  @Query({ output: driverProfileOutputSchema })
  async getProfile(@Ctx() context: AppContext) {
    const driver = await this.driversService.findByUserId(context.user.id);
    return this.mapDriverToOutput(driver); // ← private method!
  }

  private mapDriverToOutput(driver: Driver) {
    // ← STRAY COMMA BUG!
    return { id: driver.id, status: driver.status };
  }
}

// ✅ CORRECT: Standalone function outside the class
function mapDriverToOutput(driver: Driver): DriverOutput {
  return { id: driver.id, status: driver.status };
}

@Router({ alias: "mobileDriver" })
@Injectable()
export class MobileDriverRouter {
  @Query({ output: driverProfileOutputSchema })
  async getProfile(@Ctx() context: AppContext): Promise<DriverOutput> {
    const driver = await this.driversService.findByUserId(context.user.id);
    return mapDriverToOutput(driver); // ← standalone function
  }
}
```

**Also correct — move mappers to a separate `mappers.ts` file:**

```typescript
// rides/mappers.ts
export function mapRideToListItem(ride: Ride): RideListItem { ... }

// rides/rides.router.ts
import { mapRideToListItem } from './mappers';
```

**Verification after fixing:**

```bash
pnpm run dev --filter=@rocky/api  # Wait for startup, then Ctrl+C
grep -n '^\s*,' packages/trpc/src/generated/server.ts  # Should return nothing
```

**Affected files (historically):** `mobile-driver.router.ts`, `mobile-passenger.router.ts`, `rides.router.ts`

**This is a known `nestjs-trpc` bug. Until fixed upstream, the workaround is ZERO private methods in router classes.**

---

### 🔴 AP0b: Unwrapper Must Be Module-Level `const`, Not Class Property

```typescript
// ❌ WRONG — private readonly unwrapper (still a class property)
@Injectable()
export class FinanceRouter {
  private readonly unwrapResult = createResultUnwrapper(FINANCE_TRPC_ERROR_MAP);
}

// ✅ CORRECT — module-level const (outside the class)
const unwrapResult = createResultUnwrapper(FINANCE_TRPC_ERROR_MAP);

@Injectable()
export class FinanceRouter {
  // Use unwrapResult directly — it's a module-level closure
}
```

**Affected files:** `finance.router.ts`, `messages.router.ts`, `comments.router.ts`, `posts.router.ts`

---

### 🔴 AP0c: Every Schema in `exportedSchemas` Must Have a Matching Import (Schema Import Bug)

The `nestjs-trpc` generator uses **actual import statements** in `trpc.module.ts` to determine module paths for the generated client. If a schema is listed in `exportedSchemas` but not imported in `trpc.module.ts`, the generated `server.ts` will have missing imports:

```typescript
// ❌ BROKEN: Schema listed but not imported — TS2304: Cannot find name 'idSchema'
import { createMembershipInputSchema } from "@rocky/validators";

const exportedSchemas = [
  "idSchema", // Listed but not imported!
  "timestampsSchema", // Listed but not imported!
  "zoneBaseSchema", // Listed but not imported!
];
```

**The fix — add explicit imports for ALL schemas:**

```typescript
// ✅ CORRECT: Every exported schema has a matching import
import {
  createMembershipInputSchema,
  idSchema,
  timestampsSchema,
  paginationInputSchema,
  paginationOutputSchema,
} from "@rocky/validators";
import { zoneBaseSchema, zoneSchema } from "@rocky/validators/api/zones.api";

const exportedSchemas = [
  "idSchema", // ← has matching import
  "timestampsSchema", // ← has matching import
  "zoneBaseSchema", // ← has matching import
  "zoneSchema",
];
```

**Common missing schemas:**

| Schema                   | Source Module                    |
| ------------------------ | -------------------------------- |
| `idSchema`               | `@rocky/validators`               |
| `timestampsSchema`       | `@rocky/validators`               |
| `paginationInputSchema`  | `@rocky/validators`               |
| `paginationOutputSchema` | `@rocky/validators`               |
| `zoneBaseSchema`         | `@rocky/validators/api/zones.api` |

**Affected files:** `discord.router.ts`, `users.router.ts` (barrel imports from `@rocky/validators`)

### AP1: Never Import From @rocky/database Directly

```typescript
// ❌ WRONG — routers must NOT import database tables/schemas
import { rides } from "@rocky/database";
import { insertRideSchema } from "@rocky/database/zod/rides";
import { eq } from "drizzle-orm";

// ✅ CORRECT — use domain services for DB access
import { RidesService } from "@rocky/domains-rides";
import { createRideInputSchema } from "@rocky/validators/api";
```

**Panopticon rule:** `LAW1` — Router Ideology

### AP2: Never Import From @rocky/database/zod Directly

```typescript
// ❌ WRONG — routers must NOT import Dumb Zod schemas
import { ridesSelectSchema } from "@rocky/database/zod";

// ✅ CORRECT — use API validators from @rocky/validators/api
import { RideOutput, rideOutputSchema } from "@rocky/validators/api";
```

**Panopticon rule:** `LAW1` — layer ban pattern `@rocky/database/(schemas|zod)/?`

### AP3: Never Import From @rocky/validators/events

```typescript
// ❌ WRONG — routers must NOT import event schemas
import { rideCreatedEvent } from "@rocky/validators/events";

// ✅ CORRECT — events are for internal message bus only
import { CreateRideOutput, createRideOutputSchema } from "@rocky/validators/api";
```

**Why:** Events carry envelope metadata (`eventId`, `timestamp`, `type`) that the frontend must not see.

### AP4: Never Import From @rocky/execution

```typescript
// ❌ WRONG — routers must NOT import queue/event bus
import { EventPublisher } from "@rocky/execution";

// ✅ CORRECT — event publishing is the domain service's job
import { RidesService } from "@rocky/domains-rides";
```

**Panopticon rule:** `LAW4` — Queue Discipline

### AP5: Never Import From @rocky/validators/events

```typescript
// ❌ WRONG — routers must NOT import integration validators
import { telegramWebhookSchema } from "@rocky/validators/events/telegram";

// ✅ CORRECT — integration validation happens at the API boundary
```

### AP6: Never Use Implicit Return Types

```typescript
// ❌ WRONG — no return type declared
@Query()
async getConfig() {
  const result = await this._service.getConfig();
  return createResultUnwrapper(TRPC_ERROR_MAP)(result);
}

// ✅ CORRECT — explicit return type
@Query({ output: abandonedCallConfigOutputSchema })
async getConfig(): Promise<AbandonedCallConfigOutput> {
  const result = await this._service.getConfig();
  return createResultUnwrapper(TRPC_ERROR_MAP)(result);
}
```

**Panopticon rule:** `LAW19B` — Router Unwrapping

### AP7: Never Return Event Types

```typescript
// ❌ WRONG — returning an Event type to the frontend
@Mutation()
async sendMessage(
  @Input() input: SendChatMessageInput,
  @Ctx() ctx: AppContext,
): Promise<ChatMessageEvent> { ... }

// ✅ CORRECT — return an API Output type
@Mutation({ input: sendMessageInputSchema, output: chatMessageOutputSchema })
async sendMessage(
  @Input() input: SendChatMessageInput,
  @Ctx() ctx: AppContext,
): Promise<ChatMessageOutput> { ... }
```

### AP8: Never Access result.data Directly

```typescript
// ❌ WRONG — manual result unwrapping
const result = await this._service.create(input);
if (!result.success) {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
}
return result.data;

// ❌ WRONG — accessing result.data properties
return {
  rideId: result.data.rideId,
  driverId: result.data.driverId,
};

// ✅ CORRECT — use createResultUnwrapper
const result = await this._service.create(input);
return unwrapResult(result);
```

**Panopticon rule:** `LAW19B` — Router Unwrapping

### AP9: Never Put Business Logic in Routers

```typescript
// ❌ WRONG — business logic in router
async deleteUser(@Input() input: UserIdInput, @Ctx() ctx: AppContext) {
  if (input.id === ctx.userId) {                    // Business rule!
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  if (await this._userService.hasActiveRides(input.id)) {  // Business rule!
    throw new TRPCError({ code: 'CONFLICT' });
  }
  // ...
}

// ✅ CORRECT — auth scaffolding only, business logic in domain
async deleteUser(
  @Input() input: UserIdInput,
  @Ctx() ctx: AppContext,
): Promise<SuccessOutput> {
  if (!ctx.user) {                                  // Auth scaffolding — OK
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  const result = await this._userService.deleteUser(input.id, ctx.user.id);
  return unwrapResult(result);
}
```

### AP10: Never Use Hardcoded Enum Strings

```typescript
// ❌ WRONG — hardcoded enum strings
if (ride.status === 'CANCELLED') { ... }
const rides = await this._service.list({ status: 'PENDING' });

// ✅ CORRECT — use branded enum constants
import { RIDE_STATUS } from '@rocky/database/constants/ride-status';
if (ride.status === RIDE_STATUS.CANCELLED) { ... }
```

**Panopticon rule:** `LAW3I` — Hardcoded Enum String Detection

### AP11: Never Use console.log

```typescript
// ❌ WRONG — console.log in router
console.log('Creating ride:', input);

// ✅ CORRECT — use structured logger
private readonly logger = new Logger(RidesRouter.name);
this.logger.log('Creating ride', { rideId });
```

### AP12: Never Access process.env Directly

```typescript
// ❌ WRONG — direct env access in router
const baseUrl = process.env.WEBHOOK_BASE_URL;

// ✅ CORRECT — inject config via constructor or use ConfigService
constructor(@Inject('WEBHOOK_CONFIG') private readonly config: WebhookConfig) {}
```

### AP13: Never Create God Routers (>200 lines)

```typescript
// ❌ WRONG — hr.router.ts with 734 lines handling:
// Training, EmployeeDocuments, Recruitment, DestinationPreferences,
// Scheduling, TimeTracking, Leave, ShiftTemplates, Payroll

// ✅ CORRECT — split into micro-routers
// hr/training.router.ts           — ~120 lines
// hr/employee-documents.router.ts — ~100 lines
// hr/recruitment.router.ts        — ~150 lines
// hr/scheduling.router.ts         — ~130 lines
// hr/payroll.router.ts            — ~110 lines
```

**Panopticon rule:** `LAW5S` — Micro-Router line limit

### AP14: Never Use try/catch for Business Logic

```typescript
// ❌ WRONG — try/catch with business logic in router
async listPending(@Input() input: DispatchPaginationInput, @Ctx() ctx: AppContext) {
  try {
    const result = await this._service.listPending(input);
    if (result.data.length === 0) {
      return { rides: [], total: 0 };
    }
    return unwrapResult(result);
  } catch (error) {
    this.logger.error({ err: error }, 'Error in listPending');
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }
}

// ✅ CORRECT — let the unwrapper handle errors
async listPending(
  @Input() input: DispatchPaginationInput,
): Promise<RidesListOutput> {
  const result = await this._service.listPending(input);
  return unwrapResult(result);
}
```

### AP15: Never Use Deep Domain Imports

```typescript
// ❌ WRONG — deep import into domain internals
import { RidesRepository } from "@rocky/domains-rides/src/rides.repository";

// ✅ CORRECT — import from domain barrel
import { RidesService } from "@rocky/domains-rides";
```

---

### AP16: Never Omit `@Policy` (or `@Public`) on a Router

```typescript
// ❌ WRONG — no auth declaration; PolicyResolver cannot resolve the procedure
@Router({ alias: "rides" })
@Injectable()
export class RidesRouter { /* ... */ }
```

```typescript
// ✅ CORRECT — @Policy above @Router
import { Policy } from "@rocky/authorization";

@Policy({ alias: "rides", authenticated: true })
@Router({ alias: "rides" })
@Injectable()
export class RidesRouter { /* ... */ }
```

**Why:** The Execution Pipeline requires every procedure to resolve to a `@Policy`. An undecorated router is rejected by `PrincipalGuard`.

### AP17: Never Mismatch `@Policy` alias with `@Router` alias

```typescript
// ❌ WRONG — alias mismatch; "<routerAlias>.<method>" won't map to "user.*"
@Policy({ alias: "account", authenticated: true })
@Router({ alias: "user" })
```

```typescript
// ✅ CORRECT — aliases match
@Policy({ alias: "user", authenticated: true })
@Router({ alias: "user" })
```

**Why:** `PolicyResolver` registers `<alias>.*` and resolves by the procedure path's first segment. A mismatch means no policy resolves → request rejected.

### AP18: Never Add `permission` to `@Policy` Before Permissions Are Seeded

```typescript
// ❌ WRONG — permission not yet seeded → 403 on every call
@Policy({ alias: "rides", permission: "rides:read", authenticated: true })
```

```typescript
// ✅ CORRECT — authenticated only, until permissions are seeded
@Policy({ alias: "rides", authenticated: true })
```

**Why:** `PolicyEngine.evaluate` denies when `policy.permission` is set but the principal lacks it. Since the permission catalog is not seeded yet, setting `permission` would lock out all calls. Add `permission` in the later granular-permission seeding task.

### AP19: Never Omit `@Output()` on a `@Query`/`@Mutation`

```typescript
// ❌ WRONG — no @Output(); nestjs-trpc imports the backend router class to infer the return type
@Query({ input: idParam })
async getById(@Input() input: { id: string }) { /* ... */ }
```

```typescript
// ✅ CORRECT — @Output() lets Zod own the type; frontend stays decoupled
@Query({ input: idParam, output: documentResponseSchema })
async getById(@Input() input: { id: string }): Promise<DocumentResponse> { /* ... */ }
```

**Why:** See **Core Diagnosis: The Missing `@Output()`** below. Omitting `@Output()` forces `nestjs-trpc` to import the backend controller class to infer the return type, which leaks backend source into client builds (TS6059) and is what `scripts/patch-trpc-transformer.mjs` exists to paper over.

---

## File Structure Template

```typescript
/**
 * <Entity> Router - tRPC endpoints for <domain> operations
 *
 * Diamond Seal Level 5: Application layer <domain> endpoints
 *
 * Endpoints:
 * Queries:
 * - list: List all <entities>
 * - getById: Get <entity> by ID
 *
 * Mutations:
 * - create: Create a new <entity>
 * - update: Update an existing <entity>
 * - delete: Delete an <entity>
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc';
import { TRPCError } from '@trpc/server';
import { createResultUnwrapper } from '@rocky/trpc';
import {
  type Create<Entity>Input,
  type <Entity>Output,
  type <EntityId>Input,
  create<Entity>InputSchema,
  <entity>OutputSchema,
  <entity>IdInputSchema,
  successOutputSchema,
} from '@rocky/validators/api';
import { <DOMAIN>_TRPC_ERROR_MAP } from '@rocky/validators/errors';
import { <Entity>Service } from '@rocky/domains-<domain>';
import type { AppContext } from '../';
import { RequireAdminMiddleware } from '../middlewares';
import { Policy } from '@rocky/authorization';

const unwrapResult = createResultUnwrapper(<DOMAIN>_TRPC_ERROR_MAP);

// ── Helper Functions ──────────────────────────────────────────────────────
function mapToOutput(db: DbEntity): <Entity>Output {
  return <entity>OutputSchema.parse({
    id: db.id,
    name: db.name,
    // ... map DB fields to API output
  });
}

// ── Router ────────────────────────────────────────────────────────────────
// Every router declares its auth boundary with @Policy (alias MUST match @Router)
@Policy({ alias: '<domain>.<entity>', authenticated: true })
@Router({ alias: '<domain>.<entity>' })
@Injectable()
export class <Entity>Router {
  constructor(
    @Inject(<Entity>Service)
    private readonly _service: <Entity>Service,
  ) {}

  /**
   * List all <entities>
   */
  @Query({ output: <entity>ListOutputSchema })
  async list(@Ctx() ctx: AppContext): Promise<<Entity>ListOutput> {
    const result = await this._service.getAll(ctx.tenantId);
    return unwrapResult(result);
  }

  /**
   * Get <entity> by ID
   */
  @Query({ input: <entity>IdInputSchema, output: <entity>OutputSchema.nullable() })
  async getById(@Input() input: <EntityId>Input): Promise<<Entity>Output | null> {
    const result = await this._service.getById(input.id);
    return unwrapResult(result);
  }

  /**
   * Create a new <entity>
   */
  @UseMiddlewares(RequireAdminMiddleware)
  @Mutation({ input: create<Entity>InputSchema, output: <entity>OutputSchema })
  async create(
    @Input() input: Create<Entity>Input,
    @Ctx() ctx: AppContext,
  ): Promise<<Entity>Output> {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const result = await this._service.create(input, ctx.tenantId);
    return unwrapResult(result);
  }

  /**
   * Delete an <entity>
   */
  @UseMiddlewares(RequireAdminMiddleware)
  @Mutation({ input: <entity>IdInputSchema, output: successOutputSchema })
  async delete(@Input() input: <EntityId>Input): Promise<SuccessOutput> {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const result = await this._service.delete(input.id);
    return unwrapResult(result);
  }
}
```

---

## Quick Reference Card

| Do                                     | Don't                            |
| -------------------------------------- | -------------------------------- |
| Import from `@rocky/validators/api`     | Import from `@rocky/database`     |
| Import from `@rocky/domains-*` services | Import from `@rocky/database/zod` |
| Use `createResultUnwrapper`            | Access `result.data` manually    |
| Declare explicit return types          | Use implicit return types        |
| Use `@Input()`/`@Output()` (output is build-blocking) | Skip `@Output()` (causes TS6059) |
| Use `@UseMiddlewares()` for auth       | Put auth logic inline            |
| Keep ≤200 lines per router             | Create God Routers               |
| Use dot-notation aliases               | Use flat aliases                 |
| Use standalone helper functions        | Put mapping logic inline         |
| Throw `TRPCError` for not-found        | Return `null` without handling   |
| Use branded enums                      | Use hardcoded strings            |
| Use `Logger` | Use `console.log` |
| Declare `@Policy` (or `@Public`) on every router | Omit the auth decorator |

---

## Panopticon Rules Summary

| Rule          | What it Enforces                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LAW1`       | Import boundaries — routers can only import from `@rocky/validators/*`, `@rocky/domains-*`, `@rocky/trpc`, `@rocky/authorization` (Policy/Public), `@nestjs/common`, `nestjs-trpc`, `@trpc/server` |
| `LAW3I`   | No hardcoded enum strings — use branded constants                                                                                                          |
| `LAW5S` | Micro-router line limit — routers ≤200 lines                                                                                                               |
| `LAW19B`   | Router unwrapping — must use `createResultUnwrapper`, no `result.data` access                                                                              |

---

## Router vs Service vs Repository Responsibility Matrix

| Concern           | Router               | Service                       | Repository                  |
| ----------------- | -------------------- | ----------------------------- | --------------------------- |
| Input validation  | `@Input()` decorator | `safeParse()` with API schema | `validate()` with DB schema |
| Auth scaffolding  | ✅ `if (!ctx.user)`  | ❌ No                         | ❌ No                       |
| Business logic    | ❌ No                | ✅ All business logic         | ❌ No                       |
| DB access         | ❌ No                | ❌ No (via repo)              | ✅ Direct (via Drizzle)     |
| Event publishing  | ❌ No                | ✅ Only layer that publishes  | ❌ No                       |
| Result unwrapping | ✅ `unwrapResult()`  | Returns `Result<T, E>`        | Returns `Result<T, E>`      |
| Return types      | API Output types     | `Result<T, ErrorCode>`        | `Result<T, ErrorCode>`      |
| Error mapping     | TRPC_ERROR_MAP       | Domain error codes            | DB error codes              |
| Tenant injection  | From `ctx.tenantId`  | Injects into repo calls       | Uses `withRls()`            |
| File size limit   | ≤200 lines           | ≤500 lines                    | ≤400 lines                  |

---

## The Circuit is Closed

When all routers follow this doctrine, the Diamond Seal circuit is complete:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React Native)                  │
│                    Calls tRPC procedures                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5: ROUTERS (Diplomats)                                   │
│  ✓ Explicit return types (Promise<ApiOutput>)                   │
│  ✓ No Event types returned                                      │
│  ✓ No business logic (auth scaffolding only)                    │
│  ✓ Result unwrapping via createResultUnwrapper                  │
│  ✓ Micro-routers (< 200 lines each)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: VALIDATORS (Border Guards)                            │
│  ✓ .strict() on all schemas                                     │
│  ✓ .omit({ tenantId: true }) on responses                       │
│  ✓ Zod .parse() validates all input/output                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: DOMAIN SERVICES (Government)                          │
│  ✓ Business logic lives here                                    │
│  ✓ Returns Result<T, ErrorCode>                                 │
│  ✓ No knowledge of HTTP, tRPC, or frontend                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: DATABASE (Sovereign Territory)                        │
│  ✓ RLS policies enforce tenant isolation                        │
│  ✓ Drizzle schemas are the SSOT for table structure             │
│  ✓ tenantId column in every table                               │
└─────────────────────────────────────────────────────────────────┘
```

The Database is sealed. The Validators are strict. The Services are pure. The Routers are explicitly typed. **The circuit is closed. The Diamond Seal is complete.**
