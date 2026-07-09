# Plan: Enforce `z.coerce.date<string>()` for PG `date` columns at L1

## Context

Postgres `date` columns (e.g. `animals.birth_date`, `movements.movement_date`,
`pasture.departure_date`, `treatments.diagnosis_date`, `ear_tag_allocations.allocation_date`,
`iot_devices.activation_date`, `passport.issue_date`, `health.adminDate`) return an **ISO string**
from `node-postgres` (unlike `timestamp` columns, which return a `Date`).

Drizzle-Zod declares these as `z.date()` (type = `Date`). The Dumb Zod factory
(`packages/database/src/zod/factory.ts`) sets `coerce: { date: true }`, which *should* make the
derived schema `z.coerce.date()`. When that coercion is missing or the value is never parsed, the
runtime value is a **string while the type claims `Date`** — the exact reported symptom
("comes out as `z.date()` — a string"). Because `superjson` can only reconstruct a `Date` from its
own `{__type:"Date"}` wrapper, a bare ISO string reaches the frontend as a raw string, breaking the
contract.

The proposed reference ("API Schema Patterns — Deriving from Dumb Zod", §2b Ruling 1) prescribes the
fix: **re-assert `z.coerce.date<string>()` at L1** for every such field. This is consistent with our
existing architecture (Dumb Zod stays native; L1 sculpts). Our codebase already applies this on many
create/update inputs (`animals.api.ts:30`, `movements.api.ts:187`, `passport.api.ts:85`,
`health.api.ts:65`, …) but it is undocumented and not audited for responses.

## Decisions

1. **Fix at L1 only.** Coercion belongs in `*.api.ts` `.extend({ field: z.coerce.date<string>() })`,
   never hand-added inside `@rocky/database/zod` (Dumb Zod stays native — `DATABASE_ZOD_ZONE.md`
   LAW 1). The factory remains the centralized source of `coerce: { date: true }`; L1 re-assertion
   (a) locks the **input** type to `string` (the `<string>` generic, required by Zod 4 so `.pipe()`
   / strict typing works) and (b) guarantees a `Date` output even if the factory emitted plain
   `z.date()`.
2. **Apply to both response and input schemas.** A `date` column surfaced in a response must also be
   coerced, otherwise the response leaks a string. Input schemas need it to accept JSON date strings.
3. **`nullable()` / `optional()` variants** follow the same rule:
   `z.coerce.date<string>().nullable()`, `z.coerce.date<string>().optional()`.

## Execution Steps

### Step 1 — Confirm factory coercion scope (verify assumption)

- Inspect what `createSelectSchema` actually emits for a `date()` column. Either:
  - `pnpm -C packages/database generate` (if it emits concrete schemas) and read the output, or
  - temporarily assert `animalsSelectSchema.shape.birthDate` is `z.coerce.date` (not `z.date`) in a
    throwaway check, or read `node_modules/drizzle-orm/zod` date mapping.
- **Outcome:** if `date` columns already emit `z.coerce.date()`, Step 3 is mostly a documentation +
  consistency pass; if they emit plain `z.date()`, Step 3 is **mandatory** for every `date` column
  (responses would otherwise leak strings today).

### Step 2 — Document the rule

- `docs/VALIDATOR_DESIGN_GUIDE.md`: add subsection (e.g. **§2.8b Date coercion for PG `date`
  columns**) stating: PG `date` columns return ISO strings; re-assert
  `z.coerce.date<string>()` at L1 for every such field in response AND input schemas; never in Dumb
  Zod; `<string>` locks the input type. Reference the proposed "Deriving from Dumb Zod" Ruling 1.
- `docs/API_VALIDATOR_ZONE.md`: add a one-line note under the date/strictness laws that `date`
  columns are coerced at L1 via `z.coerce.date<string>()` (adapter note to the generic reference).
- `docs/DATABASE_ZOD_ZONE.md`: clarify the factory's `coerce: { date: true }` covers `timestamp` AND
  `date` columns; L1 re-asserts `z.coerce.date<string>()` for input-type locking — i.e. soften the
  over-claim "no manual `z.coerce.date()` is ever needed downstream".

### Step 3 — Audit & fix `*.api.ts` schemas

- Enumerate all `date("...")` columns from `packages/database/src/schema/**`.
- For each `*.api.ts` that surfaces such a column (in a response schema, a create input, and/or an
  update input), ensure the field uses `z.coerce.date<string>()` (with `.nullable()`/`.optional()` as
  needed). Where a schema currently uses plain `z.date()` on that column, replace it.
- Normalize the known `z.date()` response fields for consistency even where they are `timestamp`
  (runtime `Date`): `users.api.ts:39 lastLoginAt`, `pda-devices.api.ts:39 lastSyncAt`,
  `pda-devices.api.ts:41 blockedAt` → `z.coerce.date<string>()`.

### Step 4 — Keep the guillotine green

- After each schema edit, re-run `satisfies z.ZodType<Interface>` and the `NoDrift` /
  `ActivateGuillotines` checks. The inferred output type for the field becomes `Date` (was already
  `Date` in the interface, so no interface change expected; verify no `DRIFT` appears).

## Validation

```bash
npx tsc --noEmit -p packages/validators/tsconfig.json   # 0 errors
npx tsc --noEmit -p apps/api/tsconfig.json              # 0 errors (downstream types unchanged)
```

Runtime check (post-implementation): insert/read a row with a `date` column via the tRPC query and
confirm the client receives a `Date` instance (not a string) — i.e. superjson round-trips it.

## Risks / Open Questions

- **Factory scope (Step 1):** determines whether this is a doc+consistency pass or a mandatory
  fix for every `date` column. Must be resolved before claiming done.
- **superjson interaction:** `z.coerce.date()` output is a real `Date`, so superjson serializes it as
  `{__type:"Date"}` and reconstructs correctly — no conflict.
- **`timestamp` columns:** already `Date` at runtime; coercing them with `z.coerce.date<string>()`
  is harmless and improves input-string tolerance.

## Out of Scope

- Changing the Dumb Zod factory or per-column overrides in `@rocky/database/zod`.
- Enum import-path migration (`domain.js` → `index.js`) — tracked separately.
