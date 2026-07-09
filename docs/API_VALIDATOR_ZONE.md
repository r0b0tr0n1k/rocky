# API Validator Zone — The Canonical Gate

> **Source of Truth:** This zone doc is the ownership/laws contract for `packages/validators/src/api/`.
> It is adapted from the canonical "Diamond Seal" api-zone writeup, corrected to Rocky's real
> conventions (verified against the live code and `tsc`). The step-by-step *how-to* lives in
> `docs/VALIDATOR_DESIGN_GUIDE.md`; the ratified decisions are **ADR 0011** (layer boundaries)
> and **ADR 0018** (API validator schema design). Enforcement is `tsc --noEmit`, not a Panopticon CLI
> (no such tool exists in this repository).

## Purpose

API input/output schemas — the **Constitutional border** between the outside world and domain logic.
Every tRPC input and every response shape passes through here. Schemas derive from Drizzle-Zod
("Dumb Zod") and are sculpted with `.pick()/.omit()/.extend()/.partial()` + `.strict()`. Every file
ends with an `ActivateGuillotines` guillotine that turns schema/interface drift into a `tsc` error.

## Ownership

**L1 — Diamond Seal, API perimeter.** The Validation Bot owns this zone (`packages/validators/AGENTS.md`).

## Strict Laws

### LAW 1: Derive from Drizzle-Zod

- Base schemas come from `@rocky/database/zod` (`*SelectSchema` / `*InsertSchema`).
- `.omit({ createdBy: true, validTo: true })` on ALL response schemas (strip audit columns).
- `.pick({...})` to select client-settable fields on create inputs; `.extend({...})` to narrow/coerce.
- NEVER hand-write a full schema when a DB table exists. Exceptions: query params, multi-table
  shapes, geo/non-DB fields — these are hand-built `z.strictObject({...})`.
- Response: `*SelectSchema.omit({ createdBy: true, validTo: true }).extend({ enums }).strict()`
- Create input: `*InsertSchema.pick({...}).extend({...}).strict()` (prefer `.pick()` over `.omit()`)
- Update input: hand-built `z.strictObject({...})` with all fields `.optional()` + "at least one" refine

### LAW 2: `.strict()` Is the Target

- `.strict()` rejects unknown keys — this is the Constitutional border.
- Reality: `.strip()` is currently dominant in this codebase (transitional). Migrate to `.strict()`
  as files are touched (see ADR 0018 roadmap). Both `z.strictObject({...})` and
  `z.object({...}).strict()` are acceptable Zod 4 idioms.

### LAW 3: No Vendor, Event, or Cross-Domain Imports

- Import from: `@rocky/database/zod`, `../enums/index.js`, `zod`, `../utils/type-bridge.js`,
  `../utils/check-digit.js`.
- NEVER import from `events/`, `domains-*`, `@rocky/database` directly (use the `/zod` subpath),
  or other `api/` domains.

### LAW 4: Responses Strip Audit Columns

- `createdBy` / `validTo` NEVER leave the boundary. They are stripped via `.omit()`.
- Multi-tenancy is enforced by RLS/execution context, not by a `tenantId` column on these tables,
  so the rule is: no audit column in responses.

### LAW 5: No Enum Atoms

- Import enum schemas from `../enums/index.js` — the public barrel of branded `*Schema` validators
  and curated dictionaries (generated from DB constants).
- NEVER import from `../enums/domain.js`. `domain.ts` is the **private** auto-generated implementation
  (built by `scripts/regenerate-enums.mjs`); binding api files to it couples your contract to generator
  internals and invites hand-built `z.enum([...])` drift. The barrel hides the raw `*_VALUES` so only
  the finished schema is reachable.
- For a runtime string union (a switch / options list), import the `CONSTANT` from
  `@rocky/database/constants` — never hand-write `z.enum([...])`.
- NEVER define a `z.enum([...])` inline or re-declare Dictionary/VALUES here.

### LAW 6: `satisfies z.ZodType<T>` — With a Hard Constraint

- `satisfies z.ZodType<Interface>` is mandatory **for schemas that have a hand-written interface**
  (request schemas, hand-built payloads, event payloads).
- **Illegal pattern:** `satisfies z.ZodType<z.infer<typeof schema>>` is a circular reference
  (TS2456) — `z.infer`-derived response schemas therefore do NOT carry `satisfies`. Their guillotine
  alias is the tautological `NoDrift<z.infer<typeof schema>, X>` (= `true`).
- `as z.ZodType<T>` is reserved for the vendor boundary (future) and Zod 4 branded internals
  (`z.int()`, `z.coerce.date()`) where `satisfies` conflicts — never as a shortcut for drift.

### LAW 7: NoDrift Guillotine on Every Schema

- Every schema gets a `_drift_*` alias (`NoDrift` for responses/hand-built/events; `NoDriftSimple`
  for Drizzle-derived request schemas).
- Curated **subset** response interfaces (interface intentionally narrower than the schema output,
  e.g. `CorrectionResponse`, `PassportResponse`) cannot use `NoDrift` (bidirectional `AssertEqual`
  rejects the subset) — use the sanctioned last-resort: `type _drift_X = true;` (removes coverage;
  the one-directional `satisfies` still enforces the contract).
- Every file ends with `export type _<Domain>Guillotines = ActivateGuillotines<[...]>`. Without
  this export, the lazy type aliases are never evaluated and drift stays hidden.

### LAW 8: Interface-First Where Hand-Written

- Define the TypeScript `interface` BEFORE the `satisfies` schema for request/hand-built shapes.
- The interface is the canonical contract; the schema must match it.
- Exception: Drizzle-Zod derived response schemas use `export type X = z.infer<typeof schema>`
  (the SelectSchema's inferred shape is the de-facto interface).

### LAW 9: Zod 4 Primitives Only

- `z.int()` — never `z.number().int()`
- `z.uuid()` — never `z.string().uuid()`
- `z.coerce.date()` — for date strings from clients/DB
- `z.email()` — never `z.string().email()`
- `.prefault()` — preferred over `.default()` when the default needs parsing
- `.nonnegative()` / `.positive()` — semantic constraints
- `z.record(key, value)` — NEVER single-argument `z.record(value)`

### LAW 10: Import Allowlist

Every `api/[domain].api.ts` must import from:

- `@rocky/database/zod` — `*SelectSchema` / `*InsertSchema`
- `../enums/index.js` — the public barrel: enum schemas + curated dictionaries (never `domain.js`)
- `zod` — `z.strictObject()`, `z.uuid()`, `z.int()`, `z.coerce.date()`, etc.
- `../utils/type-bridge.js` — `NoDrift`, `NoDriftSimple`, `ActivateGuillotines`
- `../utils/check-digit.js` — `earTagSchema`, `farmIdSchema`, etc.

NEVER import from:

- `@rocky/database` directly (use the `/zod` subpath)
- `@rocky/validators/api` (no cross-domain API imports)
- `@rocky/validators/events` (no event imports in API files)
- `@rocky/domains-*` (services consume schemas, never the reverse)

## Work Guidance

- Define the interface BEFORE the schema (LAW 8) for hand-built/request shapes.
- Derive, don't redefine: sculpt the Dumb Zod; never retype a DB field by hand.
- `.pick()` over `.omit()` on create inputs — a new DB column leaks through `.omit()`, but stays
  hidden under `.pick()`.
- Place all `_drift_*` aliases + the `ActivateGuillotines` export at the bottom of the file.

## Consumer Topology — Who Consumes These Validators

The `api/[domain].api.ts` schemas are the **single contract** for every external caller. The
validators package is a **vertical waterfall**, not a horizontal utility: each consumer sits at a
fixed layer and sees only the shadow of the layer above it. Horizontal bleeding of types is forbidden.

- **`apps/api` tRPC routers** — the primary consumer. Every router imports `*Schema` from
  `@rocky/validators/api/<domain>` and uses it as the input/response type via `satisfies`. The schema
  *is* the tRPC procedure contract (see `apps/api/src/trpc/trpc.module.ts`, which barrel-imports all
  api schemas for codegen).
- **Frontends (`apps/web`, `apps/expo`)** — do **not** import api schemas directly. They consume the
  **generated tRPC client** (`@rocky/trpc` → `packages/trpc/src/generated/server.ts`), whose types are
  derived from these schemas. The border stays server-side. For enum *values*, the frontend imports the
  dictionary from `@rocky/validators/src/enums/index.js` (or the per-enum constant module); it never
  imports a Zod schema.
- **`apps/worker`** — does **not** consume api schemas. Workers consume `events/` schemas (the event
  protocol), not the API gate.
- **Domain services (`packages/domains`)** — receive already-validated, tenant-scoped data from the
  router; they do not re-import api schemas.

Author the shape once in `api/`, and it propagates to every router and every frontend client through
the tRPC codegen — no manual re-typing downstream.

## Verification

```bash
# Real enforcement in this repo — the guillotine makes drift a tsc error.
npx tsc --noEmit -p packages/validators/tsconfig.json

# Downstream consumers must still compile.
npx tsc --noEmit -p apps/api/tsconfig.json
```

> **No Panopticon / tribunal.sh.** Unlike the foreign Diamond Seal writeup, this repository has no
> `panopticon` CLI or `tribunal.sh`. Import-boundary rules (ADR 0011) and guillotine drift (ADR 0018)
> are enforced entirely by `tsc`. CI lint covers the import allowlist.

### Success Criteria

- [ ] `npx tsc --noEmit -p packages/validators/tsconfig.json` — 0 errors
- [ ] `npx tsc --noEmit -p apps/api/tsconfig.json` — 0 errors
- [ ] Every file exports `ActivateGuillotines<[...]>` (19/19 as of 2026-07-07)
- [ ] No audit columns (`createdBy`, `validTo`) in response schemas
- [ ] No cross-zone imports (`events`, `domains-*`, other `api/`)
- [ ] All Zod 4 primitives (no `z.date()`, single-arg `z.record()`, `.default()` where `.prefault()` fits)
- [ ] All response/create schemas derive from Drizzle-Zod (where a table exists)
