# Plan: Date & Null Management — Dumb Zod (L2) and API Validators (L1)

## Context — The Dialectical Conclusion (verified against the repo)

The pasted "Diamond Seal" writeup analyzes three traumas and prescribes rulings. I tested each
against the actual Rocky code (`packages/database/src/zod/factory.ts`, `packages/validators/src/api/*`,
`docs/VALIDATOR_DESIGN_GUIDE.md`):

| Trauma / Manifesto ruling | Rocky reality (verified) | Verdict |
| --- | --- | --- |
| **#1 Dumb Zod factory = pure `z.date()`, NO coerce** | `factory.ts` uses `createSchemaFactory({ coerce: { date: true } })` → emits `z.coerce.date()`. Deliberate, documented in the factory header. | **CONTRADICTS** the manifesto. Rocky factory already coerces (DRY: L1 inherits coercion). |
| **#2 API inputs must use `z.coerce.date<string>()`** in `.extend()` overrides | 64 `z.coerce.date` usages in `api/`; **inconsistent**: `animals/farms/archive/correction/eartags.api.ts` already use `z.coerce.date<string>()`, others use bare `z.coerce.date()`. `tsc` is green either way (no pipe chains on dates today). | Mostly aligned; **inconsistency to fix**. |
| **#3 `.superRefine` at L1 with `path: ["field"]`** | Already practiced in `movements.api.ts` and `health.api.ts`, each with `path: ["toDate"]` / `path: ["dateTo"]`. | **Aligned.** Codify only. |
| **#4 Null vs Default: `.default()` fires only on `undefined`** | No nullable field in `api/` carries `.default()` (defaults sit only on non-nullable query params: limit/offset/sortBy/stateCode). Not a live bug. `VALIDATOR_DESIGN_GUIDE.md` already recommends `.prefault()` for default-with-parse. | **Aligned in spirit.** Codify to prevent regression. |

**Conclusion on the Dumb Zod factory:** Rocky's L2 deliberately centralizes date coercion in the
factory (`coerce: { date: true }`). This is valid Zod-4 architecture and NOT a bug — it means L1
inherits `z.coerce.date()` instead of re-adding it to every date field. The manifesto's "pure
`z.date()`" describes a repo that pushes ALL coercion to L1; Rocky chose the opposite. We keep the
factory coercion and document it as a conscious deviation.

## Decision — Factory date coercion (the one fork)

**RESOLVED (recommended): KEEP `coerce: { date: true }` in `factory.ts`.**
Rationale: removing it would emit pure `z.date()`, which does NOT parse JSON strings from the
frontend; every one of the ~19 `api/*.api.ts` files that has a date input field would then silently
break at runtime unless re-touched to add `z.coerce.date<string>()`. That is a large, risky migration
for zero behavioral gain. tsc is green today.

**Optional, higher-risk alternative (NOT in primary scope):** fully revert the factory to pure
`z.date()` and sweep all `api/` date-input fields to `z.coerce.date<string>()`. Recorded here only so
it can be opted into later; primary plan does NOT do this.

## Fixes (implementation steps — documentation + standardization only)

1. **Standardize the date-input generic.** In `packages/validators/src/api/*`, change bare
   `z.coerce.date()` → `z.coerce.date<string>()` on date fields that appear in `.extend()` / `.pick()`
   **input** overrides (create/update schemas). Leave response/select-derived fields as-is (they
   inherit the factory's `z.coerce.date()` and are not parsed from JSON). Goal: zero bare
   `z.coerce.date(` on input fields.
2. **Codify Cross-Field Validation.** Document the rule in `packages/validators/AGENTS.md` (new
   §2.7): `.superRefine` lives at the END of an api input schema, and MUST set
   `path: ["fieldName"]` so react-hook-form maps the error to the correct input. (Already practiced;
   no code change needed beyond the standardization in step 1.)
3. **Codify the Null Fallacy.** Document: `.default()` only triggers on `undefined`. If the frontend
   may send `null` and you want a fallback, use `.nullable().optional().catch(default)` and/or
   `.transform(x => x ?? default)`, or `.prefault()` when the default needs parsing. Keep the existing
   `VALIDATOR_DESIGN_GUIDE.md` `.prefault()` idiom note. Audit: confirm no nullable field carries
   `.default()` (none today).
4. **Create `docs/ZOD_PATTERNS.md`** with a "Date and Null Management" section containing the four
   rules (Dumb Zod remains coerced-by-factory; API uses `z.coerce.date<string>()`; superRefine+path;
   null-fallback via `.catch()`/`.transform`/`.prefault()`). Cross-link from `packages/validators/AGENTS.md`,
   `docs/DATABASE_ZOD_ZONE.md`, `docs/VALIDATOR_DESIGN_GUIDE.md`.
5. **Update `docs/DATABASE_ZOD_ZONE.md`** to add an explicit note that `coerce: { date: true }` is a
   deliberate Rocky decision and a conscious deviation from the foreign "pure `z.date()`" template,
   with the rationale (DRY, no runtime breakage).
6. **Update `packages/validators/AGENTS.md` §2.1/§2.5** to reference `z.coerce.date<string>()` for
   input overrides and to point at `docs/ZOD_PATTERNS.md` for the null/default rule.

## Validation

- `npx tsc --noEmit -p packages/validators/tsconfig.json` → 0 errors.
- `npx tsc --noEmit -p packages/database/tsconfig.json` → 0 errors.
- Grep `packages/validators/src/api` for `z.coerce.date(` with NO `<string>` on input-override lines → 0.
- Grep `docs/ZOD_PATTERNS.md` for `@repo/` → 0 (all `@rocky/`).
- Audit: `grep -rnE "\.nullable\(\)\.default\(|\.nullish\(\)\.default\(" packages/validators/src/api` → 0 (no nullable field carries `.default()`).

## Open Questions

- Whether to later opt into the optional full factory revert (step "alternative"). Out of primary scope.
