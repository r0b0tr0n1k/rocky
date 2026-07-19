# Scout Context — tRPC Frontend Test Suite + Enterprise-grade ISO Dashboard (Rocky)

**Date:** 2026-07-15
**Repo:** `/home/goce/appz/rocky` (pnpm + Turborepo monorepo — livestock traceability "Rocky")
**Scope of this report:** raw material for a planner covering (1) frontend tRPC tests that reuse
factories + AppRouter + validators with ZERO hand-written enums, (2) ISO enterprise-grade hardening
of `apps/web` extending ADR-0105 Waves 0-4.

> **Naming clarification:** user's "formnetd" = the frontend admin app (`apps/web`), "dashborte" = the dashboard (the `(admin)` route group). "plure code" = reuse existing code.

---

## 0. TL;DR for the planner (read first)

1. **Factory base does NOT introspect Zod.** `SchemaDataFactory` only *validates* via `safeParse`; each
   subclass hand-writes its defaults using `faker` + `*_VALUES` constants imported from
   `@rocky/database/constants`. So "no hand-written enums" is satisfied *because the factories import
   the branded constants* — but the enums are **not** derived from the schema at runtime.
   To derive enums *from schema* (the user's literal ask), use the Zod enum's `.options` from
   `@rocky/validators/enums` (97 schemas). See A.4 and C.2.
2. **`appRouter.createCaller()` cannot run real procedure logic.** The generated
   `packages/trpc/src/generated/server.ts` resolvers are literals:
   `.query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)`. So `createCaller` proves **input
   enforcement only** (the existing wire-boundary test pattern). To exercise real resolver logic you
   must instantiate the router *class* with a real/mocked service, or use the Nest testing harness in
   `apps/api`. See B.2 / B.5. **This is the single most important architectural constraint for the plan.**
3. **There is NO Zod-schema to example-value walker** anywhere in the repo. To cover the
   request/response DTOs (router INPUT schemas are subsets/extensions of select schemas) and the
   validator modules that have no factory, the plan must build one (introspect `.shape` + enum
   `.options`). See C.4 / G.
4. **Dashboard ISO state has moved since ADR-0105 was written.** CSP headers (F-02) are now
   **IMPLEMENTED** in `apps/web/next.config.ts`; a cookie-transparency disclosure dialog (F-03) was
   added. `frontend-conformity.md` still lists F-02 as PLANNED — the doc must be updated (and
   `check-standards` will police the SoA status tokens). No skip-link, no i18n, no DSR UI, no E2E yet.
   See D / F.

---

## A) THE FACTORY SYSTEM — `packages/testing/src/factory/`

### A.1 `base.ts` — `SchemaDataFactory<TRecord>` (the "Diamond Seal" base)

Key facts (read the file; do not assume):

- Constructor takes `(schema, defaults)`. `schema` is a *Dumb Zod select schema* from
  `@rocky/database/zod`. It is typed loosely (`any`) and only needs a `safeParse` method.
- `create(overrides?)` merges `defaults -> overrides`, then **validates with `schema.safeParse(merged)`
  and THROWS if invalid**. This is the "Diamond Seal": generated data is guaranteed schema-valid.
- `createMany(count, overrides?)` and `createManyEach(overrides[])` are the batch helpers.
- **It does NOT introspect the schema to produce values.** All values come from the subclass
  constructor's `super(schema, { ...defaults })`. There is no enum enumeration, no field
  discovery, no `faker` auto-fill from schema shape. (Snippet below.)

```
// packages/testing/src/factory/base.ts (abridged)
export abstract class SchemaDataFactory<TRecord> {
  protected readonly schema: { safeParse: (data: unknown) => any };
  protected readonly defaults: Partial<TRecord>;
  constructor(schema: any, defaults: Partial<TRecord> = {}) { this.schema = schema; this.defaults = defaults; }

  create(overrides?: Partial<TRecord>): TRecord {
    const merged = { ...this.defaults, ...overrides };
    const result = this.schema.safeParse(merged);
    if (!result.success) throw new Error(`SchemaDataFactory: ... ${JSON.stringify(merged, null, 2)}`);
    return result.data;
  }
  createMany(count: number, overrides?: Partial<TRecord>): TRecord[] { /* Array.from */ }
  createManyEach(overrides: Array<Partial<TRecord>>): TRecord[] { /* overrides.map(o => this.create(o)) */ }
}
```

### A.2 `type-helpers.ts` — `InferSelectSchema<T>`

Extracts the output type from a drizzle-zod schema by reading `_zod.output` (structurally), falling
back to the return type of `safeParse`. This is the tool used to type each factory's `Record` type
because drizzle-zod's `BuildSchema` doesn't satisfy Zod 4's `ZodType` constraint at compile time.

### A.3 `index.ts` — the factory barrel

`packages/testing/src/factory/index.ts` re-exports **all 54 factories** + their `*Record` types,
grouped into three tiers in comments (Tier 1 = previously-uncovered business domains; Tier 2 =
child/FK tables; Tier 3a = farm-domain reference/business child tables). Importable as the subpath
**`@rocky/testing/factory`** (verified in `packages/testing/package.json` `exports`). Example import
used by `apps/api` tests: `import { UserFactory } from "@rocky/testing/factory";`.

### A.4 How enums are currently sourced (the crux of "no hand-written enums")

Look at `factories/animal.ts` and `factories/inspection.ts` — the enums come from **branded
constants**, not from the schema:

```
// factories/animal.ts
import { ANIMAL_STATUS, ANIMAL_STATUS_VALUES, SEX, SEX_VALUES, STATE_CODE } from "@rocky/database/constants";
export class AnimalFactory extends SchemaDataFactory<AnimalRecord> {
  constructor(currentFarmId: string, motherId?: string, fatherId?: string) {
    super(animalsSelectSchema, {
      stateCode: STATE_CODE.MK,
      sex: faker.helpers.arrayElement(SEX_VALUES),          // <- enum derived from *constant*, not schema
      status: faker.helpers.arrayElement(ANIMAL_STATUS_VALUES),
      ...
    });
  }
  createAlive(o?)   { return this.create({ status: ANIMAL_STATUS.ALIVE, ...o }); }   // convenience state helpers
  createDead(o?)    { return this.create({ status: ANIMAL_STATUS.DEAD, ...o }); }
  // ... createSlaughtered / createImported / createExported / createMissing / createStillborn
}
```

So: **the factory never hardcodes an enum literal string** — it samples `X_VALUES` from
`@rocky/database/constants`. That already satisfies "tests don't hand-write enums." But the
user's literal phrasing "derive all data from the schemas" points at the Zod layer. The canonical
way to do that is to read the **Zod enum `.options`** from `@rocky/validators/enums`
(see C.2): `zodEnum.options[Math.floor(Math.random()*zodEnum.options.length)]`. Either source is
acceptable and both avoid literals — the plan should standardize on one (recommend: prefer the
factory when one exists for the entity; otherwise a schema-walker reading `.options`).

### A.5 Representative factories (state-machine / helper pattern)

- `factories/animal.ts` — `AnimalFactory` with `createAlive/Dead/Slaughtered/Imported/Exported/Missing/Stillborn`.
- `factories/inspection.ts` — `InspectionFactory` with `createScheduled/InProgress/Completed/Cancelled/WithRiskAnalysis/WithForm`.
- `factories/ear-tag-order.ts`, `factories/cattle-passport.ts`, `factories/movement.ts` also follow
  the same "schema + faker + `*_VALUES` + state helpers" shape.

### A.6 Factory <-> router <-> validator COVERAGE MAP

25 routers. Factory availability (a `@rocky/testing` factory exists for the core entity/select schema):

| Router | Validator api module | @rocky/testing factory? | Notes |
| --- | --- | --- | --- |
| animal | animals | YES AnimalFactory | state helpers present |
| archive | archive | YES ArchiveDocumentFactory | |
| audit | audit | YES AuditLogFactory | |
| correction | correction | YES ErrorCorrectionFactory | |
| device | pda-devices | YES PdaDeviceFactory | router->`pda-devices` validator |
| document | document | PARTIAL (CattlePassportFactory for passport docs; no generic document factory) | |
| eartag | eartags | YES (rich: EarTag, EarTagOrder, EarTagType, EarTagAllocation, EarTagReplacement, EarTagTakeover) | |
| farm | farms | YES FarmFactory | |
| farm-book | (farmBook in farms.api) | YES FarmBookFactory | |
| geo | geo (+ diseaseZone) | YES Geofence, AnimalGeofenceEvent | diseaseZone validator has NO factory |
| health | health | YES (rich: Vaccination, LabTest, Treatment, Disease, Vaccine, VaccineBatch, VaccineDisease) | |
| inspection | inspection | YES InspectionFactory, RiskAnalysisFactory | |
| iot | iot | YES IotDeviceFactory, SensorReadingFactory | |
| modules | modules | NO (none) | schema-walker required |
| movement | movements | YES MovementFactory | |
| notification | notifications | YES (rich: Notification, NotificationPreference, NotificationTemplate, NotificationDelivery, EventSubscription, Reminder) | |
| organization | organizations | YES OrganizationFactory, OrgAreaFactory | |
| passport | passport | YES CattlePassportFactory | |
| rbac | rbac | YES Role, Permission, RolePermission, UserRole | |
| subject | subjects | YES Subject, AnimalParent, BirthNotification, FarmSubject | |
| sync | sync | YES SyncErrorFactory | |
| system-parameters | system-parameters | NO (none) | schema-walker required |
| user | users | YES UserFactory, UserSessionFactory | |
| vs-assignment | (vs-assignments) | YES VsAssignmentFactory | |
| vs-contract | (vs-contracts) | YES VsContractFactory | |

**Validator api modules with NO factory at all** (DTO-only / reference; must be covered by a
schema-walker): `ched`, `eudr`, `diseaseZone`, `holdings`, `params`, `registration`
(part of animals registration flow), plus the two router-less gaps above (`modules`, `system-parameters`).
(Total validator api modules = 28; full list in C.1.)

### A.7 How an existing factory test is written (pattern to mirror)

`packages/testing/src/tier1-factory.test.ts` and `packages/testing/src/health-factory.test.ts`:

```
// tier1-factory.test.ts (abridged)
import { describe, expect, it } from "vitest";
import { ErrorCorrectionFactory } from "./factory/factories/error-correction.js";
describe("ErrorCorrectionFactory", () => {
  it("creates a schema-valid correction", () => {
    const record = new ErrorCorrectionFactory().create();   // create() throws if invalid
    expect(record.id).toBeDefined();
    expect(record.detectionSource).toBeDefined();
  });
  it("createPending / createResolved / createEscalated set status", () => {
    const f = new ErrorCorrectionFactory();
    expect(f.createPending().status).toBe("pending");
    expect(f.createResolved().resolvedAt).toBeDefined();
  });
});
```

Pattern: import factory -> `.create()` (asserts schema-valid by construction) -> assert derived fields /
state-helper semantics. **No literals for enums** (status strings like `"pending"` appear only as
assertions of the factory's own helper output, which itself sampled the constant — acceptable, but the
plan can go further and assert against `X_VALUES.includes(record.status)` to be fully non-literal).

---

## B) THE tRPC LAYER

### B.1 Every router & procedure (`apps/api/src/routers/*.router.ts`)

25 router files (3 other `*.router.ts` are tests: `principal-gating.test.ts`, `rbac.router.policy.test.ts`,
`router-contract.test.ts`). Total **181 procedures** (`@Query`+`@Mutation`). Per-router counts:

| Router | Q | M | Router | Q | M |
| --- | --- | --- | --- | --- | --- |
| animal | 3 | 2 | inspection | 3 | 5 |
| archive | 3 | 4 | iot | 3 | 3 |
| audit | 1 | 0 | modules | 1 | 1 |
| correction | 2 | 5 | movement | 5 | 12 |
| device | 2 | 6 | notification | 1 | 4 |
| document | 5 | 2 | organization | 3 | 1 |
| eartag | 9 | 9 | passport | 2 | 5 |
| farm-book | 2 | 2 | rbac | 5 | 3 |
| farm | 2 | 2 | subject | 2 | 4 |
| geo | 14 | 4 | sync | 1 | 1 |
| health | 12 | 9 | system-parameters | 1 | 1 |
| | | | user | 2 | 2 |
| | | | vs-assignment | 4 | 2 |
| | | | vs-contract | 3 | 2 |

**Every procedure signature** uses `@Query({ input, output })` / `@Mutation({ input, output })` and the
input/output schemas are imported from `@rocky/validators/api` (barrel) or `@rocky/validators/enums`.
Example (`apps/api/src/routers/animal.router.ts`):

```
@Router({ alias: "animal" })
@RegisterPolicy("animal")
@Policy({ authenticated: true })
export class AnimalRouter {
  constructor(@Inject(AnimalService) private readonly animalService: AnimalService) {}
  @Query({ input: idParam, output: animalResponseSchema })
  async getById(@Input() input: { id: string }): Promise<AnimalResponse> {
    return unwrap(await this.animalService.getById(input.id));
  }
  @Mutation({ input: createAnimalRequestSchema, output: animalResponseSchema })
  async create(@Input() input: CreateAnimalRequest, @Ctx() ctx: AppContext): Promise<AnimalResponse> {
    return unwrap(await this.animalService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }
}
// input schemas: idParam = z.object({ id: z.uuid() }),
//   createAnimalRequestSchema / animalListRequestSchema / updateAnimalRequestSchema / findAnimalByTagRequestSchema
// output schemas: animalResponseSchema / animalListResponseSchema  (all from @rocky/validators/api)
```

**Convention to preserve:** every router method returns `unwrap(result)` where
`unwrap = createResultUnwrapper(<DOMAIN>_TRPC_ERROR_MAP)` (imported from `@rocky/trpc`), and the
domain error map comes from `@rocky/validators/errors`. Each router also carries a trailing
`SubtypeGuillotine` / `ActivateGuillotines` block (the "NoDrift" type proof) — the plan's new tests
must not alter routers, only drive them.

### B.2 The canonical test pattern — `appRouter.createCaller(...)` (WARNING: input-only)

`packages/trpc/src/e2e/trpc-wire-boundary.test.ts`:

```
import { appRouter } from "../index.js";
const caller = appRouter.createCaller({ headers: new Headers() });
it("rejects a malformed uuid at the wire (animal.getById)", async () => {
  await expect(caller.animal.getById({ id: "not-a-uuid" })).rejects.toThrow(TRPCError);
});
it("rejects an unknown enum value at the wire (movement.recordDeath)", async () => {
  await expect(caller.movement.recordDeath({ animalId: "not-a-uuid", cause: "NOPE" } as any)).rejects.toThrow(TRPCError);
});
```

**CRITICAL:** the `appRouter` is the **generated** router in `packages/trpc/src/generated/server.ts`.
Every resolver body is `async () => "PLACEHOLDER_DO_NOT_REMOVE" as any` (confirmed by reading the
generated file — 880 lines, all procedures resolve to the placeholder string). Therefore:

- `caller.procedure(validInput)` will **pass Zod input validation** (proving the validator rejects bad
  input) but the returned value is the placeholder — **it does NOT run the service**. So this pattern
  can only assert *negative* cases (bad input -> `TRPCError`) and *input acceptance* (no throw), not
  correct business output.
- The wire-boundary test comment itself states: "the real runtime router is assembled internally by
  nestjs-trpc and is never exported."

**Implication for the plan:** to "exercise tRPC procedures" with real logic you have two options:

- **(Preferred, reuses code, no server):** instantiate the router *class* directly with an injected
  service/mock, then call the method:
  `new AnimalRouter(animalService).create(validInput, ctx)`. This runs the REAL resolver
  (`createResultUnwrapper` + service) — but you must supply a service (real, via the Nest test harness,
  or a stub returning a `Result`). The method param decorators (`@Input`, `@Ctx`) are erased at runtime,
  so you call `router.create(input, ctx)` with plain args.
- **(Backend-grade):** reuse the Nest testing module pattern from `apps/api` (see B.5). This is the
  only place real resolvers + RLS + DB run today.

### B.3 Error-map pattern — `createResultUnwrapper`

`packages/trpc/src/e2e/error-map.test.ts` shows `createResultUnwrapper(ANIMAL_TRPC_ERROR_MAP)` mapping
domain `Result<_,E>` errors (`err(new AnimalNotFoundError())` with `.code`) -> `TRPCError` codes
(`NOT_FOUND`, `FORBIDDEN`). Tests the **mapping mechanism**, not the domain classes. The plan's
router-class tests will naturally exercise this when a stubbed service returns `err(...)`.

### B.4 How the frontend (apps/web) calls tRPC today (tests must mirror these)

- `apps/web/lib/trpc.ts` — builds the client via `createTRPCClient<AppRouter>` with `httpBatchLink` /
  `httpSubscriptionLink` / `loggerLink` split, `transformer` from `@rocky/trpc/superjson`, and the
  **new TanStack React Query integration**: `createTRPCContext<AppRouter>()` produces
  `{ TRPCProvider, useTRPC, useTRPCClient }`.
- `apps/web/components/trpc-provider.tsx` — wraps children in `QueryClientProvider` + `TRPCProvider`.
- Call sites use `useQuery(trpc.x.queryOptions(input))` and `useMutation(trpc.x.mutationOptions(opts))`.
  Pages that call tRPC (sample, confirmed via grep): `animals`, `inspections`, `inspections/risk-board`,
  `devices`, `ear-tags`, `farm-books`, `iot`, `subjects`, `rbac`, `passports`, `vs-assignments`,
  `vs-contracts`, `users`, `system-parameters`, `sync`, `movement-lineage`, `organizations`,
  `documents`, `verify` (uses `document.verify`), plus `archive`, `corrections`, `health`, `notifications`, `geo`, `audit`, `farm` list/detail pages.
- The browser never talks to the API directly — Next.js rewrites (`/trpc/*` -> `API_URL/trpc/*`,
  `/api/auth/*` -> `API_URL/api/auth/*`) in `next.config.ts`. So a "frontend tRPC test" is really a test
  of the **AppRouter contract** (input/output schemas + error mapping), identical to `createCaller`.

### B.5 The real-router test path (apps/api) — for reference / reuse

- `apps/api/src/routers/router-contract.test.ts` — dynamically imports every `*.router.ts`, asserts
  `@RegisterPolicy` alias == `@Router` alias, every procedure declares `output:`, every `@Policy({action})`
  is in `ALL_PERMISSIONS` (from `@rocky/validators/rbac`). **This is the template for "all routers" tests.**
- `apps/api/src/routers/principal-gating.test.ts` — demonstrates the **factory -> Principal -> gating**
  pattern: `new UserFactory().createSuperAdmin()` -> `Principal.create({ roles:[admin.role], ... })`
  -> `principal.isAdmin()`. Imports `@rocky/testing/factory`.
- `apps/api/src/routers/rbac.router.policy.test.ts` — policy enforcement test.
- `apps/api/vitest.config.ts` — `include: ["src/**/*.test.ts"]`, `environment: "node"`.

---

## C) THE VALIDATORS — `packages/validators/`

### C.1 Module layout (`packages/validators/src/`)

```
api/        <- 28 *.api.ts modules, 366 Zod schemas (input + output + request/response DTOs)
enums/      <- domain.ts (97 Zod enum schemas) + index.ts
errors/     <- per-domain TRPC error maps (e.g. ANIMAL_TRPC_ERROR_MAP)
events/     <- event blueprint schemas
pii/        <- PII classification helpers
compliance/ <- gdpr-articles.ts (VALIDATED_CROSSWALK), lpdp, etc.
utils/      <- type-bridge (NoDrift/SubtypeGuillotine), check-digit
_enum-helper.ts  <- zEnum() branded-enum forge
index.ts    <- barrel: api + errors + events + utils + pii + compliance
```

**`api/` modules (28):** animals, archive, audit, ched, correction, diseaseZone, document, eartags,
eudr, farms, geo, health, holdings, inspection, iot, modules, movements, notifications, organizations,
params, passport, pda-devices, rbac, registration, subjects, sync, system-parameters, users.
(All re-exported from `packages/validators/src/api/index.ts`.)

**Schema count:** **366** `export const ...Schema` across `api/` (input + output + request/response).
`enums/domain.ts` holds **97** enum schemas. Total enumerated validator surface ~= 463 schemas.

### C.2 Where enums live (derive, don't hardcode)

All domain enums are in `packages/validators/src/enums/domain.ts`, each generated as:

```
export const animalStatusSchema = zEnum(ANIMAL_STATUS_VALUES);  // zEnum = z.enum([...values])
export type animalStatusType = z.infer<typeof animalStatusSchema>;
```

`zEnum` (from `_enum-helper.ts`) wraps `z.enum([...values])`, so each schema is a standard Zod 4 enum.
**To derive a valid value at runtime, read `schema.options`** (Zod 4 enum exposes its value tuple as
`.options`). The `*_VALUES` constants originate in `@rocky/database/constants` (branded via
`createEnumValues`), imported both by the enums module and by the factories (A.4). Either source
yields the same list with **no hand-written literals**.

### C.3 Errors / error maps

`@rocky/validators/errors` exports per-domain `*_TRPC_ERROR_MAP` objects consumed by
`createResultUnwrapper` (from `@rocky/trpc`). The wire/router tests should assert that a stubbed
service `err(new XError())` (carrying `.code`) maps to the expected `TRPCError` code.

### C.4 No schema-walker utility exists (gap -> plan must build it)

There is **no** helper that turns a Zod schema into example/valid data
(grep for `.options`-based generators, `zodToJsonSchema`, `getEnumValues`, `genFromSchema`,
`buildJsonSchema` returned nothing useful). The factory base intentionally does *not* walk schemas.
**For "test ALL fields, ALL validators" with no hand-written variables, the plan needs a small
schema-walker** that, given a procedure's input `ZodType`:

- reads `.shape` (for `ZodObject`) to enumerate fields + requiredness,
- for `ZodEnum`/`ZodUnion` picks a value from `.options` (covers the "no hand-written enums" rule),
- for `z.uuid()` -> `crypto.randomUUID()`, `z.string()` -> faker word, `z.number()` -> faker int,
  `z.date()`/`z.coerce.date` -> `new Date()`, `z.boolean()` -> `true`, optional/nullable -> include + omit variants.
This walker + the 54 existing factories together cover 100% of procedures (factories for entities,
walker for DTO-only modules with no factory: `modules`, `system-parameters`, `ched`, `eudr`,
`diseaseZone`, `holdings`, `params`, `registration`).

---

## D) THE DASHBOARD PAGES — `apps/web/app/`

### D.1 Routes inventory

- **Auth (no admin shell):** `app/auth/[...path]/page.tsx` — uses `@better-auth-ui` `SignIn/SignUp/
  SignOut/ForgotPassword/ResetPassword` (catch-all over `viewPaths.auth`).
- **`(admin)` route group (50 pages)** rendered inside `AdminShell` (`app/(admin)/layout.tsx` ->
  `#components/admin-shell`):
  animals (+`[id]/edit`, `new`), archive (+`[id]/edit`, `new`), audit, corrections, dashboard,
  devices (+`[id]/edit`, `new`), documents, ear-tags, farm-books, farms (+`[id]/edit`, `new`),
  feature-flags, geo, health, inspections (+`[id]/edit`, `new`, `risk-board`), iot, movements
  (+`[id]/edit`, `new`), movement-lineage, notifications, organizations (+`new`), passports, rbac,
  subjects (+`[id]/edit`, `new`), sync, system-parameters, users (+`[id]/edit`, `new`), verify,
  vs-assignments, vs-contracts.
- **Root:** `app/layout.tsx` (providers + `<html lang="en">`), `app/page.tsx`, `app/error.tsx`,
  `app/loading.tsx`, `app/not-found.tsx`, `app/globals.css`.

### D.2 tRPC usage per page (representative)

Pages are React Server Components but data is fetched via the client tRPC (`useQuery`/`useMutation` in
client child components under `apps/web/components/**`). Confirmed tRPC-calling pages include:
animals, inspections, inspections/risk-board, devices, ear-tags, farm-books, iot, subjects, rbac,
passports, vs-assignments, vs-contracts, users, system-parameters, sync, movement-lineage,
organizations, documents, verify, archive, corrections, health, notifications, geo, audit, farm.
**The new tRPC tests should mirror these exact procedure calls** (e.g., `trpc.animal.list.queryOptions()`,
`trpc.inspection.create.mutationOptions(...)`) — i.e., the same `AppRouter` surface the pages consume.

### D.3 ISO gaps vs ADR-0105 / frontend-conformity.md F-01..F-15

Verified by reading `app/layout.tsx`, `app/(admin)/layout.tsx`, `components/admin-shell.tsx`,
`app/auth/[...path]/page.tsx`, `next.config.ts`:

| Control | Status (doc) | Actual code state | Gap / action |
| --- | --- | --- | --- |
| F-01 | RBAC gating | IMPLEMENTED | `lib/permissions.tsx` `usePermissions`/`useCan`; nav filtered by `filterNavByPermissions(navSections, permissions)`; used on users/sys-params/rbac/ear-tags/risk-board | Maintain. Good. |
| F-02 | CSP / security headers | PLANNED (doc) — actually IMPLEMENTED | `next.config.ts` `headers()` sets `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`. CSP allows `'unsafe-inline'/'unsafe-eval'` (Turbopack HMR) — flagged for hardening (nonce). | Update doc F-02 -> IMPLEMENTED (note HMR caveat). |
| F-03 | Cookie/consent | EXEMPT | `AdminShell` has a "Cookie & Tracking Notice" dialog (honest disclosure: only necessary session cookie, ePrivacy/GDPR Art 6(1)(e) exemption). No consent banner. | Maintain. |
| F-04 | DSR / erasure / access UI | PLANNED | Absent. `rocky-dsr-procedure.md` exists but is **unwired**. | Build UI + wire to procedure. |
| F-05 | Privacy notice + data-minimization | PARTIAL | Notice text exists (cookie dialog, verify page); no form-level minimization cues. | Add minimization hints in forms. |
| F-06 | Semantic landmarks + skip-link | PLANNED | `AdminShell` renders `<main>` (line 165) and `Sidebar` (nav). NO skip-link anywhere. Sign-in page (`@better-auth-ui`) has no `<main>`/skip-link (verified gap from ADR-0105). | Add skip-link app-wide; ensure auth pages have landmarks. |
| F-07 | Contrast / keyboard / focus order | PLANNED | Not audited. shadcn components are generally accessible but unverified. | Browser-harness a11y audit (per ADR-0105 Verification). |
| F-08 | i18n MK<->EN | PLANNED | `<html lang="en">` hardcoded in `app/layout.tsx`; no locale switching, no MK translations in UI. | Implement i18n + MK LPDP locale. |
| F-09 | E2E + component testing | PARTIAL | Only vitest unit. `apps/web/vitest.config.ts` includes **`lib/**/*.test.ts` only** (no `app/**`); only `lib/permissions-core.test.ts` exists. No Playwright. | Add Playwright; broaden vitest include or add app tests. |
| F-10 | Quality KPIs (SQuaRE 25010/25023) | PLANNED | None. | Define KPIs. |
| F-11 | UI audit-action logging | PLANNED | None from client. | Wire UI actions to audit log. |
| F-12 | PII-free telemetry | PLANNED | None enforced. | Telemetry policy. |
| F-13 | Session timeout / step-up re-auth | PLANNED | None in UI. | Add. |
| F-14 | Frontend SCA / dep scanning | PLANNED | None. | Add to CI. |
| F-15 | PII-safe error boundaries | PLANNED | `app/error.tsx` exists but PII-leak safety not enforced. | Harden error boundary. |

**Net:** the dashboard is *functionally rich* (50 admin pages, full RBAC gating, CSP now on) but the
ergonomics/localization/GDPR-operational/E2E/hardening layers (Waves 2-4) are essentially greenfield.
This matches the user's "hasn't changed much beyond CSP + cookie disclosure + posture papers."

---

## E) TEST INFRASTRUCTURE

### E.1 How tests run

- **Root scripts (`package.json`):**
  - `"test": "turbo run test"` — runs every workspace's `test` (vitest) in the Turborepo graph.
  - `"ci:checks": "pnpm generate:trpc && pnpm check:trpc-boundary && pnpm check:adrs && pnpm check:md-links && pnpm check:standards && pnpm check:agents && pnpm check:pdfa && pnpm check:web-parity && pnpm test"`.
  - `"check:standards": "node scripts/check-standards.mjs"`.
- **vitest configs (workspace):**
  - `packages/trpc/vitest.config.ts` -> `include: ["src/**/*.test.ts"]`, `environment: "node"`, plugin `vite-tsconfig-paths`. **Home of the existing `src/e2e/{trpc-wire-boundary,error-map}.test.ts`.**
  - `packages/testing/vitest.config.ts` -> `include: ["src/**/*.test.ts"]`, `setupFiles: ["./src/setup.ts"]`. Deps: `@rocky/database`, `@rocky/validators`, `@faker-js/faker`. **Does NOT currently depend on `@rocky/trpc`.**
  - `apps/web/vitest.config.ts` -> `include: ["lib/**/*.test.ts"]` (NOT `app/**`), node env. (Only `lib/permissions-core.test.ts` today.)
  - `apps/api/vitest.config.ts` -> `include: ["src/**/*.test.ts"]`, node env.
- **Where the new tRPC frontend tests should live (recommendation):**
  - **Primary:** extend `packages/trpc/src/e2e/` (it already owns `appRouter` + the wire-boundary
    pattern). Add `@rocky/testing` and `@rocky/database` as `devDependencies` to `packages/trpc` so the
    tests can import `@rocky/testing/factory` + walk `@rocky/database/zod` select schemas. This keeps
    `pnpm ci:checks` -> `pnpm test` coverage automatic.
  - **Alternative:** a new suite under `packages/testing/src/` (already has factories + setup) that
    imports `@rocky/trpc` (`appRouter`) — would require adding `@rocky/trpc` as a dep there.
  - **For real-resolver execution** (not just wire): place under `apps/api` reusing the Nest test
    harness (`router-contract`/`principal-gating` pattern) — but that is backend-scoped, not "frontend."

### E.2 `check-standards.mjs` guardian (must respect when updating docs)

Enforces four invariants on the compliance/standards layer (`scripts/check-standards.mjs`, zero-dep,
gates `ci:checks`):

1. **(a) Governing-ADR back-link** — posture papers under `apps/docs/content/compliance/` (incl.
   `frontend-conformity.md` = ROCKY-FE-001) AND `iso-software-engineering-standards-map.md` must link to
   >=1 governing ADR (relative `../ADR/00NN-*` or text `ADR-NNNN`).
2. **(b) Single SoA status per control row** — every `| A.` row in `isms-policy.md` must contain
   **exactly one** of `IMPLEMENTED`/`PARTIAL`/`PLANNED` (bolded). Multiple or zero = violation.
3. **(c) Crosswalk cites `VALIDATED_CROSSWALK`** from `packages/validators/src/compliance/gdpr-articles.ts`.
4. **(d) ISO controlled language** — authored posture papers + standards map must not use the word
   "must" (case-insensitive, word-boundary) outside fenced/inline code; use shall/should/may/can.

**Consequence for the plan:** when you flip F-02 PLANNED->IMPLEMENTED (and any other Wave-0 lands),
keep exactly one status token per row and keep "shall/should/may/can" wording, or `pnpm check:standards`
fails CI.

---

## F) ISO CONFORMANCE CONTEXT (read, don't reinvent)

### F.1 ADR-0105 — Frontend Conformity & UX Controls (accepted 2026-07-15)

Governing decision for the frontend program. Key decisions:

- **Wave 0 — Security baseline:** CSP + `X-Frame-Options`/`HSTS`/`X-Content-Type-Options`/`Referrer-Policy`/`Permissions-Policy` in `next.config.ts` (A.8.23/.26/.28, ISO 27034, GDPR 32). **DONE** (see D.3 F-02) — but not yet reflected in `frontend-conformity.md`.
- **Wave 1 — GDPR operational UI:** consent/cookie banner (wired to `rocky-cookie-notice.md`), DSR/erasure/access UI (wired to `rocky-dsr-procedure.md` ROCKY-DSR-001 + `rocky-erasure-retention-procedure.md` ROCKY-ERP-001), privacy-notice + data-minimization cues (Arts 12-14, 25).
- **Wave 2 — Ergonomics & localization:** WCAG 2.1 AA (landmarks, skip-link, focus order, >=4.5:1 contrast, keyboard, aria), i18n MK<->EN (GDPR 12(1), MK LPDP).
- **Wave 3 — Quality & assurance:** Playwright E2E + component tests (ISO 29119, A.8.28/.29), SQuaRE 25010 KPIs + 25023 measurement, PII-free telemetry + UI audit-action logging (A.5.28, A.8.15/.16).
- **Wave 4 — Hardening:** session timeout / step-up re-auth (A.5.16/.18), frontend SCA/dep scanning (A.8.28, ISO 27034), PII-safe error boundaries.
- **Definition of Done (browser-verified):** exactly one `<main>`, a `<nav>`, skip-link first-focusable,
  `inputsNoLabel === 0`, `btnsNoName === 0`, heading order starts H1, contrast >=4.5:1, full keyboard path.

### F.2 `frontend-conformity.md` control table (F-01..F-15) — current doc state

| # | Obligation | Status (doc) | Wave |
| --- | --- | --- | --- |
| F-01 | UI RBAC gating | IMPLEMENTED | - |
| F-02 | CSP / security headers | PLANNED | 0 |
| F-03 | Cookie/consent mgmt | EXEMPT | 1 |
| F-04 | DSR/erasure/access UI | PLANNED | 1 |
| F-05 | Privacy notice + minimization | PARTIAL | 1 |
| F-06 | Landmarks + skip-link | PLANNED | 2 |
| F-07 | Contrast/keyboard/focus | PLANNED | 2 |
| F-08 | i18n MK<->EN | PLANNED | 2 |
| F-09 | E2E + component tests | PARTIAL | 3 |
| F-10 | Quality KPIs (25010/25023) | PLANNED | 3 |
| F-11 | UI audit-action logging | PLANNED | 3 |
| F-12 | PII-free telemetry | PLANNED | 3 |
| F-13 | Session timeout/step-up | PLANNED | 4 |
| F-14 | Frontend SCA/dep scan | PLANNED | 4 |
| F-15 | PII-safe error boundaries | PLANNED | 4 |

### F.3 "Become enterprise-grade" extension (build on, don't duplicate)

The user wants the dashboard to evolve from "admin CRUD shell" into "serious enterprise software."
Extend the Waves rather than rewrite them:

- **Wave 0.5 (post-CSP hardening):** replace `'unsafe-eval'`/static CSP with per-request nonce; add a
  security.txt / compliance footer; CSP violation reporting endpoint.
- **Wave 1+:** actually wire DSR/erasure UI (F-04) + consent record + audit of consent; add a
  "My Data / data-subject portal" (access request export, erasure request) — the biggest legal gap.
- **Wave 2+:** skip-link (F-06) + full a11y pass with the browser harness; i18n with MK as default
  locale (F-08) — MK LPDP transparency is a legal obligation, not a nicety.
- **Wave 3+:** Playwright E2E covering every `(admin)` page + the tRPC contract suite from B (treat
  the 181-procedure wire suite as the regression gate); SQuaRE KPI dashboard; PII-free telemetry.
- **Wave 4+:** step-up re-auth for `sm:sysparams:write` / user/rbac mutations; `pnpm` SCA in CI; PII-safe
  error boundary + centralized error reporting.
- **Governance:** each landed Wave updates `frontend-conformity.md` row status (single token!) + adds an
  evidence link to `isms-policy.md`; RobotFarm pass updates ADR-0105 Related list. Sub-ADRs 0106+ may
  spawn for consent/DSR/i18n/a11y.

---

## G) GAPS / RISKS (consolidated for the planner)

1. **`appRouter.createCaller` is input-only** (placeholders). Decide explicitly: wire-boundary
   (negative + input-acceptance) tests vs real-resolver tests (router-class instantiation / Nest
   harness). The user's "exercise procedures... consume validators via tRPC" maps best to a **hybrid**:
   (a) `createCaller` input-acceptance + negative for all 181 procedures (proves every validator/field
   at the wire, zero literals), and (b) a representative subset driven through the real router class
   with stubbed services to prove `createResultUnwrapper` + business output.
2. **No Zod schema-walker** exists -> must be built for full field/validator coverage and for the 8
   validator modules / 2 routers without a factory (`modules`, `system-parameters`, `ched`, `eudr`,
   `diseaseZone`, `holdings`, `params`, `registration`).
3. **Enum derivation source ambiguity** -> standardize: prefer the `@rocky/testing` factory when one
   exists for the entity; otherwise a walker reading Zod enum `.options` (or the `*_VALUES` constant).
   Both avoid hand-written literals; document the rule so reviewers can verify "no literals."
4. **`check-standards` will police doc edits** -> any F-status flip in `frontend-conformity.md` must keep
   exactly one status token + controlled language, else `ci:checks` fails.
5. **Dashboard ergonomics gaps are real & measurable:** no skip-link, hardcoded `lang="en"`, no i18n,
   no DSR UI, no E2E. The browser-harness DoD in ADR-0105 is the acceptance gate.
6. **`apps/web` vitest include is `lib/**` only** -> page-level/E2E tests need either a config change or
   a new location (recommend keeping tRPC contract tests in `packages/trpc/src/e2e/` and Playwright E2E
   in `apps/web/e2e/`).
7. **`@rocky/trpc` lacks `@rocky/testing` + `@rocky/database` deps** -> adding the factory-driven tRPC
   suite under `packages/trpc/src/e2e/` requires those two `devDependencies` (or place the suite under
   `packages/testing` with `@rocky/trpc` added there).
8. **Select schemas vs request schemas mismatch** -> router INPUT schemas are often subsets/extensions of
   the Drizzle select schema (e.g., `createAnimalRequestSchema` != `animalsSelectSchema`). The walker must
   target the **input** schema specifically (imported from `@rocky/validators/api`), not the factory's
   select shape, to assert "every field of the request validator."

---

## H) Key file/export reference (for implementation)

- Factory base: `packages/testing/src/factory/base.ts` (`SchemaDataFactory`), `type-helpers.ts`, `index.ts`
- Factories (54): `packages/testing/src/factory/factories/*.ts`; barrel `@rocky/testing/factory`
- Example factory tests: `packages/testing/src/tier1-factory.test.ts`, `health-factory.test.ts`,
  `organization-factory.test.ts`, `subject-factory.test.ts`, `user-factory.test.ts`
- AppRouter + createCaller: `packages/trpc/src/index.ts` (`appRouter`, `createResultUnwrapper`),
  `packages/trpc/src/generated/server.ts` (PLACEHOLDER resolvers), `packages/trpc/src/e2e/{trpc-wire-boundary,error-map}.test.ts`
- Routers: `apps/api/src/routers/*.router.ts` (25 routers, 181 procedures; 3 are `*.test.ts`)
- Validators: `packages/validators/src/api/*` (28 modules, 366 schemas), `enums/domain.ts` (97 enums),
  `errors/*` (`*_TRPC_ERROR_MAP`), `index.ts` barrel
- Web tRPC client: `apps/web/lib/trpc.ts`, `apps/web/components/trpc-provider.tsx`
- Web dashboard: `apps/web/app/(admin)/*` (50 pages), `apps/web/components/admin-shell.tsx`,
  `apps/web/app/auth/[...path]/page.tsx`, `apps/web/next.config.ts` (CSP), `apps/web/app/layout.tsx`
- RBAC in UI: `apps/web/lib/permissions.tsx` (`usePermissions`/`useCan`), `apps/web/lib/nav-config.ts`
- ISO docs: `apps/docs/content/ADR/0105-frontend-conformity-and-ux-controls.md`,
  `apps/docs/content/compliance/frontend-conformity.md` (F-01..F-15), `isms-policy.md`
- Guardians: `scripts/check-standards.mjs`; root `package.json` (`test`, `ci:checks`)
- vitest configs: `packages/trpc`, `packages/testing`, `apps/web`, `apps/api`
