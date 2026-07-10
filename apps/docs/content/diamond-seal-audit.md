# Diamond Seal / NoDrift Codebase Audit

| Key            | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| **Status**     | Living document · extracted from `packages/validators/src`                  |
| **Date**       | 2026-07-09                                                                |
| **Author**     | Architecture Review                                                       |
| **Scope**      | The NoDrift "Guillotine" type-enforcement system in `@rocky/validators`    |
| **Companion**  | ADR-0011 (layer boundaries) · **ADR-0018 (Diamond Seal Guillotines)** · ADR-0019 (two-type contracts) · ADR-0023 (traceability) · ADR-0032 (tRPC boundary) · ADR-0050 (contract sync) |
| **Maintained** | Via RobotFarm pass — re-run the counts in §6/§7 when the validator set changes |

> _sniffs_ This is the **sublated** inventory, Comrade: not a new decision, but the
> material audit of a decision already made (ADR-0018). The Guillotine is the
> Materialist Enforcement of the Symbolic Order — type aliases that **do work**, or
> the build bleeds. Here we count the blades, name the zones, and surface where the
> edge of the blade still hesitates.

---

## 0. Summary

- **Single Source of Truth** for the guillotine primitives: `packages/validators/src/utils/type-bridge.ts`.
- **193** `_drift_*` guillotine type aliases across **25 api + 6 events** schema files.
- **31** `ActivateGuillotines<[…]>` activation blocks — **100% of schema-bearing files** (the only two files without one are the `index.ts` barrels, which hold no schemas).
- **~99** explicit `satisfies z.ZodType<T>` declarations (api 73, events 26).
- **Zero** guillotines in `apps/api` routers (consumer layer) and **zero** in the mobile/web clients (they consume `AppRouter` types directly).
- **Zero** `_verify_` prefixes in source — we use `_drift_` as the canonical prefix (the reference project standardized on `_verify_` and deprecated `_drift_`; see Gap G1).
- The system is **functionally identical** to the reference NoDrift pattern, with one hardening: our `ActivateGuillotines` rejects the empty tuple, so a file with zero proofs cannot compile green.

---

## 1. Core Type Definitions

File: `packages/validators/src/utils/type-bridge.ts` — the Single Source of Truth for all guillotine primitives.

```ts
// Bidirectional type equality (the engine) — identical trick to the reference project
export type AssertEqual<T, U> =
  (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2) ? true : false;

// The blade — forces `true` or a compile error (TS2344)
export type ExpectTrue<T extends true> = T;
export type ExpectFalse<T extends false> = T;

// Tier-2 structural identity check
export type NoDrift<A, B> =
  AssertEqual<A, B> extends true ? true
  : ["TYPE DRIFT DETECTED ──", { expected: A; actual: B }];

// Escalation variant — bidirectional `extends` (immune to union false-positives)
export type NoDriftSimple<A, B> =
  A extends B ? (B extends A ? true : ["DRIFT (B narrower)", A, B]) : ["DRIFT (A narrower)", A, B];

// Tier-3 activation — NON-EMPTY tuple of `true`, so a file with zero proofs fails to build
export type ActivateGuillotines<T extends [true, ...true[]]> = T;
```

### Difference from the reference project

- The reference `ActivateGuillotines<T extends any[]> = T extends true[] ? T : never` **permits an empty tuple** (`ActivateGuillotines<[]>` compiles). Ours requires `[true, ...true[]]`, so an empty activation block is **rejected** — a file that declares no guillotine cannot go green. This is a hardening, not a divergence.
- We additionally ship `NoDriftSimple` (bidirectional `extends`) as the documented escalation path when `NoDrift`'s `AssertEqual` false-positives on complex unions. The reference project relied on `AssertFieldCoverage` / raw `AssertEqual` for this.

---

## 2. Naming Convention: `_drift_` (canonical) vs `_verify_` (not used)

| Pattern | Count in source `.ts` files |
| ------- | --------------------------- |
| `type _drift_` | **193** across 31 files |
| `type _verify_` | **0** across 0 files |
| `NoDrift` / `NoDriftSimple` | 193 + 53 usages |
| `ActivateGuillotines` | 31 blocks |

`_drift_` is the canonical prefix in this codebase (and is what ADR-0018/0011 use). The reference project renamed `_drift_` → `_verify_` and left `_drift_` only in legacy docs/plans. We have **not** done that rename — see Gap G1.

---

## 3. Three-Tier Guillotine (the law, per ADR-0018 §C)

| Tier | Mechanism | Catches | Use on |
| ---- | --------- | ------- | ------ |
| **1** | `schema satisfies z.ZodType<Interface>` | missing fields, wrong value types | ALL schemas (request + response) |
| **2** | `type _drift_X = NoDrift<z.infer<typeof schema>, Interface>` | interface wider OR narrower than schema output | response + hand-built request schemas |
| **3** | `export type _XGillotines = ActivateGuillotines<[…]>` | forces TS to _evaluate_ the aliases | end of every `*.api.ts` / `*.events.ts` |

Canonical blueprint (interface-first → schema with `satisfies` → `_drift_` guillotine → `ActivateGuillotines`):

```ts
// 1. Interface (Law 8: Interface-First)
export interface AnimalResponse { id: string; /* … */ }

// 2. Schema bound with `satisfies`
export const animalResponseSchema = animalsSelectSchema.omit({ /* … */ })
  .extend({ /* … */ }) satisfies z.ZodType<AnimalResponse>;

// 3. Guillotine
type _drift_animalResponse = NoDrift<z.infer<typeof animalResponseSchema>, AnimalResponse>;

// 4. Activation (non-empty tuple — must carry ≥1 proof)
export type _AnimalGuillotines = ActivateGuillotines<[_drift_animalResponse /* , … */]>;
```

---

## 4. The Three-Part Flow (where the types come from)

```
packages/database/src/zod/*     →  Dumb Zod  (23 files: animal, eartag, farm, audit, …)
        │  (DRY source of row shapes)
        ▼
packages/validators/src/api/*    →  API Zod   (sculpt with .omit()/.extend()/.strict(),
        │                                 bind with `satisfies`, guillotine with NoDrift)
        ▼
apps/api/src/routers/*.router.ts →  tRPC      (consumes @rocky/validators/api, @Query/@Mutation)
        ▼
packages/trpc (AppRouter)        →  client    (mob/web infer types via superjson — no client guillotine)
```

- **Dumb Zod** (`packages/database/src/zod`, 23 files) is the input tier. ADR-0011 pins its import boundary.
- **API Zod** (`packages/validators/src/api`) is where `satisfies` + `NoDrift` live.
- **Enums** (`packages/validators/src/enums`) use the branded `zEnum` forge (`_enum-helper.ts`) — `zEnum` accepts ONLY `DbEnumValues`; unbranded arrays fail type-check. No guillotines here by design (enums are not interface-paired shapes).

---

## 5. Zone-by-Zone Findings

### A. `packages/validators/src/api/` — 25 files, 24 activated

Every api file follows the 4-part blueprint. Top files by guillotine count:

| File | `_drift_` count | `satisfies z.ZodType` |
| ---- | --------------- | --------------------- |
| health.api.ts | 20 | — |
| eartags.api.ts | 19 | — |
| movements.api.ts | 16 | — |
| iot.api.ts | 11 | — |
| farms.api.ts | 9 | — |
| notifications.api.ts | 8 | — |
| animals.api.ts | 8 | — |
| subjects / passport / inspection / correction .api.ts | 7 each | — |

`apps/api/src/` routers have **zero** guillotine patterns — they are a thin NestJS/tRPC consumer layer that imports `@rocky/validators/api` and never defines or verifies schemas. (Matches the reference project's `apps/api` finding.)

### B. `packages/validators/src/events/` — 6 files, 5 activated

Events follow the 4-part canonical blueprint (interface → strict payload schema with `satisfies` → `eventMetaSchema.extend(...)` envelope → `NoDrift` + `ActivateGuillotines`). One file lacks activation — it is the `index.ts` barrel (no schemas), excluded from coverage.

### C. `packages/validators/src/enums/` — guillotine-free by design

Branded `zEnum` forge; no interface-paired shapes, so no `_drift_`. The brand check (`DbEnumValues`) is the equivalent enforcement here.

### D. `packages/database/src/zod/` — Dumb Zod (the input tier)

23 files supplying row shapes consumed by the api layer. No guillotines (these are the _source_, not the _contract_).

### E. Clients (`apps/mob`, `apps/web`) — zero guillotines

The mobile and web apps consume `AppRouter` types inferred through `superjson`. There is **no client-side `NoDrift`** between a client-defined interface and a tRPC output. Parity is enforced at the transport boundary (ADR-0032 `@Output` schema rule + WO-102 `check-trpc-boundary` guard), not by per-type guillotines. See Gap G4.

---

## 6. `satisfies z.ZodType<T>` Distribution

| Zone | Files | `satisfies z.ZodType<T>` |
| ---- | ----- | ------------------------ |
| api/ | 25 | 73 |
| events/ | 6 | 26 |
| enums/ | — | 0 (branded `zEnum` instead) |
| db/ (Dumb Zod) | 23 | 0 (input tier) |
| **Total** | | **~99** |

Per AGENTS.md convention ("`satisfies` on every Zod schema export"), this is the mandated Tier-1 floor. ADR-0018 §C makes it a project-wide law.

---

## 7. Activation Coverage

| Zone | Files | Activated | Coverage (schema files) |
| ---- | ----- | --------- | ----------------------- |
| api/ | 25 | 24 | 100% (1 excluded = `index.ts` barrel) |
| events/ | 6 | 5 | 100% (1 excluded = `index.ts` barrel) |
| **Total** | 31 | 31 | **100% of schema-bearing files** |

Because `ActivateGuillotines` requires a non-empty `true[]`, an api/events file that declared schemas but forgot its activation block would fail to compile — the empty-tuple footgun is closed.

---

## 8. GAPS

> Gaps are documented here, not fixed. Each is a candidate Work Order.

- **G1 — Prefix convention (`_drift_` vs `_verify_`).** We use `_drift_`; the reference project renamed to `_verify_` and deprecated `_drift_`. Our ADRs/docs use `_drift_`. Cosmetic parity only — optional rename across `packages/validators/src` + ADR-0018/0011 wording. _Priority: P3._

- **G2 — Bypass coverage (9 `type _drift_X = true`).** Nine schemas use the documented last-resort escape hatch (`type _drift_X = true`) for union/recursive shapes that `AssertEqual` false-positives on. These are **intentionally zero-coverage** — drift on those 9 is not caught. Track them; revisit if `NoDriftSimple` or a future `AssertEqual` fix resolves the false-positive. _Priority: P2._

- **G3 — Tautological `NoDrift` on drizzle-derived responses.** Per ADR-0018 §C, response schemas derived from Dumb Zod get `NoDrift<z.infer<typeof X>, X>` (= `true` trivially) and rely only on `satisfies` (Tier 1, one-directional). Full Tier-2 coverage is not achieved for these. Accepted by design, but it means the _interface_ can be wider than the schema output without error. _Priority: P2 (documented)._

- **G4 — Client-side type parity.** Clients consume `AppRouter` directly and define no `NoDrift` against tRPC outputs. This is correct _as long as_ the client never hand-declares an interface for a server shape. If a client screen/form models a tRPC response with its own interface, drift is silent. Evaluate whether `apps/mob` / `apps/web` need a client-side `NoDrift` or a generated client-model check. _Priority: P3 (evaluate)._

- **G5 — No `integrations` / `internal` / `webhooks` zones.** The reference project's `integrations/` bound schemas to external vendor SDK types via `ExpectTrue<AssertEqual<z.infer<schema>, VendorSDK>>` (Tier-1). We have **no external SDK boundary** (our edge is Postgres/Drizzle → tRPC), so those zones and Tier-1 vendor proofs do not apply. **Not a gap** — a scope difference, documented here to preempt false alarms.

- **G6 — No separate shared SSOT package.** The reference kept guillotine primitives in `packages/panopticon-shared` and re-exported them. Ours co-locate `type-bridge.ts` inside `@rocky/validators` (the only consumer package). Justified: no cross-package reuse required. **Not a gap.**

- **G7 — This audit document was missing.** The design ADR (0018) existed; the zone-by-zone inventory did not. Created by this document. _Closed._

- **G8 — Confirm 100% `satisfies` coverage.** ~99 explicit `satisfies z.ZodType<T>` exist; verify every _exported_ schema in `api/` + `events/` carries one (none should rely on `as` — AGENTS.md: "`as` is the last resort of the defeated"). _Priority: P2._

- **G9 - Cross-layer bridge primitives adopted + B2b sweep COMPLETE (all 24 routers).** `OkType`/`ErrType`/`InferOk` (neverthrow `Result` extraction), `SubtypeGuillotine` (Bridge 3), and `AssertFieldCoverage` (Bridge 1) added to `packages/validators/src/utils/type-bridge.ts` (validators typecheck green). **Bridge 2b applied to ALL 24 routers** (`apps/api/src/routers/*.router.ts` - 93 guillotine aliases on the 19 newly-swept routers + ~59 on the 5 prior; api package typecheck green): each router ends with `export type _XGuillotines = ActivateGuillotines<[...]>` proving `SubtypeGuillotine<z.output<typeof outputSchema>, Awaited<ReturnType<Router["m"]>>>` - Drizzle-derived responses mean the hand-written interface is the wider SSOT, so `AssertEqual`/`NoDrift` false-positives (see G3); `SubtypeGuillotine`'s one-directional `A extends B` is correct. `rbac` uses `NoDrift` (its interfaces are AssertEqual with their schemas - the Tier-1 case). **The sweep caught 3 genuine drifts and forced fixes:** `inspection` `riskAnalysisListResponseSchema.data` was `z.array(z.unknown())` (raw-rows placeholder) -> now `z.array(riskAnalysesSelectSchema)`; `audit` + `sync` routers lacked the `z` namespace import needed for `z.output<>`, which made the guillotine un-evaluable (added `import { z } from "zod"`). **B1 (`AssertFieldCoverage`) NOT applied**: our response schemas are sculpted (`.omit()` audit fields, `.extend()` with `z.coerce.date()`/branded enums), so `Api extends Db` is false by design - literal B1 false-positives on all 25 files. **B3 (`SubtypeGuillotine` in domains) NOT applied**: domain services import `z.infer<>` types directly, so there is no separate interface to drift (tautological). **OkType not used for B2b** - thin routers `return unwrap(service.result)`, so `Awaited<ReturnType<Router["m"]>>` already resolves the service success type without extracting `Result`. _Priority: P2 (done)._

---

## 9. ADR Cross-Reference

| ADR | Relevance |
| --- | --------- |
| 0011 | Diamond Seal layer boundaries — where each tier may import |
| **0018** | **API Validator Schema Design (Diamond Seal Guillotines)** — the three-tier law |
| 0019 | Two Type Contracts — Postgres → tRPC client |
| 0023 | Business-Rule Adoption & Source-to-Code Traceability |
| 0032 | tRPC Transport Architecture & Mandatory `@Output` Schemas (boundary) |
| 0050 | Frontend ↔ Backend Contract Sync (client parity) |

---

## 10. Key Answers (our repo)

1. **Does `packages/validators/src/api/` have NoDrift patterns?** Yes — extensively: 193 `_drift_*` aliases across 25 files, 24 with `ActivateGuillotines` blocks.
2. **Do `apps/api` routers have `satisfies` / `AssertEqual` / guillotines?** No — zero. Routers are consumers that import `@rocky/validators/api`.
3. **What do `AssertEqual` / `ExpectTrue` / `NoDrift` look like?** Defined in `packages/validators/src/utils/type-bridge.ts` (§1). `AssertEqual` uses the `<V>() => V extends T ? 1 : 2` higher-kinded trick; `NoDrift` wraps it with a diagnostic literal on failure.
4. **Are there already-implemented NoDrift patterns between Dumb Zod and API validators?** Yes. The api layer sculpts Dumb Zod (`@rocky/database/zod`) with `.omit()/.extend()/.strict()`, binds with `satisfies z.ZodType<Interface>`, and guillotines with `NoDrift`. Interface-first (Law 8), then schema, then blade.
5. **`_drift_` vs `_verify_`?** `_drift_` is canonical here (193 uses, 0 `_verify_`). The reference project migrated to `_verify_`; we have not (Gap G1).
6. **Client parity?** Enforced at the tRPC boundary (ADR-0032 + WO-102), not by client-side guillotines (Gap G4).
