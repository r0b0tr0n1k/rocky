# Plan: Remediate API Validator Rule Violations (ADR 0018 / Diamond Seal)

## Context

ADR 0018 ratified the API validator construction standard: every `api/*.api.ts` schema must carry
`satisfies z.ZodType<Interface>` (Tier 1) and every file must export `ActivateGuillotines<[...]>`
(Tier 3), backed by `NoDrift`/`NoDriftSimple` aliases (Tier 2). A scan of all 19 `api/*.api.ts`
files found:

- **Forbidden imports: 0** — import boundaries (ADR 0011) are clean.
- **13 files violate ≥1 guillotine rule** (details below).
- **6 files are fully compliant**: `farms, health, inspection, iot, movements, notifications`.
- **ADR 0018 contains a factual error**: it tells developers to copy `animals.api.ts` as the
  template, but `animals.api.ts` is itself non-compliant (missing `satisfies`).

### Per-file violation breakdown

| Bucket                                  | Files                                                                     | Fix difficulty                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Has guillotine, **missing `satisfies`** | `animals, archive, organizations, pda-devices, rbac, subjects, users` (7) | Easy — interfaces already exist (guillotine needs them); add `satisfies z.ZodType<ExistingInterface>` to each schema              |
| Has `satisfies`, **missing guillotine** | `correction, document, eartags, passport` (4)                             | Easy — interfaces exist; add `NoDrift`/`NoDrillotineSimple` aliases + `ActivateGuillotines` export                                |
| **Missing both**                        | `holdings, registration` (2)                                              | Heavier — currently rely on `z.infer<typeof schema>` with no explicit interfaces; must introduce explicit `Interface` types first |
| Compliant (no action)                   | `farms, health, inspection, iot, movements, notifications` (6)            | —                                                                                                                                 |

### Softer (target, not a hard `tsc` error yet)

- `.strip()` instead of mandated `.strict()` on response schemas: 16/19 files (transitional).
- Create schemas using `.omit()` instead of `.pick()`: e.g. `animals.api.ts` (`createAnimalRequestSchema` uses `.omit`), leaks new DB columns.

---

## Decisions

1. **Full Diamond Seal compliance is the target** — explicit `Interface` types + `satisfies` + `NoDrift` + `ActivateGuillotines`, mirroring the 6 compliant reference files.
2. **`NoDrift` vs `NoDriftSimple`:** use `NoDrift` for response/hand-built/event schemas; use `NoDriftSimple` for Drizzle-derived (`*InsertSchema`/`*SelectSchema`) request schemas to avoid union false-positives.
3. **`.strip()` → `.strict()` migration is in scope but must be validated** (rejecting unknown keys could surface clients sending stray fields — low risk over internal tRPC, but verify).
4. **`.omit()` → `.pick()`** for create schemas to prevent new-DB-column leaks.
5. **ADR 0018 template line must be corrected** to point at a compliant file, not `animals.api.ts`.

---

## Execution Steps (do per phase, verify `tsc` after each)

### Phase 0 — Fix the ADR error

- Edit `docs/adr/0018-api-validator-design.md`: change the "copy `animals.api.ts`" template line to
  recommend `packages/validators/src/api/farms.api.ts` (or any of the 6 compliant files) as the template.

### Phase 1 — Add `satisfies` to the 7 guillotine-but-no-satisfies files

For each of `animals, archive, organizations, pda-devices, rbac, subjects, users`:

- For every exported schema, append `satisfies z.ZodType<ExistingInterface>` (the interface type
  already exists and is referenced by the file's `NoDrift` aliases).
- Place `satisfies` on the **outermost** call (after `.refine()` if present).

### Phase 2 — Add guillotine to the 4 satisfies-but-no-guillotine files

For each of `correction, document, eartags, passport`:

- For each schema, add `type _drift_<name> = NoDrift<z.infer<typeof <name>>, <Interface>>;`
  (or `NoDriftSimple` for Drizzle-derived request schemas).
- Append `export type _<Domain>Guillotines = ActivateGuillotines<[ ...all _drift_ aliases... ]>;`.

### Phase 3 — Bring `holdings` and `registration` to full compliance

- Introduce explicit `Interface` types for each schema (hand-mirror the `z.infer` shape today).
- Attach `satisfies z.ZodType<Interface>` and add `NoDrift`/`NoDriftSimple` aliases + `ActivateGuillotines`.
- This is the only phase that may surface **real hidden drift**; resolve drift by fixing the schema
  (schema is SSOT) or, as last resort, `type _drift_x = true` (never paper over with `as`).

### Phase 4 — Strictness migration (`.strip()` → `.strict()`)

- In the 16 files using `.strip()` on response schemas, switch to `.strict()`.
- Risk: payloads with unknown keys now error. Verify no internal consumer sends extra fields
  (search `apps/api`, `apps/web`, `apps/mobile` usages). If a legit extra field is needed, add it
  to the schema instead.

### Phase 5 — Create-schema `.omit()` → `.pick()`

- For create schemas derived from `*InsertSchema`, replace `.omit({...})` with `.pick({clientFields})`,
  selecting only fields the client may set (prevents new DB columns leaking into the API).

---

## Validation

After each phase:

```bash
npx tsc --noEmit -p packages/validators/tsconfig.json   # must be 0 errors
npx tsc --noEmit -p apps/api/tsconfig.json              # downstream consumers still compile
```

Final acceptance: 19/19 `api/*.api.ts` files have `satisfies z.ZodType` + `ActivateGuillotines`,
0 forbidden imports, 0 `tsc` errors.

---

## Risks / Open Questions

- **Phase 3 drift:** `holdings`/`registration` may reveal real interface/schema mismatches. Resolve
  at schema level; do not use `as`.
- **Phase 4 behavior change:** `.strict()` rejects unknown keys. Confirm with frontend owners that
  no client relies on lenient `.strip()` before enabling broadly.
- **RBAC/Users special shapes:** `users.api.ts`, `rbac.api.ts` may contain auth-specific schemas
  (password handling) — verify `passwordHash`/secrets are never in response schemas (Law VII).

## Out of Scope

- Event-file compliance (already follow the 4-part blueprint).
- New validator features; this is remediation only.
- CI lint rule authoring (import-boundary lint already exists per ADR 0011).

## Handoff

This plan must be executed by an **implementation-capable agent** (the planner does not edit source).
Suggested unit of work: one domain file per commit, `tsc` green after each.
