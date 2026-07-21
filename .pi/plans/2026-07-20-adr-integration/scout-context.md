# Pending Integration Surface — Rocky ADRs × Workorder

_Scout report for planner use. Focus: cross-package INTEGRATION seams, not isolated features._
_Repo: /home/goce/appz/rocky · ADRs: apps/docs/content/ADR/*.md (110 substantive + ADR-TEMPLATE + INDEX) · Workorder: apps/docs/content/workorder.md_

---

## Executive Summary

- **ADR pool:** 100 **Accepted** · 10 **Proposed** · **0** Draft / Superseded / Rejected (per header `Status` tables).
- **The 10 Proposed ADRs are NOT engineering-ready** — they are blocked on gov/legal/design authorization
  or are design-only standards (ADR-0061 GDPR, 0065 mobile-regulatory-gating, 0071 envelope-encryption,
  0073 mobile-edge-PII, 0074 field-edge-PII, 0081 accept-and-flag, 0093 dual-dashboards, 0106 state-vet,
  0107 pdf-template-system, 0109 design-md-theme). Several carry implementation that contradicts their own
  body (see Inconsistencies).
- **Workorder master list:** ~60 rows. The bulk of WO-001…WO-163 are **Done ✅ / Done**. The open integration
  surface that remains is concentrated in: (a) **observability / execution-pipeline stages** (WO-034/035/036,
  @rocky/observability never built); (b) **geo consumption gaps** (Farm + admin dashboard do not yet query
  `packages/geo`, although Movement does); (c) **traceability ART 19(4)** registered-but-unenforced; (d) the
  **/verify EmbedPDF viewer** (slated, not yet done); (e) **i18n** (WO-086), **IoT RuleSet gate** (WO-060),
  **IoT admin parity** (WO-097), **geo geometry helpers** (WO-161), **QR ear-tag labels** (WO-025),
  **FIELD_CHANGED→VD lock** (WO-024); and (f) the **gov/legal acceptance-and-flag + GDPR** open-question blocks.
- **Net count:** ~14 open integration seams (producer built, consumer missing or partial) + ~19 blocked gov/legal
  items + ~6 design-deferred + a handful of ADR-vs-doc inconsistencies.

---

## Table of PENDING INTEGRATION ITEMS

| ID / ADR | What's described (Accepted) | Producer (built) | Missing consumer / wiring | What's needed | Dependencies | Blocked-by |
|---|---|---|---|---|---|---|
| **ADR-0078** (geo extract) | `packages/geo` `GeoService` + `geo.router.ts`; Movement/Inspection/Farm/dashboard all query geo | `packages/geo` ✅, `GeoRouter` registered ✅, web `/geo` page consumes `trpc.geo.*` ✅ | **Farm** services do NOT call `GeoService` for holding boundaries; **admin dashboard** does NOT show geo counts (active disease zones / open geofence events) — only `/geo/page.tsx` does | Farm service `holdingBoundaries` query via `GeoService`; add geo-count tiles to `apps/web/app/(admin)/dashboard/page.tsx` | ADR-0053, ADR-0064 | none (eng-ready) |
| **ADR-0078 / ADR-0064** | Inspection queries disease zones / geofences via geo | `GeoService.findActiveDiseaseZonesByFarm` + `runDiseaseZoneCheck` exist; Movement consumes them ✅ | **Inspection** domain does NOT import `@rocky/geo`/`GeoService` (no match in `packages/domains/inspection/src`); disease-zone gating lives only in Movement | Decide whether Inspection risk/on-spot logic should consult geo disease zones (or is Movement-only by design); if yes, wire `GeoService` into `inspection.service.ts` | ADR-0064 | design decision |
| **ADR-0085** (traceability engine) | Four Article rules toggleable registry; Movement `create` consults engine | `traceability-rules.ts` ✅; ART13_TAG_BEFORE_MOVE + ART3_TRANSMISSION_WINDOW enforced in `movement.service.ts` ✅ (tests green) | **ART 19(4)** "registered but not yet enforced end-to-end (no replacement service method)" — replacement-tag-on-move not blocked | Add replacement-method guard in Movement / makeEarTagSchema per ART19(4) | ADR-0018 `makeEarTagSchema`, ADR-0084 | none (eng-ready) |
| **ADR-0082 / ADR-0084** (PDF/A + PAdES + signed QR) | `document.generate` renders PDF/A-3 + PAdES; `document.verify` + `document.credential` + `document.statusList`; `/documents` inline EmbedPDF viewer; `/verify` page | `/documents` EmbedPDF viewer Done (WO-163); `document.verify`/`credential`/`statusList` tRPC ✅; web `/verify` accepts raw QR ✅; status-list publisher ✅ | **EmbedPDF viewer slated for `/verify`** (only `/documents` has it today); **mobile** never consumes the verify loop / signed-QR scan (no `document.verify`/`credential` call on `apps/mob`); `/verify` "status list last synced" UI is the only status surface | Port EmbedPDF to `/verify`; add a mobile QR-scan→`document.verifyCredential` flow (reuses `@rocky/pdf` `verifyCredential`, already RN-safe); surface status-list stale-warning on mobile | ADR-0079, ADR-0063, ADR-0086/0087 | none (eng-ready for web; mobile needs native QR) |
| **ADR-0003 / WO-034/035/036** (execution pipeline observability) | `ExecutionPipeline` composable stages; `@rocky/observability` `TraceStage`/`MetricsStage`; retire manual `logger.*` → span attrs; business metrics in services | `ExecutionPipeline` + `RLSStage` + `ExecutionEventEmitter` exist in `packages/execution` ✅ | **`@rocky/observability` package does NOT exist** (no `TraceStage`/`MetricsStage` built); services still call `logger.*`; no span attrs / business metrics emitted | Scaffold `@rocky/observability`; implement `TraceStage`/`MetricsStage`; wire into pipeline; migrate services (WO-034/035/036) | ADR-0003 | none (eng-ready) |
| **ADR-0003 / `ExecutionEventEmitter`** | `ExecutionEventEmitter` emits lifecycle events (audit) | `event-emitter.ts` defined ✅ | **Not consumed by any application code** — only referenced in ADRs/docs; audit is done by manual `AuditService.recordCreate/Update/Delete` (WO-159), not via the emitter | Either wire `ExecutionEventEmitter` for genuine lifecycle telemetry, or formally retire it (superseded by outbox, ADR-0012) | ADR-0012 | design decision |
| **ADR-0007** (audit via lifecycle events) — _stale status_ | Audit via in-memory event emitter | Superseded by **ADR-0012** (transactional outbox) which cites ADR-0007's failures | Header still says **Accepted** / "Supersedes: None" though body of ADR-0012 says "Supersedes ADR-0007" | Re-label ADR-0007 **Superseded**; audit now realized via outbox (ADR-0012) + manual service calls (WO-159) | ADR-0012 | doc-only |
| **WO-159 Part 4** (audit CUD coverage) | Every mutating path records audit | Wired into farm/subject/animal/passport/movement/health/eartag ✅ | **inspection / correction / notification / iot / archive** services do NOT call `AuditService` (0 matches) — coverage partial | Extend `recordCreate/Update/Delete` to remaining mutating domains | ADR-0007/0012, audit domain | none |
| **WO-060** (IoT RuleSet gate) | Keep IoT UI + routers behind `RuleSet.features.iot` | `RuleSet.features` exists; `modules` feature flags seeded | **No gating code** in `apps/web` or `apps/api/src/routers` referencing `features.iot` (0 matches) — IoT surfaces render unconditionally | Add `@Policy`/UI guard consulting `ruleSet.features.iot` in IoT routers + admin pages | ADR-0031, ADR-0030 | none |
| **WO-086** (i18n, ADR-0040) | Backend tracks locale (`RuntimeBuilder`/`rls.stage`/`customSession`); frontend consumes `session.language` | Locale fully tracked server-side ✅ | **No i18n library** in `apps/web` or `apps/mob` (0 matches for i18n/i18next/next-intl); strings hardcoded; no `dir`/RTL | Add per-surface i18n layer consuming `session.language`; centralize strings; set `dir` | ADR-0040 | none |
| **WO-097** (IoT admin parity, ADR-0047) | Bind web devices/IoT admin forms to Diamond Seal; wire mobile sync→`device.recordSync` | Admin pages exist (web-only by design) | **Open** — forms not yet bound to `zodResolver`; `device.recordSync` heartbeat not wired | Extend ADR-0038 zodResolver to IoT/devices forms; implement `recordSync` heartbeat | ADR-0038, ADR-0047 | none |
| **WO-161** (geo geometry helpers) | Relocate geometry helpers to `packages/geo` (Visa-Matrix Annex C closure) | — | **Open** (2026-07-17) — helpers still in source domain(s) | Move geometry helpers into `packages/geo`; update importers | ROCKY-DS 001:2026(E) Annex C | none |
| **WO-025** (QR ear tags, ADR-0024 §E / 0009 §6) | Scannable QR on ear-tag labels/documents | Signed-QR credential infra exists (ADR-0084 ear-tag credential ✅) | **Open** — no label/print/scan consumer binding the credential to physical ear-tag media | Generate/print QR-bearing ear-tag doc; optional mobile scan→verify | ADR-0084, ADR-0009 §6 | none |
| **WO-024** (FIELD_CHANGED→VD lock, ADR-0027) | Event-driven VD approval lock on `FIELD_CHANGED` | Event approval mechanism exists | **Open** (P3) — full field-diff pipeline (FIELD_CHANGED→VD lock) deferred | Build field-diff pipeline + VD approval lock | ADR-0027 | none |
| **ADR-0064 / ADR-0078** (text inconsistency) | Movement disease-zone block uses geo | `movement.service.ts` calls `geoService.runDiseaseZoneCheck` ✅ | ADR-0064 body still says `IotRepository.findActiveDiseaseZonesNearFarm` (pre-extraction name) | Update ADR-0064 text to reference `GeoService` | ADR-0078 | doc-only |

---

## BLOCKED — gov / legal / design-ratification (NOT engineering-ready)

These are **not** build tasks until an external answer lands. Extracted from the workorder's dedicated blocks.

**ADR-0081 — Accept-and-flag validation doctrine (Proposed; implementation pending ratification — NO validator/DB mutation yet):**

- **WO-124** Ratify Tier-1 invariant set (dead/slaughtered cannot move + seizure lock) — blocks any hard-reject. _Open · answer pending (gov)_
- **WO-125** Off-system-buyer disease-control trace: design seller-query step (legally required). _Open · pending design_
- **WO-126** Suspicious-eartag "notify someone" procedure (responsible party/channel). _Open · TBD_
- **WO-127** Enforce 8-hour live→slaughterhouse transport window (flag on exceed). _Open_
- **WO-128** Slaughterhouse tag-return obligation tracking. _Open_
- **WO-129** Vet processes lost/destroyed eartag (required procedure). _Open_
- **WO-130** Movement validator: nullable `toFarmId` + external counterparty (`buyerName`/`buyerExternalRef`). _Open · pending ratification_
- **WO-131** Carcass/meat tracking scope. _Open · TBD_
- **WO-132** EarTag takeover file: user-supplied `takeoverId` vs derive-from-order. _Open_
- **WO-142** Compliance-option visibility/permission model (`sm:compliance:write`, `pii:read` — the latter **not yet in catalog**, Phase 2). _Open · modeled as permission-gated_

**ADR-0061 — GDPR right-to-be-forgotten (Proposed; answers pending expert/legal):**

- **WO-133** GDPR applicability scope (non-GDPR markets). _P0 · answer pending (legal)_
- **WO-134** Enumerate MK national acts → `gdpr.overrides[]`. _P1 · pending legal input_
- **WO-135** DSAR identity verification. _P1 · Open_
- **WO-136** Break-glass emergency PII access. _P1 · Open_
- **WO-137** Signing-key custody/continuous verification (Ed25519) — best-practice, NOT law. _P2 · Open_
- **WO-138** Pseudonym rotation on erasure. _P2 · Open_
- **WO-139** Erasure ≠ deletion (crypto-shred DEK). _P2 · Open_
- **WO-140** GDPR consent-fantasy / graceful degradation. _P1 · answer pending (realism)_
- **WO-141** GDPR (law) vs ISO 27701 (voluntary) — do not architect mandatory ISO compliance. _P1 · Open_

**Other design-only Proposed ADRs (no implementation expected until authorized):**

- **ADR-0065** Mobile regulatory gating (Proposed) — design counterpart to client permission gating.
- **ADR-0071** Cryptography-at-rest / off-server envelope encryption (Proposed) — deferred to end-of-program per 2026-07-11 directive.
- **ADR-0073 / 0074** Mobile-edge / field-edge PII compliance (Proposed) — edge PII minimization doctrine.
- **ADR-0093** Dual dashboards vet-vs-epidemiologist (Proposed) — design spec only; not built.
- **ADR-0106** State-vet capability (Proposed) — capability matrix, not engineered.
- **ADR-0107** PDF template system (Proposed) — superseded in practice by ADR-0082 Typst render path (see Inconsistencies).
- **ADR-0109** design-md theme workflow (Proposed) — tooling standards.

---

## DEFERRED — by design (tracked, not this sprint)

| WO | Item | ADR | Note |
|---|---|---|---|
| WO-061 | IoT LPWAN QoS/SLA (dedup, late-arrival) | 0031 §D | Future |
| WO-070 | Deferral register: AMR, 10 km outbreak buffer, genetic lineage, blockchain, notification SMS outbox consumer | 0023 / 0014 | Future |
| WO-024 | `FIELD_CHANGED`→VD lock field-diff pipeline | 0027 | Deferred (also listed above as open seam) |
| WO-034/035/036 | Observability / logger→spans / business metrics | 0003 / 0020 | Deferred to next sprint (also open seam) |
| Audit partitioning | Native RANGE partitioning of `audit_log` | WO-159 Part 3 | Deferred — 7y prune already meets bar |
| ADR-0084 Phase 3 | PDF/A **visual** render (Typst) on-document — currently only PAdES seal + QR done | 0082 / 0084 | "Not yet done (Phase 3)" |
| ADR-0087 Phase 0 | Real GS1 company-prefix allocation + per-holding/operator GLN backfill (interim derivation in place) | 0087 | Data task, deferred to backlog |

---

## Key cross-ADR dependency chains (partially implemented)

1. **ADR-0082 → ADR-0084 → ADR-0063 / ADR-0086 / ADR-0087** (PDF/A + PAdES + signed-QR + EUDR + ESPR DPP + GS1 GLN).
   - ADR-0082 (signing engine): **implemented** (Typst render + PDF/A-3 + PAdES + verify loop).
   - ADR-0084 (credential): **Phase 0+1+2 done** (sign/verify, `document.credential`/`verifyCredential`, on-document QR, ear-tag credential, status-list publisher, EUDR DDS reference). **Phase 3 (PDF/A visual render) NOT done.**
   - ADR-0086 (ESPR DPP): **Accepted**, build done via WO-155 Phase 2.
   - ADR-0087 (GS1 GLN): **Accepted**; Phase 0 (real prefix allocation + backfill) deferred data task. Cattle are explicitly out-of-scope (Art 1(2)(e)) — feeder readiness only.
   - **Seam:** web `/verify` EmbedPDF viewer slated; mobile verify-loop unconsumed.

2. **ADR-0078 → ADR-0053 / ADR-0064 / ADR-0080** (geo extraction → PostGIS foundation → disease-zone block → disease-zone data collection).
   - ADR-0078: **implemented** (package, router, web `/geo` page).
   - ADR-0053 (INSPIRE/PostGIS/LPIS): foundation referenced; `geofences.polygon` (PostGIS) + `farms.location` delivered (WO-109/110).
   - ADR-0064 (disease-zone spatial block): **implemented** in Movement via `GeoService.runDiseaseZoneCheck` (text still says `IotRepository` — stale).
   - ADR-0080 (disease-zone **data collection** / declaration workflow): the _declaration mechanism_ (`declareDiseaseZone` service + router mutation exist) but **no seeding/population workflow** — zones are empty until manually declared; consumers Farm + dashboard not wired.

3. **ADR-0030 (RuleSet) → ADR-0085 (traceability) / ADR-0064 (disease zones) / ADR-0014 (outbox) / WO-060 (IoT gate)**.
   - RuleSet resolver (`SystemService.getRuleSet`) + 5 domains wired (WO-012) ✅.
   - ADR-0085 reads RuleSet ✅ but ART19(4) guard missing (seam).
   - ADR-0064 reads `RuleSetThresholds.protectionZoneKm/surveillanceZoneKm/diseaseZoneEnabled` ✅.
   - WO-060 IoT `features.iot` gate **NOT** read by any consumer (seam).

4. **ADR-0012 (outbox) → ADR-0007 (audit) → ADR-0014 (cross-domain decoupling) → consumers**.
   - ADR-0012: outbox table + `OutboxProcessorJob` (@Cron every 5s) + handler registry **implemented** ✅. Handlers: notifiable_disease.detected, animal.moved, lab_test.completed, DISEASE_DETECTED, ANIMAL_REGISTERED, APPROVAL_REQUESTED, MOVEMENT_RECORDED, INSPECTION_SCHEDULED, FOREIGN_PASSPORT_EXPIRING, subscription events.
   - ADR-0007 formally **superseded** by ADR-0012 but header not updated (inconsistency).
   - ADR-0014: notification SMS outbox consumer is in the WO-070 deferral register (not built).
   - Audit (WO-159) wired manually into 7 domains; 5 domains uncovered (seam).

5. **auth ↔ authorization** (ADR-0001/0002/0021/0022 → WO-089/098/100/101/102/103/104).
   - **Fully wired**: `PrincipalResolver` → `Principal` → `@Policy`/`PolicyEngine`; `rbac.myPermissions` query; `clientCan`/`useCan` on web+mobile; `@OverridePolicy` (merge-trap fix); permission catalog drift test; SUPER_ADMIN gate on rbac/user routers. **No open seam here** — cited as the one fully-closed integration chain (good contrast case).

---

## ADR-vs-Workorder / doc inconsistencies (flag for RobotFarm pass)

1. **ADR-0007 header says Accepted / "Supersedes: None", but ADR-0012 explicitly "Supersedes ADR-0007".** Audit is now realized via outbox (ADR-0012) + manual service calls (WO-159), not the in-memory emitter ADR-0007 describes. → Mark ADR-0007 **Superseded**.

2. **ADR-0064 body says Movement uses `IotRepository.findActiveDiseaseZonesNearFarm`**, but geo was extracted (ADR-0078) and the implemented code calls `geoService.runDiseaseZoneCheck`. → Update ADR-0064 text.

3. **ADR-0107 (PDF template system) is Proposed**, yet ADR-0082/0084 already implemented the PDF pipeline via Typst + `@e-invoice-eu` + `@cantoo/pdf-lib` and ADR-0107's `DocumentTemplate` registry concept appears partially realized in `packages/pdf`. Either ADR-0107 should be Accepted (if the registry pattern shipped) or its scope narrowed. Status vs reality mismatch.

4. **Workorder WO-050 status = "In progress (ADR-0082)"** while ADR-0082 is **Accepted** and its `document.verify`/`document.generate` are implemented; the remaining piece (PDF/A visual render) is ADR-0084 Phase 3. The workorder row conflates two ADRs' status — clarify that WO-050's generation half is Done and only Phase-3 visual render remains.

5. **ADR-0087 "Treating this as a cattle ESPR obligation — cattle are out of scope (Art 1(2)(e))"** while WO-155/Phase 2 built the GLN mapping "no longer deferred." Tension between the ADR's stated out-of-scope position and the committed build — reconcile the ADR's scope statement with the realized feeder-readiness work.

6. **Geo dashboard counts (ADR-0078 "Dashboard gains real geo counts")** are not present on `apps/web/app/(admin)/dashboard/page.tsx` (verified: 0 geo references). Either implement or soften the ADR's Consequence claim.

---

## Quick reference — open workorder rows (integration-relevant)

Done/closed elsewhere; **open** rows of integration interest:

- **WO-024** FIELD_CHANGED→VD lock — Open (seam)
- **WO-025** QR ear tags — Open (seam)
- **WO-034** `@rocky/observability` + TraceStage/MetricsStage — Open (seam/infra)
- **WO-035** retire manual `logger.*` → span attrs — Open (seam)
- **WO-036** business metrics in services — Open (seam)
- **WO-060** IoT `RuleSet.features.iot` gate — Open (seam)
- **WO-071** calving-gap divergence (365 vs 120 d) — Open (isolated decision; RuleSet override exists)
- **WO-086** i18n layer — Open (seam)
- **WO-097** IoT admin parity + device-sync — Open (seam)
- **WO-161** geo geometry helpers → `packages/geo` — Open (seam)
- **WO-082** mobile offline cache — In Progress (native verify only gate; harness limit)
- **WO-124…142** accept-and-flag — Open (gov/legal block, ADR-0081)
- **WO-133…141** GDPR — Open (legal block, ADR-0061)

---

## Recommended planning priorities (highest-leverage seams)

1. **Geo consumption completion (ADR-0078):** Farm holding-boundary query + admin-dashboard geo tiles. Producer is done; two consumers missing. Low risk, high visibility.
2. **Observability scaffold (WO-034/035/036):** `@rocky/observability` + pipeline stages. Entire execution-pipeline stage doctrine is unrealized; blocks ADR-0003's DoD.
3. **Traceability ART 19(4) (ADR-0085):** one missing guard; registry already supports it.
4. **/verify EmbedPDF + mobile verify-loop (ADR-0082/0084):** close the PDF verify loop on web `/verify` and add a mobile QR→`verifyCredential` path (RN-safe module already exists).
5. **IoT RuleSet gate (WO-060) + i18n (WO-086):** both have built producers, zero consumers.
6. **Doc reconciliation:** re-label ADR-0007 Superseded; fix ADR-0064 `IotRepository` text; reconcile ADR-0107 vs ADR-0082/0084; clarify WO-050 vs ADR-0082/0084 Phase-3.
