# Plan — Closing Rocky ADR × Workorder Integration Seams (2026-07-20)

**Status:** Draft
**Date:** 2026-07-20
**Scope:** Engineering-ready integration seams only (producer built / consumer missing). Gov/legal/design-blocked items are tracked but NOT planned (see Excluded Scope).
**Authoritative map:** `.pi/plans/2026-07-20-adr-integration/scout-context.md`

---

## Executive Summary

The Rocky monorepo has ~14 open **integration** seams where an ADR's producer is built but the consumer is missing or partial. This plan closes the 8 engineering-ready workstreams and resolves 6 doc/ADR inconsistencies. The highest-leverage, lowest-risk wins come first: doc reconciliation (free, unblocks the guardian gates), then geo consumption (2 missing consumers), the single ART 19(4) guard, the IoT RuleSet gate, audit coverage extension, the observability scaffold, i18n, and finally the PDF verify loop (web `/verify` EmbedPDF port + mobile QR scan).

Three decisions are surfaced as **OPEN QUESTIONS** with a recommended default (not silently decided):

1. Whether Inspection should consult GeoService disease zones (recommend: Movement-only, leave Inspection out).
2. Whether `ExecutionEventEmitter` should be wired for telemetry or formally retired (recommend: retire-from-DoD, keep code).
3. i18n library choice (recommend: `next-intl` for web, `i18next` for mob; flagged for confirmation).

---

## Recommended Phase Order (leverage → risk)

| Phase | Workstream | Why this order |
|---|---|---|
| 1 | Doc/ADR reconciliation | Free fixes; unblock `check:adrs` / `check:md-links` and stop the documented inconsistencies from misleading implementers. |
| 2 | Geo consumption completion (ADR-0078) | Producer done; 2 consumers missing; high visibility, low risk. |
| 3 | Traceability ART 19(4) (ADR-0085) | One guard; registry + `makeEarTagSchema` already support it. |
| 4 | IoT RuleSet gate (WO-060) | `RuleSet` has no `features` field yet — small kernel change + 2 routers. |
| 5 | Audit coverage extension (WO-159 Part 4) | 5 domains share one identical pattern (mirror `FarmService`). |
| 6 | Observability scaffold (WO-034/035/036) | New package + pipeline wiring; riskier, isolated, no consumer-facing change. |
| 7 | i18n (WO-086, ADR-0040) | Touches both apps; session.language may need exposing first. |
| 8 | PDF verify loop (ADR-0082/0084) | Web reuse is trivial; mobile QR needs a native scanner lib. |

---

## Workstream 1 — Doc/ADR reconciliation (quick wins)

### 1.1 Re-label ADR-0007 as Superseded

- **What:** ADR-0007 header says `Status: Accepted` / `Supersedes: None`, but ADR-0012 explicitly "Supersedes ADR-0007". Audit is now realized via the transactional outbox (ADR-0012) + manual `AuditService` calls (WO-159), not the in-memory emitter ADR-0007 describes.
- **Files:** `apps/docs/content/ADR/0007-*.md` (header table). Set `Status: Superseded`, `Superseded: 0012 (for cross-process/business events; in-process telemetry emitter retained)`.
- **Deps:** none.
- **Acceptance:** `pnpm check:adrs` passes; ADR-0007 no longer listed as Accepted; index/back-links consistent.
- **Risk:** Low. Must follow ADR-0033 header-table format (guardian `check:adrs`).

### 1.2 Fix ADR-0064 `IotRepository` → `GeoService` text

- **What:** ADR-0064 body still says `IotRepository.findActiveDiseaseZonesNearFarm`; geo was extracted (ADR-0078) and the implemented code calls `GeoService.runDiseaseZoneCheck` / `GeoService.findActiveDiseaseZonesNearFarm`.
- **Files:** `apps/docs/content/ADR/0064-*.md` (the disease-zone block paragraph). Replace `IotRepository.findActiveDiseaseZonesNearFarm` with `GeoService.runDiseaseZoneCheck(fromFarmId, ruleSet)` (Movement) and `GeoService.findActiveDiseaseZonesNearFarm(farmId, radiusMeters)` where appropriate.
- **Deps:** none.
- **Acceptance:** No reference to `IotRepository` for disease zones; `check:md-links` + `check:adrs` green.
- **Risk:** Low (text only).

### 1.3 Reconcile ADR-0107 vs ADR-0082/0084

- **What:** ADR-0107 (PDF template system) is `Proposed`, yet ADR-0082/0084 implemented the PDF pipeline via Typst + `@e-invoice-eu`/`@cantoo/pdf-lib`, and the `DocumentTemplate` registry concept appears partially realized in `packages/pdf`. Status-vs-reality mismatch.
- **Files:** `apps/docs/content/ADR/0107-*.md`. Recommended resolution: mark ADR-0107 **Superseded by ADR-0082/0084** (the Typst render path shipped the registry pattern), keeping it Proposed-with-note only if a distinct template-catalog feature is still wanted.
- **Deps:** none.
- **Acceptance:** ADR-0107 status clarifies relationship to 0082/0084; no contradiction with `packages/pdf` reality.
- **Risk:** Low (doc). If the team wants the template catalog as a separate feature, convert to a fresh Proposed ADR, not a silent status flip.

### 1.4 Clarify WO-050 vs ADR-0082/0084 Phase-3

- **What:** Workorder row WO-050 status `In progress (ADR-0082)` while ADR-0082 is Accepted and generation/verify are implemented; the only remaining piece is ADR-0084 **Phase 3 PDF/A visual render**, which is explicitly deferred in the EXCLUDE list.
- **Files:** `apps/docs/content/workorder.md` (row 55 + §WO-050 commentary). Clarify: "WO-050 generation half Done; remaining = ADR-0084 Phase 3 visual render (deferred by design)".
- **Deps:** none.
- **Acceptance:** WO-050 row no longer conflates two ADRs' status; links to ADR-0084 Phase-3 deferred note.
- **Risk:** Low.

### 1.5 Implement-or-soften ADR-0078 dashboard geo-count claim

- **What:** ADR-0078 Consequence claims "Dashboard gains real geo counts" but `apps/web/app/(admin)/dashboard/page.tsx` has 0 geo references (verified).
- **Decision:** **Implement** the counts in Phase 2 (Workstream 2.2 below) rather than soften. If implementation is descoped, soften the ADR-0078 Consequence instead.
- **Files:** `apps/docs/content/ADR/0078-*.md` (Consequence) — update once 2.2 lands, or soften now.
- **Deps:** Workstream 2.2.
- **Acceptance:** ADR-0078 Consequence matches shipped behavior.
- **Risk:** Low.

---

## Workstream 2 — Geo consumption completion (ADR-0078)

### 2.1 Farm service queries holding boundaries via GeoService

- **What:** `FarmService` does not call `GeoService` for holding boundaries. Add a `getHoldingBoundary(farmId)` method that returns the farm's polygon/geometry from Geo.
- **Files:**
  - `packages/domains/farm/src/services/farm.service.ts` — add optional `geoService?: GeoService` ctor param (mirror `auditService` pattern); add `getHoldingBoundary(farmId)`.
  - `packages/domains/farm/src/index.ts` — re-export if needed.
  - `apps/api/src/app.module.ts` (~line 280) — `new FarmService(repo, auditService, undefined, geoService)`; add `GeoService` to `inject:`.
- **Deps:** `packages/geo` (`GeoService`), `GeoRouter` already registered (`apps/api/src/app.module.ts:583`).
- **Acceptance:** `FarmService.getHoldingBoundary(id)` returns the farm's geofence/polygon via `GeoService`; new unit test in `farm.service.*.test.ts`; `app.module` compiles.
- **Risk:** Low. GeoService is query-only; no RLS conflict.

### 2.2 Admin dashboard geo-count tiles

- **What:** `apps/web/app/(admin)/dashboard/page.tsx` gains two geo-count tiles: **active disease zones** and **open geofence events**.
- **Files:**
  - `packages/geo/src/services/geo.service.ts` + `repositories/geo.repository.ts` — add `countActiveDiseaseZones()` (count `geofences` where `fenceType = DISEASE_ZONE` and `isActive`) and `countOpenGeofenceEvents()` (count `animalGeofenceEvents` not yet acknowledged/closed; confirm the events table has an `acknowledgedAt`/`status` column in `packages/database/src/schema/geo/*` and key off it, else count all recent events within a window). Keep `listDiseaseZones` / `listGeofenceEvents` as the detail drill-down.
  - `apps/api/src/routers/geo.router.ts` — add `geo.countActiveDiseaseZones` and `geo.countOpenGeofenceEvents` queries (follow the existing `@Query` + `unwrap` pattern), export guillotine types.
  - `apps/web/components/dashboard/analytics.tsx` (`useDashboardData`) — add geo counts to the dashboard data hook (call `trpc.geo.*`).
  - `apps/web/app/(admin)/dashboard/page.tsx` — render two `Card`s with the counts, linking to `/geo`.
- **Deps:** Workstream 2.1 (GeoService available), `trpc.geo` already consumable.
- **Acceptance:** Dashboard shows non-zero/zero counts for active disease zones + open geofence events; tiles link to `/geo`; `check:types` + `biome` clean; manual browser verify.
- **Risk:** Medium-Low. "Open geofence events" semantics need a column check; if absent, define open = events in last N days (note in PR).

---

## Workstream 3 — Traceability ART 19(4) (ADR-0085)

### 3.1 Add the replacement-tag-on-move guard

- **What:** ART 19(4) "dual-code on replacement" is registered (`ART19_DUAL_CODE_ON_REPLACEMENT`) but not enforced end-to-end — there is no replacement-service method that blocks when both visual + electronic codes aren't recorded.
- **Files:**
  - `packages/domains/eartag/src/services/eartag.service.ts` — add `replaceTag(input: { orderId/animalId; newVisualCode; newElectronicCode; createdBy })` (or extend `createDuplicateOrder`) that, before persisting the replacement, reads the RuleSet, resolves `ART19_DUAL_CODE_ON_REPLACEMENT` via `TraceabilityRuleEngine.isEnabled(traceRules, "ART19_DUAL_CODE_ON_REPLACEMENT")`, and — when enabled and `requiresDualCodeRecording(visualCode, electronicCode, true)` is true — requires **both** `newVisualCode` and `newElectronicCode` to be present (throw `EARTAG_ERRORS.INVALID_INPUT` otherwise). Use `makeEarTagSchema(format)` (from `@rocky/validators/utils/check-digit`, format from `ruleSet.tag.format`) to validate the new codes.
  - `packages/validators/src/api/eartags.api.ts` — add a `replaceTagRequestSchema` (visual + electronic code fields).
  - `apps/api/src/routers/eartag.router.ts` — add `eartag.replaceTag` mutation; add `EARTAG_TRPC_ERROR_MAP` entry if a new error is introduced.
- **Deps:** `packages/domains/system` (`TraceabilityRuleEngine`, `requiresDualCodeRecording`), `packages/validators` (`makeEarTagSchema`), existing `EAR_TAG_ERRORS`.
- **Acceptance:** When `ART19_DUAL_CODE_ON_REPLACEMENT` enabled and visual≠electronic, `replaceTag` with only one code throws; with both passes. Unit test in `eartag.service.*.test.ts` covering enabled/disabled + dual/single. `check:types` clean.
- **Risk:** Low. Confined to eartag service; registry already supports the toggle.

---

## Workstream 4 — IoT RuleSet gate (WO-060)

### 4.1 Add `features` dimension to RuleSet

- **What:** `RuleSet` (in `rule-set.ts`) has **no** `features` field; WO-060 references `ruleSet.features.iot`. Add a `features` object sourced from the seeded `modules` table (`IOT` row `isActive`) / a `IOT_ENABLED` system parameter.
- **Files:**
  - `packages/domains/system/src/rule-set.ts` — add `features: { iot: boolean; ... }` to `RuleSet`; populate in `buildRuleSet` from `modules` (IOT `isActive`) or `IOT_ENABLED` param (default `true` to avoid breaking current behavior). Export `RuleSetFeatures` type.
  - Seed: `packages/database/src/seed.ts` — ensure the `IOT` module row `isActive` drives the flag (it already exists at line ~623).
- **Deps:** `modules` table already seeded.
- **Acceptance:** `buildRuleSet` yields `features.iot` boolean; unit test in `rule-set.test.ts`.
- **Risk:** Low. Backward-safe default `true`.

### 4.2 Add `feature` capability to the Policy engine

- **What:** `@Policy` metadata (`PolicyMetadata`) has no `feature` key; `PolicyEngine.evaluate` already loads the RuleSet.
- **Files:**
  - `packages/authorization/src/policies/policy.decorator.ts` — add `feature?: string` to `PolicyMetadata`.
  - `packages/authorization/src/policies/engine.ts` — in `evaluate`, after the `farmerCanAdminister` block, add: if `policy.feature` and `ruleSet` present, read `ruleSet.features[policy.feature]`; if falsy → `{ allowed: false, reason: "Feature <feature> disabled for this jurisdiction" }`.
  - `packages/authorization/src/policies/policy-engine.test.ts` — cover enabled/disabled.
- **Deps:** Workstream 4.1.
- **Acceptance:** `@Policy({ feature: "iot" })` denies when `features.iot=false`; allows when true. Tests green.
- **Risk:** Low.

### 4.3 Apply the gate to IoT routers + admin UI

- **What:** `IotRouter` and `DeviceRouter` have no `features.iot` check; admin IoT pages render unconditionally.
- **Files:**
  - `apps/api/src/routers/iot.router.ts` — add `@Policy({ authenticated: true, feature: "iot" })` (merge with existing class `@Policy`).
  - `apps/api/src/routers/device.router.ts` — same.
  - `apps/web/app/(admin)/iot/page.tsx`, `apps/web/app/(admin)/devices/**` — guard with a `useCan`/`clientCan` style check on `features.iot` (consume a `system.features` query or `modules`); render a disabled/"module off" state when off.
  - `packages/validators` / `packages/trpc` — expose `features` via the system router if not already (check `system.router.ts` / `system.getRuleSet` output).
- **Deps:** 4.1, 4.2.
- **Acceptance:** With `IOT_ENABLED=false`, IoT/device router calls return FORBIDDEN; admin IoT UI shows the off-state. `rbac.router.policy.test.ts`-style test added.
- **Risk:** Low-Medium. UI guard must source the flag reliably (session vs system query).

---

## Workstream 5 — Audit coverage extension (WO-159 Part 4)

Pattern to mirror: `FarmService` ctor takes `auditService?: AuditService` and calls `this.auditService?.recordCreate/update/delete(...)` at mutating points. All 5 services already use Result/`fromAsyncThrowable`, so wiring is identical.

### 5.1 Inspection service

- **Files:** `packages/domains/inspection/src/services/inspection.service.ts` (+ `risk-analysis.service.ts`) — add `auditService?` ctor param (after existing params: `repo, animalRepo?, archiveService?, riskAnalysisService?, auditService?`); record at `createInspection`, `updateInspection`/`completeInspection`/`cancelInspection`, and `runRiskAnalysis`. `apps/api/src/app.module.ts:373` — `new InspectionService(repo, animalRepo, archiveService, riskAnalysisService, auditService)` + add `AuditService` to `inject:`.
- **Acceptance:** Inspection CUD + risk-analysis emit audit rows; unit test asserts `recordCreate`/`recordUpdate` called; `app.module` compiles.

### 5.2 Correction service

- **Files:** `packages/domains/correction/src/services/correction.service.ts` — add `auditService?` (after `repo, archiveService?, passportService?`); record at `createCorrection`, `applyCorrection`. `apps/api/src/app.module.ts:405` — wire `AuditService` into `inject:`.
- **Acceptance:** Correction mutations audited; test asserts calls.

### 5.3 Notification service + subscription resolver

- **Files:** `packages/domains/notification/src/services/notification.service.ts` (+ `subscription-resolver.service.ts`, `channel-router.ts`) — add `auditService?` ctor param; record at `sendNotification`/`createNotification` and subscription create/delete. `apps/api/src/app.module.ts:326` — wire `AuditService`.
- **Acceptance:** Notification CUD audited; tests updated.

### 5.4 IoT service

- **Files:** `packages/domains/iot/src/services/iot.service.ts` — add `auditService?` ctor param; record at `registerDevice` (lifecycle). **Deliberately do NOT record per `ingestReading`/`ingestReadings`** (high-volume telemetry, not business mutations) — note this scoping in the PR. `apps/api/src/app.module.ts:416` — `new IotService(repo, auditService)` + `inject: [IotRepository, AuditService]`.
- **Acceptance:** Device registration audited; sensor ingest NOT audited; tests updated.

### 5.5 Archive service

- **Files:** `packages/domains/archive/src/services/archive.service.ts` — add `auditService?` (after `repo, system`); record at `archiveDocument` and `markDestroyed` (the daily-retention path). `apps/api/src/app.module.ts:383` — wire `AuditService`.
- **Acceptance:** Archive create + destroy audited; tests updated.

- **Deps (all 5):** `packages/domains-audit` (`AuditService`), existing DI factory pattern.
- **Risk:** Low. All follow `FarmService`. Watch for `AUDIT_ACTION` enum coverage of new `resource` strings.
- **Cross-cutting:** Add a single registry/table of "audited domains" assertion test so coverage regression is caught (mirror `permissions.drift.test.ts`).

---

## Workstream 6 — Observability scaffold (WO-034/035/036)

### 6.1 Scaffold `@rocky/observability`

- **What:** The package does not exist. Implement `TraceStage` + `MetricsStage` + span-attribute + business-metric helpers, OTel-compatible but degrading gracefully (no hard sink required for MVP).
- **Files (new):** `packages/observability/` (already covered by `pnpm-workspace.yaml` `packages/*`):
  - `package.json`, `tsconfig.json` (mirror a sibling package like `packages/execution`), `src/index.ts`.
  - `src/trace.stage.ts` — `TraceStage implements ExecutionStage`: wraps `next()` in a span (use `@opentelemetry/api` `tracer.startActiveSpan` if present; else a no-op span shim) carrying `operation`, `principal.id`, `resource` as span attributes; records duration + error status.
  - `src/metrics.stage.ts` — `MetricsStage implements ExecutionStage`: records timing + a business-metric counter via a small `BusinessMetrics` recorder (OTel metrics if available, else in-memory registry + dev console).
  - `src/attributes.ts` — helpers to convert domain Result/error into span attributes (replacing manual `logger.*` calls).
- **Deps:** `@opentelemetry/api` (check `catalog:`; if absent, add as optional/peer and degrade). Mirror code conventions (TS, `satisfies` on any Zod).
- **Acceptance:** `packages/observability` builds; `TraceStage`/`MetricsStage` run via `ExecutionPipeline`; unit test proves a span is opened/closed and a metric recorded.
- **Risk:** Medium. New package boundary; must satisfy `check:layers` (no forbidden imports into `@rocky/database` etc.). Keep it dependency-light.

### 6.2 Wire stages into `ExecutionPipeline`

- **What:** `ExecutionPipeline.run()` (in `packages/execution/src/execution-pipeline.ts`) declares Trace/Metrics stages in its doc comment but only composes `RLSStage` + `eventEmitter`. Add the two stages.
- **Files:** `packages/execution/src/execution-pipeline.ts` — extend ctor to accept `traceStage: TraceStage`, `metricsStage: MetricsStage`; wrap `handler` (inside `rlsStage.run`) with `traceStage` → `metricsStage`. `apps/api/src/app.module.ts` — provide `TraceStage`/`MetricsStage` and inject into `ExecutionPipeline`.
- **Acceptance:** Every pipelined request emits a span + metric; existing `eventEmitter` left intact (see OQ-2). No behavior change to business logic.
- **Risk:** Medium-Low.

### 6.3 Begin retiring manual `logger.*` → spans/metrics (pattern + first service)

- **What:** WO-034/035/036 — migrate at least one service as the reference pattern; do not boil the ocean.
- **Files:** Pick `packages/domains/movement/src/services/movement.service.ts` (highest-value, already pipeline-driven) — replace ad-hoc `logger.*` calls (if any) with span-attribute setters via the `ExecutionContext`/`cls` and emit one business metric (e.g. `movement.created`, `movement.blocked_disease_zone`). Document the pattern in `packages/observability/README` (or ADR follow-up).
- **Acceptance:** No `logger.*` left in the chosen service; spans carry the business context; a metric exists. `biome`/`check:types` clean.
- **Risk:** Low (one service).

---

## Workstream 7 — i18n (WO-086, ADR-0040)

### 7.1 Expose `language` in session

- **What:** Locale is tracked server-side (RuntimeBuilder / rls.stage), but `customSession` does not yet surface `language` and no `session.language` field was found on the user schema. Confirm and expose it.
- **Files:** `apps/api/src/auth/auth.ts` (`customSession` enrichment) — add `language` from the user preference (add a `language` column to the user/session schema in `packages/database/src/schema/auth/*` if absent, default `EN`). `packages/auth/src/better-auth.ts` — ensure the session type carries `language`.
- **Acceptance:** `useSession().data.user.language` available on web; mobile `authClient` exposes it.
- **Risk:** Medium. Schema migration may be required (follow `packages/database` migration workflow).

### 7.2 Web i18n layer (next-intl)

- **What:** Centralize hardcoded strings; consume `session.language`; set `<html dir>` for RTL.
- **Files:** `apps/web/` — add `next-intl` (recommend), `messages/en.json` (+ `mk.json` stub), `i18n/` config, wrap root layout with `NextIntlClientProvider`, set `dir` from locale; replace hardcoded UI strings in `dashboard/page.tsx` and a first route as the pattern.
- **Acceptance:** Strings resolved from `messages/*`; switching `session.language` flips copy + `dir`.
- **Risk:** Medium. Layout rewiring; do one route first.

### 7.3 Mobile i18n layer (i18next)

- **What:** Mirror on `apps/mob` with `i18next` + `react-i18next` (recommend), consuming the mobile session language.
- **Files:** `apps/mob/` — add `i18next`, `lib/i18n.ts`, `locales/en.json` (+ `mk.json`), wrap app; replace hardcoded strings in one screen as the pattern.
- **Acceptance:** Mobile copy switches with session language; `dir` set where relevant.
- **Risk:** Medium.

---

## Workstream 8 — PDF verify loop (ADR-0082/0084)

### 8.1 Port EmbedPDF viewer to `/verify` (web)

- **What:** `/documents` has the EmbedPDF `DropInViewer`; `/verify` only has the raw QR/credential paste form. Reuse the viewer on `/verify` so a verified document renders inline.
- **Files:** `apps/web/components/pdf/drop-in-viewer.tsx` (already exists) — mount it in `apps/web/app/(admin)/verify/page.tsx` after a successful `document.verify` (render the PDF bytes from `document.status`/content, or fetch via `document.get` using the verified `refId`). Keep the existing PAdES signature card above the viewer (per WO-163 pattern).
- **Deps:** `trpc.document.*` already implemented (`document.verify`, `document.credential`, `document.statusList`).
- **Acceptance:** After verify, the PDF renders in-browser with print/download; `next/dynamic({ ssr:false })` used (per WO-163). `biome`/`check:types` clean; browser verify.
- **Risk:** Low (reuse).

### 8.2 Mobile QR-scan → `document.verifyCredential`

- **What:** Mobile never consumes the verify loop. Add a QR-scan screen that calls `document.verifyCredential` offline against the pinned key (module is RN-safe — `verifyCredential` exported from `@rocky/pdf`).
- **Files:**
  - `apps/mob/` — add a native QR scanner (recommend `expo-camera` barcode scanning or `react-native-vision-camera`; confirm availability) on a new screen `app/(tabs)/verify.tsx` (or `app/verify.tsx`).
  - Scan → `trpc.document.verifyCredential.query({ qr })`; render the `CredentialVerifyView` result (valid/expired, subject, farm, kid, dates) reusing `@rocky/pdf`'s `CredentialVerifyView` type. Surface the status-list stale warning (mirror web `statusList` query).
- **Deps:** `@rocky/pdf` `verifyCredential` + `CredentialService` (RN-safe, confirmed exported), `trpc.document.verifyCredential` already present; a QR scanner lib (NEW dependency — flag in PR).
- **Acceptance:** Scanning a Rocky signed-QR credential on mobile returns the same verify result as web; offline path uses pinned key; status-list freshness surfaced.
- **Risk:** Medium. New native dependency; offline key pinning must reuse the web's pinned public key.

---

## OPEN QUESTIONS (decisions surfaced, not silently made)

- **OQ-1 — Inspection geo consumption.** Should `inspection.service.ts` consult `GeoService` disease zones, or is disease-zone gating Movement-only by design? **Recommended default: Movement-only for now; leave Inspection out of scope** (Phase 2 does NOT add geo to Inspection). Rationale: the ADR-0064 spatial block is implemented in Movement; Inspection risk/on-spot logic has no disease-zone dependency today. Revisit only if a future requirement ties inspection selection to zones.
- **OQ-2 — `ExecutionEventEmitter` fate.** Wire it for genuine lifecycle telemetry, or formally retire it (superseded by the outbox, ADR-0012)? **Recommended default: retire-from-DoD — keep the code and the existing `emit()` calls (they are no-op without listeners), but do NOT build telemetry on top of it.** Document the retirement in the ADR-0007 update (1.1) and ADR-0003. Telemetry goes through `TraceStage`/`MetricsStage` (Workstream 6).
- **OQ-3 — i18n library choice.** Which library per surface? **Recommended default: `next-intl` for web (Next.js-native, RTL/`dir` support), `i18next` + `react-i18next` for mob (expo-friendly).** Flagged for confirmation because it is a long-lived dependency decision; if the team prefers a single lib, `i18next` can serve both, but `next-intl` is the more idiomatic web choice.

---

## Excluded Scope (tracked, NOT planned)

- **WO-124…142** accept-and-flag (gov ratification) — blocked on ADR-0081.
- **WO-133…141** GDPR (legal) — blocked on ADR-0061.
- **10 Proposed ADRs** (0061/0065/0071/0073/0074/0081/0093/0106/0107/0109) — design/legal authorization.
- **Deferred by design:** WO-061/070, audit native RANGE partitioning, ADR-0084 Phase-3 visual render, ADR-0087 Phase-0 GLN backfill, WO-024 FIELD_CHANGED→VD lock, WO-025 QR ear-tag labels, WO-097 IoT admin parity (`device.recordSync`), WO-161 geo geometry helpers — noted as separate seams; not in this sprint.

---

## RobotFarm / Guardian compliance

- ADR edits (1.1–1.5) must satisfy `check:adrs` (ADR-0033 header format) and `check:md-links`.
- New package `@rocky/observability` must satisfy `check:layers` (no forbidden imports into `@rocky/database`/`@rocky/events`/`@rocky/validators/api+events`) and `check:shadcn` (no dup UI primitives).
- `ci:checks` (`generate:trpc` → guardians → `test`) must pass; run `pnpm build` before declaring done (build-rot is invisible to `ci:checks`).
- Update the owning `AGENTS.md` for any package whose purpose/contract changes (e.g. `packages/execution` for the pipeline stages, `packages/authorization` for the `feature` policy, `packages/domains/system` for `features`).
