# Scout Context — ADR Reconciliation Plan (26 Proposed ADRs)

**Repo:** /home/goce/appz/rocky (Rocky monorepo, pnpm workspace)
**Scope:** 26 ADRs with frontmatter `Status = Proposed` under `apps/docs/content/ADR/`.
**Goal:** (a) cluster by theme, (b) gather concrete code evidence of implementation.
**Method:** Read first ~60 lines of each ADR; then `rg`/direct file reads across `packages/` + `apps/`.
**Note on a display artifact:** some early `rg` outputs rendered specific identifiers as `n`
(e.g. `GeoRouter`→`n`, `redactRecord`→`n`, `sanitary_inspections`→`lns`). Verified by direct
file reads that this is a terminal rendering artifact, NOT a code fact. Citations below use real
content from direct reads.

---

## 1. Clustering (11 thematic clusters)

| Cluster | Member ADRs | One shared theme |
| --- | --- | --- |
| **C1. Web UI Tier Surface Parity** | 0056, 0057, 0058, 0059, 0060 | Admin Bot web parity pages + shared component/feedback contract (ADR-0055 program) |
| **C2. GDPR / ISMS Compliance Lineage** | 0061, 0068, 0069, 0070, 0071, 0072, 0073, 0074, 0075 | Privacy controls (erasure, crypto, edge PII) + governance registers (lawful-basis, DPIA, RoPA, breach, processor) — mostly "paper" controls |
| **C3. Result-Monad Error Sovereignty** | 0066 | Domain↔transport boundary: `Result<T,E>` return type, `TRPCError` only at routers |
| **C4. Geo Spatial Service** | 0078 | Extract `packages/geo` cross-cutting package from IoT domain |
| **C5. Validation Doctrine — Accept-and-Flag** | 0081 | Two-tier validation: hard-reject invariants vs accept+flag plausibility |
| **C6. Health/Disease Domain Expansion** | 0089, 0090, 0091, 0095 | Veterinary & Sanitary module growth: disease master data, sanitary inspections, lab chain-of-custody, AHL reference/events |
| **C7. Dual Dashboards** | 0093 | Role-differentiated web views: private vet vs state epidemiologist |
| **C8. Docker Multi-Stage Build** | 0096 | Reproducible container builds (deps→build→runtime), pinned pnpm, portable config |
| **C9. State Vet Capability** | 0106 | Region-bounded `STATE_VET` role + state_vets registry + tours + section-selectable PDF |
| **C10. PDF Template System** | 0107 | Typed document catalog + threadable `sections` + parallel test suite over existing engine |
| **C11. Mobile Regulatory Gating** | 0065 | Shared regulatory predicate mirrored on device (server decides, device pre-checks) |

Counts: C1=5, C2=9, C3=1, C4=1, C5=1, C6=4, C7=1, C8=1, C9=1, C10=1, C11=1 → **26**.

---

## 2. Evidence per ADR

Legend: **Yes** = implemented in code/governance artifact · **Partial** = core decision partly done / config-only / primitive built but not wired · **No** = no code evidence (roadmap only).

### C1 — Web UI Tier Surface Parity (0056, 0057, 0058, 0059, 0060)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0056 | Web UI Tier 0 (Presence) | `apps/web/app/(admin)/vs-contracts/page.tsx` (`trpc.vsContract.create.mutationOptions`), `vs-assignments/`, `farm-books/`, `sync/` all present + `sync/page.tsx` calls `trpc.sync.syncDownload.queryOptions`. | **Yes** |
| 0057 | Web UI Tier 1 Lifecycle | `apps/web/app/(admin)/ear-tags/`, `health/`, `passports/` pages exist; state-machine UI supported by `apps/web/components/shared/stepper.tsx` + `timeline.tsx`. | **Yes** |
| 0058 | Web UI Tier 1 Operational | `apps/web/app/(admin)/` contains `corrections/`, `iot/`, `notifications/`, `rbac/`, `system-parameters/`, `documents/` — all six routers have presence pages. | **Yes** |
| 0059 | Web UI Tier 2 Deepen | `apps/web/app/(admin)/` contains `archive/`, `devices/`, `inspections/`, `movements/`, `organizations/` — all five deepen targets present. | **Yes** |
| 0060 | Component & Feedback Map | `apps/web/components/shared/timeline.tsx` + `stepper.tsx` built (the 2 required local primitives). `Map` deferred per ADR-0031 (as the ADR itself states). | **Yes** (2/3; Map deferred per ADR) |

*Verification: `ls apps/web/app/\(admin\)` inventory + `find apps/web/components -iname '*timeline*' -o -iname '*stepper*'`.*

### C2 — GDPR / ISMS Compliance Lineage (0061, 0068, 0069, 0070, 0071, 0072, 0073, 0074, 0075)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0061 | GDPR Right-to-be-Forgotten | Only docs + tri-state config gates in `packages/validators/src/compliance/compliance-options.ts` (`physicallyDeleteOnErasure: false`). No crypto-shred / unlink code. `apps/docs/content/compliance/isms-policy.md` marks erasure "PARTIAL / deferred to ADR-0061 Phase 2". | **No** (deferred) |
| 0068 | Lawful Basis Register | `apps/docs/content/compliance/rocky-lawful-basis-register.md` exists (the governance artifact the ADR demands). | **Yes** (governance artifact) |
| 0069 | DPIA Template | `apps/docs/content/compliance/rocky-dpia-health.md` exists. | **Yes** (governance artifact) |
| 0070 | RoPA Derived | `apps/docs/content/compliance/rocky-ropa.md` exists; `VALIDATED_CROSSWALK` crosswalk present in `packages/validators/src/compliance/gdpr-articles.ts`. | **Yes** (governance artifact) |
| 0071 | Envelope Encryption | `rg` for `envelopeEncryption|DataEncryptionKey|encryptAtRest|AesGcm|encryptColumn` across `packages/ apps/` (excl. docs) → **no hits**. Only ADR text + a `requireSigningKeyCustody` config flag. | **No** (deferred) |
| 0072 | Breach Notification Workflow | `apps/docs/content/compliance/rocky-breach-notification-procedure.md` exists (state machine `DETECTED→…→CLOSED` documented). | **Yes** (governance artifact) |
| 0073 | Mobile Edge PII | `apps/mob/lib/offline/pii.ts` + `apps/mob/components/PiiText.tsx` + `apps/mob/lib/offline/pii.test.ts` exist (measure 1, unit-tested). But `rg "PiiText|redactRecord" apps/mob/app` → **no adoption in screens** (measures 2–7 deferred). | **Partial** (primitive built & tested; not wired into UI) |
| 0074 | Field-Role Edge Protocol | `EdgeDataPolicy` type appears only inside `0074-*.md` itself (and a mention in `apps/mob/AGENTS.md`); `rg` for `EdgeDataPolicy|piiResidency|syncScope` in `packages/ apps/` (excl. the ADR) → **no code**. | **No** (spec only) |
| 0075 | Processor/Subprocessor Mgmt | `apps/docs/content/compliance/rocky-processor-register.md` exists (the register + DPA library the ADR demands). | **Yes** (governance artifact) |

*Verification: `ls apps/docs/content/compliance/` (artifact inventory) + `rg -rln 'envelope|DEK|EdgeDataPolicy'` in code.*

### C3 — Result-Monad Error Sovereignty (0066)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0066 | Error Sovereignty (Result) | 404 `ok()/err()/Result/unwrap()/fromAsyncThrowable` matches across `packages/domains/*/services/*.service.ts`. `packages/domains/sync/src/services/sync.service.ts:10` "Returns neverthrow `Result<T, Error>`; routers map `E` to `TRPCError`." `rg "TRPCError" packages/domains` → only in `*/errors/*.errors.ts` doc comments + `*/AGENTS.md`, never thrown in services. | **Yes** |

*Verification: `rg -c 'ok\(|err\(|Result<|unwrap\(' packages/domains --glob '*.service.ts'` → 404; `rg -n TRPCError packages/domains`.*

### C4 — Geo Spatial Service (0078)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0078 | Geo Spatial Service | `packages/geo/` exists with `AGENTS.md`, `src/services/geo.service.ts:13` `export class GeoService`, `src/repositories/geo.repository.ts:21` `listGeofencesByFarm`, `:43` `findActiveDiseaseZonesByFarm`. Router registered: `apps/api/src/app.module.ts:91` `import { GeoRouter }`, `:566` `GeoRouter,`. | **Yes** |

*Verification: `ls packages/geo` + `rg -n 'GeoRouter' apps/api/src/app.module.ts`.*

### C5 — Validation Doctrine — Accept-and-Flag (0081)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0081 | Accept-and-Flag Validation | `packages/validators/src/compliance/compliance-options.ts:83` "Default posture: EVERY option UNDECIDED (undefined) => accept-and-flag." + `:13` "This is the accept-and-flag doctrine applied to governance itself." Tri-state `complianceOptionsSchema` with `deadAnimalCannotMove`, `allowNullableToFarmId`, etc. Validators reference the stance (`packages/validators/src/api/movements.api.ts`, `eartags.api.ts`). | **Partial** (doctrine expressed as config; the movement/eartag *schema* changes — nullable `toFarmId`, external counterparty — are still deferred pending ratification, as the ADR itself notes) |

*Verification: `rg -n 'accept-and-flag|complianceOptionsSchema' packages/validators/src/compliance/compliance-options.ts`.*

### C6 — Health/Disease Domain Expansion (0089, 0090, 0091, 0095)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0089 | Disease Master Data (AHL + WOAH) | `packages/database/src/schema/hd/diseases.ts:20` `diseaseCategory: diseaseCategoryPgEnum(...).notNull()`, `:22` `diseaseCategories: ...array().notNull()`, `:25` `woahCode: varchar("woah_code"...).unique()`, plus `euAnnexRef`, `controlMeasures`, `listedDisease`, `legalBasis`. | **Yes** |
| 0090 | Sanitary Inspections (ante/post-mortem) | `packages/database/src/schema/an/sanitary-inspections.ts:33` `anteMortemDecision: sanitaryDecisionPgEnum(...)`, `:34` `postMortemDecision: ...`, `:38` disposition comment "ABP_CAT1 incineration"; migration `drizzle/.../migration.fixed.sql` creates `sanitary_inspections` w/ FKs to movements/farms/subjects. | **Yes** |
| 0091 | Lab Test Chain-of-Custody | `packages/database/src/schema/hd/lab-tests.ts:47` `sampleStatus: sampleStatusPgEnum("sample_status").notNull().default(SAMPLE_STATUS.COMPLETED)`; `packages/domains/health/src/services/health.service.ts:358` emits `lab_test.completed` OutboxEvent ("ADR-0091/0092 — emit LabTestCompletedEvent"). | **Yes** |
| 0095 | AHL Disease Reference & Events | Tables present: `packages/database/src/schema/hd/` → `species-groups.ts`, `disease-events.ts`, `disease-species-applicability.ts`, `disease-event-procedures.ts`. Seed: `packages/database/src/seed/ahl-reference.ts` ("AHL Reference Data Seed (ADR-0095)", idempotent upsert of ~75 diseases + species groups). | **Yes** |

*Verification: `ls packages/database/src/schema/hd/`, `rg -n 'diseaseCategory|sampleStatus'`, `ls packages/database/src/seed/`.*

### C7 — Dual Dashboards (0093)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0093 | Dual Dashboards (Vet vs Epidemiologist) | Only a generic `apps/web/app/(admin)/dashboard/page.tsx` + `apps/web/components/dashboard/analytics`. `rg -rln 'Epidemiologist|VetDashboard|StateEpidemiologist'` in `apps/web/app` → **no hits**. No role-specific vet-productivity or epidemiologist-surveillance (national map/heatmap) dashboards. | **No** (only a generic dashboard exists) |

*Verification: `find apps/web -iname '*dashboard*'` + `rg -rln 'epidemiolog' apps/web/app`.*

### C8 — Docker Multi-Stage Build (0096)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0096 | Docker Multi-Stage Build | Three Dockerfiles exist: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/docs/Dockerfile`, each with stages `toolchain → workspace → build → production` (api: `FROM gcr.io/distroless/nodejs24-debian12:nonroot AS production`, non-root). `apps/api/Dockerfile:17` `pnpm install --offline --frozen-lockfile`; prod-slim via `pnpm deploy --legacy --filter=@rocky/api --prod`. Portable config: `apps/web/next.config.ts:21` `const monorepoRoot = findMonorepoRoot(process.cwd())`, `:42` `turbopack: { root: monorepoRoot }`. | **Yes** (note: uses `pnpm deploy --prod` rather than ADR's literal `pnpm install --prod --frozen-lockfile`, but achieves the same prod-only slim; ADR itself claims the files already conform) |

*Verification: `ls apps/*/Dockerfile` + `rg -n 'FROM|production|deploy --prod' apps/api/Dockerfile` + `rg -n 'findMonorepoRoot' apps/web/next.config.ts`.*

### C9 — State Vet Capability (0106)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0106 | State Vet Capability | `rg -rln 'STATE_VET|state_vets|StateVet|stateVet' packages/database/src/constants/user-role.ts` → **no matches**; grep across `packages/` → **no matches**. No role, no `state_vets` registry, no `farm_tours` domain, no attribution columns. | **No** (not started) |

*Verification: `rg -rn 'STATE_VET' packages/database/src/constants/user-role.ts` + `rg -rln 'STATE_VET|state_vets' packages`.*

### C10 — PDF Template System (0107)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0107 | PDF Template System | Engine exists: `packages/pdf/src/engine/document-registry.ts` `class DocumentRegistry`, `document-template.ts` `class DocumentTemplate`. But Pillars A–D are **not** present: `rg` for `DOCUMENT_TYPES|documentTypeEnum|getManifest|sections\?:|document.catalog` in `packages/pdf/src`,`packages/validators/src/api`,`apps/api` → **no hits**. No typed catalog, no `sections` threading, no `trpc.document.catalog`. (ADR itself states "template-incomplete.") | **No** (engine only; catalog/sections/web-binding not built) |

*Verification: `rg -rn 'DocumentTemplate|DocumentRegistry' packages/pdf/src` + `rg -rn 'sections\?:|documentTypeEnum|getManifest|catalog' packages/pdf packages/validators apps/api`.*

### C11 — Mobile Regulatory Gating (0065)

| ADR | Title | Evidence (file:line + quote) | Implemented? |
| --- | --- | --- | --- |
| 0065 | Mobile Regulatory Gating | Server-side gating predicates exist: `packages/domains/movement/src/services/eudr-due-diligence.ts:47` `export async function runEudrDueDiligence(`, `packages/geo/src/services/disease-zone.service.ts:73` `export async function runDiseaseZoneCheck(`. BUT the ADR's core decision — extract `evaluateMovementRegulatory` into `packages/domains/movement/src/regulatory/` + a **mobile pre-check mirroring the same predicate** — is **not** done: no `regulatory/` dir, no `evaluateMovementRegulatory`, `rg` for those symbols in `apps/mob` → only a generic AGENTS.md mention. | **Partial** (server-side gating present; shared extracted module + device mirror NOT built) |

*Verification: `ls packages/domains/movement/src/regulatory` (absent) + `rg -rn 'runEudrDueDiligence|runDiseaseZoneCheck'` + `rg -rln 'evaluateMovementRegulatory|regulatory' apps/mob`.*

---

## 3. Implementation Summary (for the reconciliation plan)

| Status | ADRs | Count |
| --- | --- | --- |
| **Yes (implemented)** | 0056, 0057, 0058, 0059, 0060, 0066, 0068, 0069, 0070, 0072, 0073†, 0075, 0078, 0089, 0090, 0091, 0095, 0096 | 18 |
| **Partial (core decision partly done)** | 0061 (deferred), 0065, 0073, 0081, 0089?… | see below |
| **No (roadmap only)** | 0061, 0071, 0074, 0093, 0106, 0107 | 6 |

Clarifications on the "Partial" / borderline ones:

- **0061** — erasure machinery is *deferred* (compliance docs say "Phase 2"); only config gates exist → effectively **No** for code, but the governance paper trail (0073/0075 cluster) partially covers it.
- **0065** — server gate yes; device mirror no → **Partial**.
- **0073** — `PiiText`/`redactRecord` built + tested (measure 1) but **not adopted in any mobile screen** → **Partial**.
- **0081** — accept-and-flag doctrine *is* encoded as tri-state config (`complianceOptionsSchema`) and referenced in validators, but the dependent schema changes (nullable `toFarmId`, external counterparty) are still pending ratification → **Partial** (config yes, schema no).
- **0074** — spec only; no `EdgeDataPolicy` code → **No** (listed under C2, borderline with Partial).

### Quick reconciliation guidance for downstream agents

- **Flip to Accepted now (strong code evidence):** 0056, 0057, 0058, 0059, 0060, 0066, 0078, 0089, 0090, 0091, 0095, 0096 — and the governance-artifact ADRs 0068, 0069, 0070, 0072, 0075 (the artifacts they mandate exist).
- **Keep Proposed (partial):** 0065, 0073, 0081 (configuration/primitive done; full decision pending).
- **Keep Proposed (no code — roadmap):** 0061, 0071, 0074, 0093, 0106, 0107.
