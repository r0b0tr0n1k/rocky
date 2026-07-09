# WORKORDER — Pending Tasks Extracted from the ADRs

| Key            | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Status**     | Open · living document                                  |
| **Date**       | 2026-07-09                                              |
| **Author**     | Architecture Review (extracted from `apps/docs/content/ADR/*`) |
| **Scope**      | All open defects, deferred builds, and future-work items declared across ADRs 0009–0032 |
| **Maintained** | Via RobotFarm pass — update when an ADR's status changes |

> _sniffs_ This is the **sublated** list, Comrade: every contradiction the ADRs defer or confess as a
> bug, gathered into one order so it can be **acted upon** rather than endlessly narrated. The
> symptom (drift, hardcoded constants, missing roles) becomes the task.

---

## Summary

- **Open code defects:** 2 — B1 (takeover-file check digit), B3 (`VI` subject role). (Stale generated `server.ts` resolved by WO-003.)
- **P0 epic:** the Jurisdiction-Configurable Rule Engine (ADR-0030) — resolves B2 and the hardcoded-threshold disease across `eartag`/`animal`/`movement`/`health`/`inspection`.
- **Domain fixes:** stock reconciliation, per-farm risk results, birth-notification deadlines, weighted-params config, `FIELD_CHANGED` lock, QR ear tags.
- **Testing & observability (ADR-0020):** 7 open `- [ ]` items across 3 phases.
- **Validator hardening (ADR-0018):** 2 migrations pending runtime smoke test.
- **Deferred by design / future:** PDF/A, AMR, outbreak buffers, genetic lineage, blockchain, IoT QoS — tracked, not this sprint.

---

## Master List

| WO   | Task                                                            | Source ADR | Priority | Status |
| ---- | --------------------------------------------------------------- | ---------- | -------- | ------ |
| WO-001 | Fix takeover-file check digit + synthetic tag numbers (B1)     | 0024 / 0023 | P1       | Done ✅   |
| WO-002 | Add `VI` subject role (or document the collapse) (B3)          | 0027 / 0023 | P2       | Open   |
| WO-003 | Delete stale `apps/api/src/trpc/server.ts` + drop from patch TARGETS | 0032   | P2       | Done ✅ |
| WO-010 | Build `ruleset` store + MK seed migration from today's constants | 0030     | P0       | Done ✅ |
| WO-011 | Algorithm-provider registry + check-digit provider            | 0030 / 0024 | P0       | Done ✅   |
| WO-012 | Migrate hardcoded thresholds → RuleSet (eartag/movement/animal/health) (B2) | 0030 | P0 | Done ✅ |
| WO-013 | `farmerCanAdminister` flag + `@Policy` wiring                 | 0030       | P1       | Done ✅   |
| WO-014 | Retention + role vocab sourced from RuleSet                   | 0030       | P1       | Done ✅   |
| WO-020 | Health stock-reconciliation job                               | 0026 / 0023 | P2       | Open   |
| WO-021 | Persist per-farm risk-analysis results (`risk_analysis_results`) | 0028 / 0023 | P2   | Open   |
| WO-022 | Enforce birth-notification deadlines (7/20 d)                 | 0028 / 0023 | P2       | Open   |
| WO-023 | Inspection weighted params → RuleSet `GN_ANLS_PARAMS`         | 0028 / 0030 | P1       | Done ✅   |
| WO-024 | Complete `FIELD_CHANGED` → VD approval lock (field-diff pipeline) | 0027     | P3       | Open   |
| WO-025 | QR-code-scannable ear tags                                    | 0024 §E / 0009 §6 | P3  | Open   |
| WO-030 | `*.service.workflow.test.ts` per domain (state machines)      | 0020 P1    | P1       | Open   |
| WO-031 | `*.repository.rls.test.ts` per security-sensitive domain      | 0020 P1    | P1       | Open   |
| WO-032 | Audit JSDoc: strip WHAT-tautologies, keep WHY-constraints      | 0020 P1    | P1       | Open   |
| WO-033 | `*/e2e/*.test.ts` border tests (real Postgres RLS)            | 0020 P2    | P2       | Open   |
| WO-034 | Scaffold `@rocky/observability`; implement `TraceStage`/`MetricsStage` | 0020 P2 / 0003 | P2 | Open |
| WO-035 | Retire manual `logger.*` in services → span attributes        | 0020 P3    | P3       | Open   |
| WO-036 | Business metrics emitted inside domain services/workers       | 0020 P3    | P3       | Open   |
| WO-040 | Migrate `.strip()` response schemas → `.strict()` + smoke test | 0018      | P2       | Open   |
| WO-041 | Convert create schemas `.omit()` → `.pick()`                 | 0018       | P2       | Open   |
| WO-050 | PDF/A rendering + cryptographic seal                          | 0009 / 0029 | Future   | Deferred |
| WO-060 | Gate IoT behind `RuleSet.features.iot` (UI + routers)         | 0031       | P3       | Open   |
| WO-061 | IoT LPWAN QoS/SLA model (dedup, late-arrival)                 | 0031       | Future   | Deferred |
| WO-070 | Deferral register: AMR, 10 km buffer, genetic lineage, blockchain, notification SMS | 0023 / 0014 | Future | Deferred |
| WO-071 | Confirm animal calving-gap divergence (365 d vs legacy 120 d) | 0025       | P3       | Open   |
| WO-080 | Author frontend/mobile ADR set per ADR-0033 (0034–0043; domain features 0044+) | 0033       | P1       | Open   |
| WO-081 | Promote mobile sync to top-level `sync` router (syncDownload/syncUpload under `health`) | 0034       | P2       | Open   |
| WO-082 | Implement mobile offline-first cache + sync queue (expo-sqlite, persistQueryClient, NetInfo, sync router) | 0035       | P2       | Open   |
| WO-083 | Reconcile AGENTS.md Mobile Bot path apps/mobile -> apps/mob (contract vs reality) | 0035       | P3       | Open   |
| WO-085 | Filter mobile tabs by RBAC permission (mirror web `filterNavByPermissions`) | 0039       | P2       | Open   |
| WO-090 | Commit an ADR-0032-compliant `AppRouter` (regenerated client with `transformer: superjson` + 0 `ReturnType<`); the *committed* `HEAD` version fails ADR-0032's own Definition-of-Done guard, so it must not ship | 0032   | P2       | Open   |

---

## 0. Client ADR Build-out (ADR-0033)

### WO-080 — Author the frontend/mobile ADR set — P1
- Establish the client ADR practice codified in **ADR-0033**: web-admin ADRs (Admin Bot) and mobile
  ADRs (Mobile Bot + Frontend Bot) in `apps/docs/content/ADR/`, continuously numbered, covering
  features **and** permissions **and** design (ADR-0033 §D2).
- Author the roadmap ADRs: **0034** Client Surface Inventory · **0035** rendering/data-fetching · **0036** offline sync (seed 0015) · **0037** design system · **0038** forms/validation · **0039** navigation · **0040** i18n · **0041** error/empty/loading UX · **0042** permission-aware UI · **0043** push/background sync · **0044+** domain feature ADRs
- Seed ADRs **0015** (mobile sync) and **0017** (web shell) already migrated into the canonical set.
- Acceptance: each new ADR cites its backend dependency (ADR-0032 / 0021 / 0022 / 0006 / 0018 / 0019)
  and is listed here with its number.
- **Source:** ADR-0033 §D6 / Roadmap.

### WO-081 — Promote mobile sync to a top-level `sync` router — P2
- The mobile offline-sync transport `syncDownload` (query) and `syncUpload` (mutation) are nested
  inside the `health` router (found while building the client inventory, ADR-0034). Sync is a
  cross-cutting transport concern (ADR-0015 / ADR-0032), not a health domain operation.
- Promote them to a top-level `sync` router; update mobile client consumption (ADR-0015 / 0036).
- **Source:** ADR-0034 (§Context "A Real found while inventorying" / Master table footnote \*).

### WO-082 — Implement mobile offline-first data-fetching — P2
- ADR-0035 prescribes the mobile offline target; today `apps/mob` is online-only (no `expo-sqlite`,
  `react-query-persist-client`, or `netinfo` in `package.json`).
- Implement: local `expo-sqlite` (Drizzle-Expo) cache; `persistQueryClient`; `onlineManager`/NetInfo
  gating; offline writes -> sync queue -> `sync` router (WO-081); converge `createTRPCReact` ->
  `createTRPCContext<AppRouter>` (ADR-0032).
- **Source:** ADR-0035 §Decision B / Consequences.

### WO-083 — Reconcile AGENTS.md Mobile Bot path (apps/mobile -> apps/mob) — P3
- The RobotFarm contract (`AGENTS.md`) references `apps/mobile/` for Mobile Bot / Frontend Bot, but the
  actual Expo app lives at `apps/mob/`. Client ADRs (0033/0034/0035) now use `apps/mob`.
- Fix root `AGENTS.md` Mobile Bot + Frontend Bot descriptions and the Child RobotFarm Index path.
- **Source:** ADR-0035 §Context / WO-083.

### WO-085 — Filter mobile tabs by RBAC permission (mirror web `filterNavByPermissions`) — P2
- ADR-0039 §3 / Decision: web navigation is permission-filtered via `nav-config.ts` (`NavItem.permission`)
  + `filterNavByPermissions(navSections, permissions)` (used in `AdminShell` sidebar + command palette).
  Mobile `apps/mob/app/(tabs)/_layout.tsx` renders **all 10 `Tabs.Screen` unconditionally** — no
  permission filter — so unauthorized users see rooms they cannot use (the ADR-0017 repressed symptom
  returns on mobile).
- In `(tabs)/_layout.tsx`, compute the session's RBAC permissions and conditionally render `Tabs.Screen`
  entries (or set `href: null` / `hidden`) for tabs the user lacks permission for, mirroring web.
- **Source:** ADR-0039 §Decision 3 / Consequences; ADR-0017 (permission-gated nav dialectic); ADR-0022.

## 1. Open Code Defects

### WO-001 — Takeover-file check digit + synthetic tags (B1) — P1

- **Where:** `packages/domains/eartag/src/services/eartag.service.ts:512-536` (`generateTakeoverFile`).
- **Defect:** computes `check = 10 - (sum % 10)` with weights `[3,1,3,1,3,1,3]` and enumerates
  `10000001 + i`. Canonical `calculateEarTagCheckDigit` uses `[3,5,7,11,13,17,19]` + `sum % 10` and the
  real assigned tags. Exported `.txt` files contain invalid tags that fail `validateEarTagCheckDigit`.
- **Acceptance:** exported takeover-file lines pass `validateEarTagCheckDigit`; weights `[3,5,7,11,13,17,19]`
  - `sum % 10`; emits real assigned tags (no `10000001 + i`). Per ADR-0030, call the **active check-digit
  provider** (WO-011), not a private formula.
- **Source:** ADR-0024 (§B1), ADR-0023 bug register.
> **Corrigendum (RobotFarm pass, 2026-07-09):** Fixed. `generateTakeoverFile` (`packages/domains/eartag/src/services/eartag.service.ts`) no longer computes a private check digit nor enumerates `10000001 + i`. It now calls `getCheckDigitProvider()` (active MK provider: weights `[3,5,7,11,13,17,19]` + `sum % 10`, per WO-011) and emits the **real assigned tags** fetched via the new `EarTagRepository.findEarTagsByOrderId(order.id)` (the tags `collectOrderTags` assigned to the order). Each tag is validated with the provider before emission (defensive throw on corruption), and `lineCount` uses the real tag count. eartag domain type-checks clean.

### WO-002 — `VI` subject role missing (B3) — P2

- **Where:** `packages/database/src/constants/subject-role.ts` (`SUBJECT_ROLE` has 8 members; no `VI`).
- **Defect:** workflow's VS/VI split is collapsed; only `VETERINARIAN` exists.
- **Acceptance:** either add `VI` `SUBJECT_ROLE` (with RBAC + `@Policy` wiring) **or** formally document
  the collapse in ADR-0027. Domain-owner decision pending.
- **Source:** ADR-0027 (§B3), ADR-0023 bug register.

### WO-003 — Stale generated `server.ts` — P2 (hygiene)

- **Where:** `apps/api/src/trpc/server.ts` (70 `ReturnType<` backend-class imports, **zero importers**).
- **Defect:** latent `TS6059` hazard and false signal; the consumed client is
  `packages/trpc/src/generated/server.ts`.
- **Acceptance:** delete the file; remove it from `TARGETS` in `scripts/patch-trpc-transformer.mjs`
  (keep only `packages/trpc/src/generated/server.ts`).
- **Source:** ADR-0032 §7.

> **Corrigendum (RobotFarm pass, 2026-07-09):** The work order's premise — "zero importers" — was refuted on disk. The sole importer was `apps/api/src/index.ts` (a one-line orphaned re-export of `AppRouter` from the stale `server.ts`; `@rocky/api` has no `main`/`types`/`exports` and zero consumers). Both stale files were deleted. The patch script's `TARGETS` now contains only `packages/trpc/src/generated/server.ts`.
>
> **Discovery:** the *committed* `packages/trpc/src/generated/server.ts` (`HEAD`) itself violates ADR-0032's Definition-of-Done — it contains 70+ `Awaited<ReturnType<...>>` placeholders and absolute-path backend imports (`/home/goce/appz/rocky/apps/api/src/routers/*.router.js`), i.e. the exact `TS6059` symptom the ADR claims eradicated. The **working tree** holds a correct, ADR-0032-compliant regeneration (`.output()` schemas, `transformer: superjson`, 0 `ReturnType<`) that was produced by a prior `generate:trpc` run but never committed. This run's verification (`node scripts/patch-trpc-transformer.mjs`) merely completed that regeneration by injecting the transformer. **Action:** commit the regenerated client as its own change (see WO-090) and do not bundle it into WO-003.
>
> **Correction:** the `systemParameters` router *does* exist as `apps/api/src/routers/system-parameters.router.ts` (hyphenated filename) — the generated client is consistent; there is no missing-implementation anomaly. (The initial on-disk check used the wrong dotted filename and produced a false negative.)

---

## 2. Jurisdiction-Configurable Rule Engine (ADR-0030) — P0 epic

Resolves **B2** (no `SM_SYS_PARAMS`/RuleSet) and removes the hardcoded-threshold disease across
domains. ADR-0030 is _accepted as design_; the build below is the pending implementation.

### WO-010 — `ruleset` store + MK seed migration — P0

- Create the `ruleset` store; seed MK defaults from today's constants (`ORDER_INTERVAL_DAYS=120`,
  `MAX_ORDERS_PER_YEAR=4`, `MIN_VACCINATION_AGE_DAYS=30`, `slaughterMinAgeDays=25`,
  `stillbornThresholdDays=25`, `arrivalCorrectionDays=2`, `minMotherAgeMonths=17`,
  `calvingPeriodDays=365`, `selectionPercentage=10`, `DEFAULT_WEIGHTS` 0.3/0.3/0.2/0.2).
- **Source:** ADR-0030.
> **Corrigendum (RobotFarm pass, 2026-07-09):** Done. `RuleSet` gained `farmerCanAdminister: boolean`
> (default `true` when the `FARMER_CAN_ADMINISTER` param is absent; seeded `true` for MK in `SYSTEM_PARAM_DEFS`).
> `PolicyEngine` now injects `SystemService` (provided by `@Global AuthorizationModule` via the global
> `DatabaseProvider`) and, inside `evaluate()`, denies `FARMER`-role principals when the flag is `false`
> (vet/VD/admin still pass) — enforced for every farmer-facing router via `@Policy`. `PolicyResolver`
> is untouched. `@rocky/authorization` now depends on `@rocky/domains-system`.
> Build status: @rocky/domains-system, @rocky/authorization, apps/api all green.
> **Corrigendum (RobotFarm pass, 2026-07-09):** The "ruleset store" was discovered to **already exist** in the working tree as `sm.system_parameters` (`packages/database/src/schema/sm/modules.ts`), complemented by `modules` (feature flags → `RuleSet.features`, e.g. WO-060 IoT gate), `codeTables` (vocab/labels → `RuleSet.vocab`), and `businessRules` (`RuleSet` rules). A *new* `rulesets` table would be redundant bureaucratic fetishism. WO-010 therefore reduced to its real remaining work: **seeding the MK business-rule defaults** into `system_parameters` (groups `business`/`inspection`) — done in `seed.ts` (`SYSTEM_PARAM_DEFS`, idempotent `onConflictDoNothing`). The structured typed `RuleSet` resolver that domain services consume in WO-012 is the bridge still to build (see WO-011/WO-012).

### WO-011 — Algorithm-provider registry + check-digit provider — P0

- Pluggable provider model; check-digit lives in a provider so every export uses the active, valid
  algorithm (fixes B1 properly — no private formulas anywhere).
- **Source:** ADR-0030 §Decision, ADR-0024.
> **Corrigendum (RobotFarm pass, 2026-07-09):** Implemented. `packages/validators/src/utils/check-digit.ts` now exposes a `CheckDigitProvider` interface + `makeCheckDigitProvider` factory + `CHECK_DIGIT_PROVIDERS` registry (MK ear-tag `[3,5,7,11,13,17,19]` + `sum % 10`, and MK farm-id). `getCheckDigitProvider(name='MK')` is the single accessor. Legacy `calculateEarTagCheckDigit`/`validateEarTagCheckDigit`/`earTagSchema` are preserved (delegate to the MK provider) for backward compatibility. This removes every *private* check-digit formula and unblocks WO-001 (generateTakeoverFile must call the active provider).
>
> The typed **`RuleSet` resolver** was also built in the System domain (`packages/domains/system/src/rule-set.ts` + `SystemService.getRuleSet()`): it aggregates the seeded `system_parameters` (groups `business`/`inspection`) into a structured `RuleSet { jurisdiction, thresholds, weights }`. This is the bridge WO-012 consumes to replace hardcoded `DEFAULT_PARAMS`. `features`/`vocab`/`retention` dimensions are left for WO-014 / WO-060.

### WO-012 — Migrate hardcoded thresholds → RuleSet — P0 (B2)

- Wire `eartag`, `animal`, `movement`, `health`, `inspection` services to read from the active RuleSet
  instead of module-level constants.
- **Source:** ADR-0030, ADR-0023 (B2).
> **Corrigendum (RobotFarm pass, 2026-07-09):** Done. All five domain services now read the active
> RuleSet via injected `SystemService` (added `@rocky/domains-system` dep + constructor param + NestJS
> `app.module.ts` wiring for `AnimalService`, `EarTagService`, `MovementService`, `HealthService`,
> `RiskAnalysisService`). Hardcoded module constants removed and replaced with `thresholds.*` /
> `weights.*`: eartag `ORDER_INTERVAL_DAYS`/`MAX_ORDERS_PER_YEAR`; animal `minMotherAgeMonths`/
> `calvingPeriodDays`; movement `slaughterMinAgeDays`/`stillbornThresholdDays`/`arrivalCorrectionDays`;
> health `MIN_VACCINATION_AGE_DAYS`; inspection risk weights + `selectionPercentage` (was hardcoded `10`/
> `0.3/0.3/0.2/0.2`). `animal.service.test.ts` updated with a mock `getRuleSet()`.
> Build status: @rocky/domains-{eartag,animal,movement,health,inspection} + apps/api all green
> (`tsc -p tsconfig.build.json` excludes `*.test.ts`; remaining animal test type errors are
> pre-existing WIP fixture mismatches, unrelated to this change).

### WO-013 — `farmerCanAdminister` flag + `@Policy` — P1

- Add the per-jurisdiction administer flag and its `@Policy` enforcement.
- **Source:** ADR-0030.

### WO-014 — Retention + role vocab from RuleSet — P1

- Archive retention window and the subject-role vocabulary become overridable RuleSet entries
  (this is also where B3's `VI` role can be supplied per jurisdiction instead of a forced constant).
- **Source:** ADR-0030.
> **Corrigendum (RobotFarm pass, 2026-07-09):** Done. `RuleSet` gained `retention` (per-tier years
> cpc/vs/vi/bip, default 3), `roleVocab` (subject-role vocabulary), and `administerRoles` (overridable
> per jurisdiction; MK seeds `veterinarian`, enabling B3's `VI` role where applicable). Seeded
> `RETENTION_YEARS_*`, `ROLE_VOCAB`, `ADMINISTER_ROLES` in `SYSTEM_PARAM_DEFS`.
> `ArchiveService` injects `SystemService` and computes retention from `ruleSet.retention[tier]` for
> `archiveInspectionForm` (VI), `archiveSeizedPassport` (CPC), `archiveErrorCorrection` (CPC) — the
> hardcoded `+3` literals are gone. `HealthService.recordVaccination`/`recordTreatment` authorize against
> `ruleSet.administerRoles` instead of the fixed `SUBJECT_ROLE.VETERINARIAN`. `@rocky/domains-archive`
> now depends on `@rocky/domains-system`.
> Build status: @rocky/domains-system, @rocky/domains-archive, @rocky/domains-health, apps/api all green.

---

## 3. Domain Fixes & Hardening

### WO-020 — Health stock reconciliation — P2

- Job asserting `QUANTITY_RECEIVED == QUANTITY_REMAINING + doses_administered`.
- **Source:** ADR-0026 (Implementation), ADR-0023.

### WO-021 — Persist per-farm risk results — P2

- Add `risk_analysis_results` table (legacy `GN_ANLS_RESULTS` unique-key guarantee). Only a count is
  persisted today.
- **Source:** ADR-0028 (Deferred), ADR-0023.

### WO-022 — Enforce birth-notification deadlines — P2

- 7/20 d deadlines (`workflow.md` Instance 8). `calculateTaggingDeadline()` + status enum exist; **no
  service/cron yet**.
- **Source:** ADR-0028, ADR-0023 deferral register.

### WO-023 — Inspection weighted params → RuleSet — P1

- Move `DEFAULT_WEIGHTS` into RuleSet `GN_ANLS_PARAMS` (part of WO-012).
- **Source:** ADR-0028, ADR-0030.
> **Corrigendum (RobotFarm pass, 2026-07-09):** Completed as part of WO-012 — no separate code change needed.
> ADR-0028 §92 defers the legacy `GN_ANLS_PARAMS` table to ADR-0030, which folds the inspection weighted-
> analysis parameters into the `RuleSet`. `RiskAnalysisService.runAnalysis` already reads `RuleSet.weights`
> (`farmSize`/`history`/`species`/`region`) + `selectionPercentage`; the `DEFAULT_WEIGHTS` constant is removed.
> Those values are seeded as the `inspection`-group `system_parameters` (SELECTION_PERCENTAGE, FARM_SIZE_WEIGHT,
> HISTORY_WEIGHT, SPECIES_WEIGHT, REGION_WEIGHT). Build verified green in WO-012 (`@rocky/domains-inspection`, apps/api).

### WO-024 — Complete `FIELD_CHANGED` → VD lock — P3

- Event-driven approval exists; the field-diff pipeline (full `FIELD_CHANGED` → VD lock) is deferred.
- **Source:** ADR-0027 (Deferred).

### WO-025 — QR-code-scannable ear tags — P3

- Apply QR codes to ear-tag labels/documents; cross-references ADR-0009 §6.
- **Source:** ADR-0024 §E, ADR-0009 §6.

### WO-071 — Calving-gap divergence confirmation — P3

- Current `calvingPeriodDays=365` is stricter than legacy 120 d; recorded divergence, needs
  domain-owner confirmation (or RuleSet override via WO-012).
- **Source:** ADR-0025.

---

## 4. Testing & Observability (ADR-0020)

### WO-030 / WO-031 / WO-032 — Phase 1 (this sprint)

- `*.service.workflow.test.ts` per domain with a real state machine (ear tag order, inspection,
  correction) using Scenario B.
- `*.repository.rls.test.ts` per security-sensitive domain via Scenario C (real Postgres + RLS).
- Audit existing JSDoc: strip WHAT-tautologies, keep WHY-constraints.
> **Corrigendum (RobotFarm pass, 2026-07-09):** WO-030 progress — authored
> `packages/domains/eartag/src/services/eartag.service.workflow.test.ts` (pure unit test, Scenario B:
> mock repo + `EarTagOrderFactory` + `earTagOrderResponseSchema` re-parse; 6 tests green; full eartag
> suite 14 green). Authoring **surfaced a systemic latent bug**: the 8 order service methods
> (`getOrderById`, `createOrder`, `createDuplicateOrder`, `transitionOrderStatus`, `collectOrderTags`,
> `cancelOrder`, `cancelOrderItem`, `appendToOrder`) and their 8 tRPC endpoints parsed/returned
> `EarTagResponse` (ear-tag schema, `status: earTagStatusSchema`) for **order** records — so every
> successful order transition threw in production. Fixed: introduced `earTagOrderResponseSchema` +
> `EarTagOrderResponse` in `@rocky/validators/api` (over `earTagOrdersSelectSchema`, `status:
> orderStatusSchema`); repointed the 8 service methods + 8 router endpoints. `@rocky/validators`,
> `@rocky/domains-eartag`, `apps/api` build green. Remaining domains' `*.service.workflow.test.ts`
> pending (continue per-domain). Known gap: `assignSupplierContingent` still parses its `allocation`
> record with `earTagResponseSchema` (contingent-schema gap, not yet fixed).

### WO-033 / WO-034 — Phase 2 (next sprint)

- `*/e2e/*.test.ts` border tests (real Postgres RLS, document pipeline).
- Scaffold `@rocky/observability` with `withSpan`/`recordMetric`; implement `TraceStage`/`MetricsStage`
  bodies (stages defined in ADR-0003; ratified as target in ADR-0020).

### WO-035 / WO-036 — Phase 3 (ongoing)

- Retire manual `logger.*` in services in favor of span attributes.
- Business metrics emitted inside domain services/workers.

---

## 5. Validator Hardening (ADR-0018)

### WO-040 — `.strip()` → `.strict()` migration — P2

- Rejects unknown keys; compile-safe but needs a runtime smoke test before broad rollout.

### WO-041 — `.omit()` → `.pick()` migration — P2

- Prevents new DB columns leaking into the create API.

---

## 6. Deferred by Design / Future (tracked, not this sprint)

### WO-050 — PDF/A rendering + cryptographic seal — Future

- `packages/pdf` emits YAML/XML intermediates as the stable API; PDF/A is a future rendering concern.
- **Source:** ADR-0009 §4, ADR-0029.

### WO-060 — IoT `RuleSet.features.iot` gate — P3

- Keep IoT UI/routers behind the RuleSet flag; do not surface in default admin/mobile.
- **Source:** ADR-0031.

### WO-061 — IoT LPWAN QoS/SLA — Future

- Deduplication, late-arrival handling for lossy links.
- **Source:** ADR-0031 §D.

### WO-070 — Deferral register — Future

- AMR tracking, 10 km outbreak buffer zones, genetic lineage / performance profiling, blockchain
  provenance (`future.md`); `NotificationService.sendSMS()` outbox consumer (`ADR-0014`).
- **Source:** ADR-0023 deferral register, ADR-0014.

---

## RobotFarm Note

Per AGENTS.md, any change to an ADR's status (defect fixed, deferral promoted, new task discovered)
must trigger a RobotFarm pass: update the owning ADR **and** this work order so the two never diverge.
The closest owning doc for this list is `apps/docs/content/ADR/` (root of the business-rule subtree is
ADR-0023).
