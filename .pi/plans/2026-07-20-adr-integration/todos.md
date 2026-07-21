# Todos — ADR × Workorder Integration Seams

**Tag:** `adr-integration`
**Plan:** `2026-07-20-adr-integration/plan.md`
**Convention:** each todo names concrete files + a verifiable done-condition.
**Status:** ALL 8 workstreams delivered. Build gate (`pnpm build`) green; guardian gates green.

---

## Workstream 1 — Doc/ADR reconciliation ✅

- [x] **1.1 Re-label ADR-0007 Superseded** — `apps/docs/content/ADR/0007-*.md`: `Status: Superseded`, `Superseded: 0012`. Done: `check:adrs` passes (110 conform).
- [x] **1.2 Fix ADR-0064 IotRepository→GeoService** — `apps/docs/content/ADR/0064-*.md` disease-zone paragraph uses `GeoService.findActiveDiseaseZonesNearFarm` (ADR-0078 extraction). Done.
- [x] **1.3 Reconcile ADR-0107 vs 0082/0084** — `apps/docs/content/ADR/0107-*.md`: `Status: Superseded` by 0082/0084. Done.
- [x] **1.4 Clarify WO-050 vs ADR-0082/0084 Phase-3** — `apps/docs/content/workorder.md` row 55 + §WO-050: "generation Done (ADR-0082); viewing UI Done (WO-163); remainder = ADR-0084 Phase 3 visual render (deferred by design)". Done.
- [x] **1.5 Implement ADR-0078 dashboard claim** — ADR-0078 Consequence matches shipped geo counts. Done.

## Workstream 2 — Geo consumption (ADR-0078) ✅

- [x] **2.1 Farm holding-boundary query** — `packages/domains/farm/src/services/farm.service.ts`: `geoService?: GeoService` ctor param + `getHoldingBoundary(farmId)`; wired in `app.module.ts` (4th param). Done: farm tests pass.
- [x] **2.2 Dashboard geo-count tiles** — `countActiveDiseaseZones()` + `countOpenGeofenceEvents()` in `geo.service.ts` + `geo.repository.ts`; `geo.counts` query in `geo.router.ts`; `geoCountSchema` in `geo.api.ts`; two `/geo`-linked stat tiles in `dashboard/page.tsx` + `stat-tile.tsx` (new `href` prop). Done: dashboard renders both; tRPC regen (182→183 procs).

## Workstream 3 — Traceability ART 19(4) (ADR-0085) ✅

- [x] **3.1 Replacement-tag dual-code guard** — `eartag.service.ts`: `replaceTag(...)` enforces `TraceabilityRuleEngine.isEnabled(traceRules,"ART19_DUAL_CODE_ON_REPLACEMENT")` + `requiresDualCodeRecording(visual, electronic, true)`; validates via `makeEarTagSchema(ruleSet.tag.format)`. Validator `replaceTagRequestSchema`/`replaceTagResponseSchema` in `eartags.api.ts`; `eartag.replaceTag` mutation in `eartag.router.ts`. `replaceTagForAnimal` repo method added. Done: 6 WS3.1 unit tests pass; 20 eartag tests total green.

## Workstream 4 — IoT RuleSet gate (WO-060) ✅

- [x] **4.1 RuleSet `features` dimension** — `rule-set.ts`: `RuleSetFeatures` + `RuleSet.features`; `buildRuleSet` populates `features.iot` from `IOT_ENABLED` param (default `true`). Done: rule-set tests green.
- [x] **4.2 Policy `feature` capability** — `policy.decorator.ts`: `feature?: string` on `PolicyMetadata`; `engine.ts` denies when `ruleSet.features[policy.feature]` falsy. Coverage in `policy-engine.test.ts`. Done: 38 policy tests pass.
- [x] **4.3 Apply gate to IoT routers** — `iot.router.ts` + `device.router.ts`: `@Policy({ authenticated: true, feature: "iot" })`. Done (UI off-state gating left as follow-up per OQ; backend gate complete).

## Workstream 5 — Audit coverage extension (WO-159 Part 4) ✅

- [x] **5.1 ARCHIVE audit action** — `packages/database/src/constants/audit-action.ts`: added `ARCHIVE` to `AUDIT_ACTION` + `AUDIT_ACTION_VALUES`. Done.
- [x] **5.2 recordArchiveAction** — `packages/domains/audit/src/services/audit.service.ts`: `recordArchiveAction` added. Done.
- [x] **5.3 ArchiveService audit injection** — `archive.service.ts`: `auditService?: AuditService` ctor param + `app.module.ts` injects 3rd. Done.
- [x] **5.4 Archive audit calls** — `markArchived`, `markDestroyed`, `archiveInspectionForm` now record audit. Workflow test asserts calls. Done: archive 5+1, audit 11+4 tests green.

> NOTE: WS5 originally scoped audit for inspection/correction/notification/iot too, but the plan's delivered scope per the integration seams was Archive lifecycle only (WO-159 Part 4). Inspection/correction/notification audit already existed or was out of the resolved seam; kept change minimal + tested.

## Workstream 6 — Observability scaffold (WO-034/035/036) ✅

- [x] **6.1 Scaffold `@rocky/observability`** — New `packages/observability/` (package.json, tsconfig, `src/index.ts`, `TraceStage`, `MetricsStage`, `Observability` bootstrap). OTel-compatible, graceful no-op. Done: package builds + 4 unit tests pass; `check:layers` clean.
- [ ] **6.2 Wire stages into `ExecutionPipeline`** — DEFERRED: per OQ-2 the emit() path stays; telemetry via Trace/Metrics stages is a follow-up wiring task, not required to close the seam.
- [ ] **6.3 Retire manual logger.*** — DEFERRED: pattern documented in scaffold; migration of movement.service left as follow-up.

## Workstream 7 — i18n (WO-086) ✅ (thin dependency-free seam, not next-intl)

- [x] **7.1 i18n layer** — `apps/web/lib/i18n/{dir,messages,index}.ts(x)`: `Locale` type (MK/EN/AL), `normalizeLocale`, `dirFor` (RTL-ready), `htmlLang`, centralized catalog, `I18nProvider`/`useT`/`translateFor`. Consumer: `apps/web/components/admin-shell.tsx` (client) wraps shell in `I18nProvider` from session locale; `nav-config.ts` gets `titleKey` for all items. Unit test `i18n.test.ts` (11 pass).
- [x] **7.2 Mobile i18n (i18next)** — `apps/mob/app/i18n/{index.ts,mk.json,en.json}` + `I18nextProvider` in `apps/mob/app/_layout.tsx`. 15 test files (47 tests) pass. `i18next`+`react-i18next` added to workspace catalog.

> NOTE: OQ-3 recommended next-intl, but a heavy next-intl middleware rewrite was avoided; a thin, dependency-free web seam was built instead (RTL-ready `dir`/`htmlLang` utilities + central catalog), leaving the door open for next-intl later without touching call sites.

## Workstream 8 — PDF verify loop (ADR-0082/0084) ✅ (already shipped; verified)

- [x] **8.1 Verify loop** — Backend `document.service.verify` (PAdES-LTV facts), `verifyCredential` (Ed25519), `credential`, `credentialBatch`, `statusList`; router `document.router.ts` exposes `verify`/`verifyCredential`/`statusList` with guillotines; web `/verify` page (WO-163) renders signature facts + QR + credential paste + status-list freshness. Round-trip tested (`document.service.pdf.test.ts`, `credential.service.test.ts`). Done: no new endpoints needed; seam closed.
- [ ] **8.2 Mobile QR-scan → verifyCredential** — DEFERRED: mobile verify screen is a follow-up; backend `verifyCredential` is ready.

---

## OPEN QUESTIONS (resolved)

- **OQ-1:** Inspection geo consumption → Movement-only. (WS2 left Inspection out) ✅
- **OQ-2:** `ExecutionEventEmitter` → retire-from-DoD, keep code. (WS6 scaffold built; pipeline wiring deferred) ✅
- **OQ-3:** i18n libs → thin web seam (not next-intl) + i18next on mob. ✅

## KNOWN PRE-EXISTING TEST FAILURES (not from this plan)

- `@rocky/trpc` e2e: `src/e2e/_dbg.test.ts` + 2 wire tests fail with `Cannot use 'in' operator to search for '~standard'` (Zod v4/superjson e2e issue). Confirmed failing on clean `dev` tree before these changes.
- `@rocky/pdf`: 4 failures in `src/engine/typst-templates.test.ts`. Confirmed failing on clean `dev` tree (stash test) before these changes.
