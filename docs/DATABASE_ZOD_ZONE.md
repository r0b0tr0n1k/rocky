# Database Zod Zone — The Dumb Zod Layer (L2)

> **Source of Truth:** This zone doc is the ownership/laws contract for `packages/database/src/zod/`.
> It is adapted from the canonical "Diamond Seal" dumb-zod writeup, corrected to Rocky's real
> conventions (verified against the live code, `factory.ts`, and `tsc`). The parent contract is
> `packages/database/AGENTS.md` (which already states: *"Dumb Zod (`zod/`) has NO `.strict()`,
> `.omit()`, `.extend()`"*). The L1 sculpting rules live in `packages/validators/AGENTS.md` and
> `docs/API_VALIDATOR_ZONE.md`. Enforcement is `tsc --noEmit`, not a Panopticon CLI (no
> `tribunal.sh` / `panopticon` exists in this repository).

## Purpose

Auto-generated **Drizzle-Zod** select/insert schemas — the "dumb" Zod. These are the raw, mechanical
output of `createSelectSchema` / `createInsertSchema` over the Drizzle table definitions. They contain
NO API-layer discipline:

- they are **not** `.strict()` — unknown keys sail through;
- audit columns (`createdBy`, `validTo`, …) are present — L1 strips them;
- dates are already `z.coerce.date()` (no manual coercion needed downstream);
- enum columns surface as plain `z.enum(VALUES)` — unbranded, not the L1 `zEnum` form.

This layer is the SSOT of *shape*; the intelligent L1 layer (`@rocky/validators`) sculpts it into
contracts.

> **Why "dumb"?** It is intentionally unintelligent. It must NOT apply `.strict()`, `.omit()`,
> `.passthrough()`, `.extend()`, `.refine()`, or any policy upgrade. All of that belongs in
> `@rocky/validators` (`api/` / `events/`). The dumb layer is RAW IRON — shaped by the table, not by
> policy.

## Ownership

**L2 — Database foundation infrastructure** (per `packages/database/AGENTS.md`). No domain logic, no
validation policy, no enum branding. Emits derived schemas only. The Diamond Seal flows ONE direction:
L1 (`@rocky/validators`) → L2 (`@rocky/database/zod`). Never the reverse.

## The Factory

`factory.ts` wraps `createSchemaFactory` from `drizzle-orm/zod` with:

- `coerce: { date: true }` — every `timestamp` column auto-generates `z.coerce.date()`. **No manual
  `z.coerce.date()` is ever needed** in this layer or downstream (L1 relies on the inherited coercion).

`bigint` columns map to `z.number()` via Drizzle's default `bigint({ mode: "number" })` handling — this
is Drizzle's default behavior, not an extra factory config.

Exports `createSelectSchema`, `createInsertSchema`, `createUpdateSchema`. **Always import from
`./factory`** — never from `drizzle-orm/zod` directly (bypasses the coercion config).

## Per-Table File Contract

Each domain file (`an.ts`, `hd.ts`, `hk.ts`, `sm.ts`) contains ONLY derived exports — one
`XxxSelectSchema` / `XxxInsertSchema` pair per table in that domain — plus optional JSONB overrides:

```ts
import { animals } from "../schema/an/animals.js";
import { createInsertSchema, createSelectSchema } from "./factory.js";

export const animalSelectSchema = createSelectSchema(animals);
export const animalInsertSchema = createInsertSchema(animals);
```

### JSONB Overrides (the only allowed intelligence)

Override a JSONB column ONLY when the table uses a Drizzle `$type<>()` param — pass the Zod shape as
the second argument to `createInsertSchema` (and/or `createSelectSchema`):

```ts
export const thingInsertSchema = createInsertSchema(thingTable, {
  metadata: z.object({ key: z.string(), value: z.unknown() }),
});
// No .strict(), no .omit() here!
```

This escape hatch is the **only** permitted place for a hand-written Zod shape in this layer. It is
currently unused across all domain files. Do NOT override scalar/text/enum columns — a plain `text()`
column legitimately yields `z.string()`, and an `pgEnum` column legitimately yields `z.enum(VALUES)`;
the L1 validator upgrades these via `.extend()`.

## Strict Laws

### LAW 1: Derive Only — No Shaping

| ✅ Allowed                                                       | ❌ Banned                                              |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| `createSelectSchema(table)`                                     | `.strict()` — belongs in validators                    |
| `createInsertSchema(table)`                                     | `.omit()` — belongs in validators                      |
| `createUpdateSchema(table)`                                     | `.passthrough()` — banned                              |
| `create*Schema(table, { jsonbCol: z.object() })` (JSONB only)   | `.extend()` — belongs in validators                    |
|                                                                 | `.refine()` / `.superRefine()` — belongs in validators |
|                                                                 | inline `z.enum([...])` — atoms live in `constants`     |

### LAW 2: No `@rocky/validators` Imports (Circular Prohibition)

- `zod/` imports ONLY from `../schemas`, `./factory`, and `zod`.
- Importing `@rocky/validators` (any zone) is a circular dependency. The Diamond Seal flows
  ONE direction: `{api, events}` → `database/zod`. Never the reverse.

### LAW 3: Barrel Export

- `index.ts` re-exports every per-table file (`export * from "./an.js"`, etc.) plus the factory
  exports (`createSelectSchema`, `createInsertSchema`, `createUpdateSchema`).
- Consumers import from `@rocky/database/zod` — the single entry point. They never deep-import a
  per-table file (`@rocky/database/zod/an` is forbidden).

### LAW 4: Enum Columns Are Auto-Handled

- Internal `pgEnum` columns surface as `z.enum(VALUES)` automatically — do NOT re-specify them.
- Plain `text()` columns surface as `z.string()` — do NOT upgrade them here (that is L1's job via
  `.extend()` with a branded `zEnum`).

## How This Layer Is Consumed

- **L1 API validators** (`@rocky/validators/src/api/*`): `import { myTableSelectSchema, myTableInsertSchema }
  from "@rocky/database/zod"` then `.omit({ createdBy: true, validTo: true }).strict()`,
  `.pick().extend().strict()`, etc. (see `docs/API_VALIDATOR_ZONE.md`).
- **L1 event validators** (`@rocky/validators/src/events/*`): events are hand-built (NOT DB shapes), so
  they do not derive from this layer — listed here only to be explicit about the boundary.
- **L4 repositories** (`packages/domains/*`): import `*SelectSchema` to type the `ValidatedRepository`
  row shape and run RLS-wrapped queries.
- **Branded enum types** (`zEnum`) are NOT produced here — they live in `@rocky/validators/enums`,
  built from `database/constants`. This layer's enum output is the unbranded Drizzle form.

## Work Guidance

- Adding a table: create the pgTable in `../schemas/`, then add the `XxxSelectSchema` /
  `XxxInsertSchema` exports to the relevant `<domain>.ts`, then ensure `export * from "./<domain>"`
  exists in `index.ts`.
- Never add business rules, default values, or audit-column stripping — that is L1's sovereign territory.
- If a column type is wrong, fix it in `../schemas`, not here. This file is a reflection of the table.

## Verification

```bash
npx tsc --noEmit -p packages/database/tsconfig.json
```

> **No Panopticon / tribunal.sh / bun.** Unlike the foreign Diamond Seal writeup, this repository has
> no `tribunal.sh`, `panopticon`, or `bun` tooling. Import-boundary rules (ADR 0011) and schema shape
> are enforced entirely by `tsc`. CI lint covers the import allowlist.

## Related Contracts

- `packages/database/AGENTS.md` — L2 parent (Foundation)
- `packages/database/src/schemas/` — the pgTable definitions this layer reflects
- `packages/database/src/constants/` — enum atoms (SSOT)
- `packages/validators/AGENTS.md` — L1 Canonical Gate that sculpts these schemas
- `docs/VALIDATOR_DESIGN_GUIDE.md` — full validator how-to
- `docs/API_VALIDATOR_ZONE.md` — the L1 API gate (Derive-and-Sculpt)
- `docs/EVENT_VALIDATOR_ZONE.md` — the L1 event protocol
