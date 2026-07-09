# Inspection Domain Service — Inspection Bot

**Scope:** `packages/domains/inspection/` — service, repository, errors, tRPC router
**Source spec:** `docs/old/workflow.md` §Instance 18 — On-Spot Inspections
**Status:** Phases A, C, D, F complete. Phase B (Mobile DB) and Phase E (Offline Sync) pending.

## Overview

CPC runs a **Risk Analysis** to select **10%** of keepers/holdings to be inspected each year. The on-spot control software allows random selection of farms and animals and prints a form listing currently registered animals with checkboxes for tagging status and presence.

## Architecture

```
InspectionRouter (tRPC) → InspectionService (validate + orchestrate) → InspectionRepository (DB)
                                  ↑                          ↑
HealthService (notifiable disease) → InspectionRepo          RiskAnalysisService → InspectionService
ArchiveService ← InspectionService.complete()                (10% farm selection, annual @Cron)
```

## Implementation Inventory

### Done ✅

| Component | File | Notes |
|-----------|------|-------|
| Drizzle schema | `packages/database/src/schema/an/inspections.ts` | 22 form-related columns, RLS, indexes |
| Risk analyses schema | `packages/database/src/schema/an/risk-analyses.ts` | 14 columns, risk analysis records |
| Constants | `packages/database/src/constants/inspection-status.ts` | SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED |
| Notification categories | `packages/database/src/constants/notification-category.ts` | +ANALYSIS_DUE, ANALYSIS_OVERDUE |
| pgEnum | `packages/database/src/schemas/enums/inspection-status.ts` | Pre-existing |
| zEnum | `packages/validators/src/enums/domain.ts` | `inspectionStatusSchema` already defined |
| Dumb Zod | `packages/database/src/zod/an.ts` | `inspectionSelectSchema` + `inspectionInsertSchema` + `riskAnalysisSelectSchema` + `riskAnalysisInsertSchema` |
| Domain package | `packages/domains/inspection/` | `package.json`, `tsconfig.json`, `src/{errors,repositories,services}/` |
| Errors | `packages/domains/inspection/src/errors/inspection.errors.ts` | 5 error codes |
| Repository | `packages/domains/inspection/src/repositories/inspection.repository.ts` | findById, findByFarm, list, hasActiveInspection, create, update, updateStatus, flagFarmForInspection |
| Service | `packages/domains/inspection/src/services/inspection.service.ts` | getById, list, create, schedule, complete, generateInspectionForm, listRiskAnalyses, runRiskAnalysis |
| RiskAnalysisService | `packages/domains/inspection/src/services/risk-analysis.service.ts` | Weighted random 10% farm selection, list, getById |
| API validators | `packages/validators/src/api/inspection.api.ts` | Response + list + create + complete + schedule + printForm schemas |
| TRPC error map | `packages/validators/src/errors/inspection.errors.ts` | 5 error code → TRPCError mappings |
| tRPC router | `apps/api/src/routers/inspection.router.ts` | 8 endpoints: getById, list, create, schedule, complete, printForm, listRiskAnalyses, runRiskAnalysis |
| App module wiring | `apps/api/src/app.module.ts` | Repository + Service + RiskAnalysisService + Router + RiskAnalysisJob |
| Health integration | `packages/domains/health/src/services/health.service.ts` | `recordTreatment()` calls `inspectionRepo.flagFarmForInspection()` when `disease.notifiable` |
| Health events | `packages/validators/src/events/health.events.ts` | 4 events: vaccination.administered, treatment.recorded, notifiable.alert, lab-test.completed |
| Archive wiring | `packages/domains/inspection/src/services/inspection.service.ts` | `complete()` → `archiveService.archiveInspectionForm()` fire-and-forget |
| Retention cron | `apps/api/src/jobs/retention.job.ts` | `@Cron(EVERY_DAY_AT_2AM)` — marks expired docs as destroyed |
| Risk analysis cron | `apps/api/src/jobs/risk-analysis.job.ts` | `@Cron("0 0 1 1 *")` — annual 10% farm selection |
| Permission guard | `apps/api/src/trpc/middlewares/permission.guard.ts` | `createPermissionGuard()` factory for `@UseMiddlewares` |
| Form data model | `models/inspection-form.yaml` | YAML definition of all form sections (9 sections) |
| Form example | `models/inspection-form.json` | JSON instance with sample data |
| Mobile schema profiles | `models/mobile-schema-profiles.yaml` | 3 permission-scoped SQLite profiles (FARMER, VETERINARIAN, CPC_ADMIN) |

---

## Gap Resolution Plan

### Phase A: Archive Domain ✅

**Objective:** Implement archive domain package so inspection forms can be archived on completion.

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| A1 | Archive `package.json`, `tsconfig.json` | `packages/domains/archive/` | ✅ |
| A2 | Archive errors (5 codes) | `packages/domains/archive/src/errors/` | ✅ |
| A3 | Archive repository (CRUD + findExpiredRetention + findByInspectionId) | `packages/domains/archive/src/repositories/` | ✅ |
| A4 | Archive service (CRUD + archiveInspectionForm + markDestroyed) | `packages/domains/archive/src/services/` | ✅ |
| A5 | Archive Dumb Zod | `packages/database/src/zod/an.ts` | ✅ |
| A6 | Archive API validators + tRPC error map | `packages/validators/src/api/`, `packages/validators/src/errors/` | ✅ |
| A7 | Archive tRPC router (6 endpoints) | `apps/api/src/routers/archive.router.ts` | ✅ |
| A8 | NestJS wiring in app.module.ts | `apps/api/src/app.module.ts` | ✅ |
| A9 | Update root AGENTS.md Archive Bot entry | `AGENTS.md` | ✅ |

---

### Phase B: Mobile Local DB Foundation (Pending)

**Objective:** Set up local SQLite database infrastructure for offline mobile use.

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| B1 | ~~Fix `ORPCProvider` → `TRPCProvider` bug~~ | `apps/mob/src/app/_layout.tsx` | ✅ **FIXED** — code uses correct `</TRPCProvider>` |
| B2 | Add `expo-sqlite` + Drizzle SQLite ORM | `apps/mob/package.json` | ❌ |
| B3 | Define local SQLite schema (mirrors core domain tables per role profile) | `apps/mob/src/db/schema.ts` | ❌ |
| B4 | Build `LocalDbProvider` (init DB, run migrations) | `apps/mob/src/providers/db-provider.tsx` | ❌ |
| B5 | Build `NetworkProvider` using `expo-network` (connectivity state, event emitter) | `apps/mob/src/providers/network-provider.tsx` | ❌ |

**Dependencies:** None (can run independently)
**Building blocks ready:** `expo-network` (installed unused), `DATA_SOURCE.MOBILE`/`EVENT_SOURCE.SYNC` enums, `sync_errors` table schema
**Schema profiles:** `models/mobile-schema-profiles.yaml` defines per-role table sets

---

### Phase C: Risk Analysis Engine ✅

**Objective:** Implement the 10% farm selection algorithm that CPC runs annually.

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| C1 | Add `ANALYSIS_DUE`, `ANALYSIS_OVERDUE` to notification category constants + pgEnum + zEnum | `packages/database/src/constants/notification-category.ts` | ✅ |
| C2 | `risk_analyses` Drizzle schema + Dumb Zod | `packages/database/src/schema/an/risk-analyses.ts` | ✅ |
| C3 | Seed system parameters for risk weights | `packages/database/src/seed.ts` | ✅ (implicit via DEFAULT_WEIGHTS) |
| C4 | `RiskAnalysisService` with weighted random 10% selection | `packages/domains/inspection/src/services/risk-analysis.service.ts` | ✅ |
| C5 | `createPermissionGuard()` factory for `@UseMiddlewares` | `apps/api/src/trpc/middlewares/permission.guard.ts` | ✅ |
| C6 | Risk analysis endpoints + annual cron job | `apps/api/src/routers/inspection.router.ts`, `apps/api/src/jobs/risk-analysis.job.ts` | ✅ |

**Dependencies:** Inspection domain package (exists)
**Building blocks ready:** `analysis:read`/`analysis:run` permissions seeded, `ANALYSIS_DUE`/`ANALYSIS_OVERDUE` notification categories, `ScheduleModule.forRoot()` imported

**Note:** DB migration for `risk_analyses` table NOT pushed — `drizzle-kit generate` times out. Needs: `cd packages/database && pnpm generate` → `node scripts/fix-rls-sql.mjs` → `PGPASSWORD=tbotpass psql ... -f migration.fixed.sql`

---

### Phase D: Inspection Form Data Layer ✅

**Objective:** Generate printable inspection forms listing registered animals with checkboxes.

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| D1 | `CheckedAnimal` TypeScript interface + Zod schema (NoDriftSimple) | `packages/validators/src/api/inspection.api.ts` | ✅ |
| D2 | `generateInspectionForm()` service: query farm's animals, populate `checkedAnimals`, set `formPrinted=true` | `packages/domains/inspection/src/services/inspection.service.ts` | ✅ |
| D3 | `printForm` tRPC mutation (returns structured data from `models/inspection-form.yaml`) | `apps/api/src/routers/inspection.router.ts` | ✅ |
| D4 | `InspectionFormTemplate` in `@rocky/pdf` — delegates to `generateInspectionForm()`, maps to YAML model | `packages/pdf/src/templates/inspection-form.template.ts` | ✅ |

**Dependencies:** Animal domain (to query registered animals on farm) — satisfied via `@rocky/domains-animal` DI injection
**Building blocks ready:** `formPrinted`/`formReturned` columns, `checkedAnimals` jsonb column, form data model (`models/inspection-form.yaml`)

**Document generation integration:** The `InspectionFormTemplate` lives in `@rocky/pdf` and receives `InspectionService` via constructor (plain class, no decorators). It calls `inspectionService.generateInspectionForm()` to get the form data, then maps it to the `models/inspection-form.yaml` structure. The generic `document.generate({ type: "inspection-form", refId })` endpoint handles output — no inspection-specific router changes needed.

---

### Phase E: Offline Sync Engine (Pending)

**Objective:** Enable mobile app to capture data offline and sync when connectivity returns.

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| E1 | Server-side `SyncService` + `SyncRouter` with batch mutation endpoint, conflict detection, `sync_errors` writer | `apps/api/src/services/sync.service.ts`, `apps/api/src/routers/sync.router.ts` | ❌ |
| E2 | `SyncQueue` client lib — pend mutations when offline, replay on connectivity | `apps/mob/src/lib/sync-queue.ts` | ❌ |
| E3 | Network-aware tRPC wrapper — online → direct call, offline → queue | `apps/mob/src/lib/trpc-offline.ts` | ❌ |
| E4 | Data source tagging in domain services — set `DATA_SOURCE.MOBILE` or `EVENT_SOURCE.SYNC` | Cross-cutting: `packages/domains/*/src/services/*.service.ts` | ❌ |
| E5 | Sync status UI component (pending count, last sync, force sync button) | `apps/mob/src/components/sync-status.tsx` | ❌ |

**Dependencies:** Phase B (local DB + network provider)
**Building blocks ready:** `sync_errors` table, `SYNC_ERROR_TYPE` enum, `DATA_SOURCE.MOBILE`/`EVENT_SOURCE.SYNC` enum values

---

### Phase F: Retention Enforcement ✅

**Objective:** Enforce 3-year retention for inspection forms and archived documents.

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| F1 | Wire `InspectionService.complete()` → `ArchiveService.archiveInspectionForm()` on completion | `packages/domains/inspection/src/services/inspection.service.ts` | ✅ |
| F2 | `@Cron` daily job: query expired archives, mark as destroyed | `apps/api/src/jobs/retention.job.ts` | ✅ |
| F3 | Retention enforcement tRPC endpoints (query expired, trigger purge manually) | `apps/api/src/routers/archive.router.ts` | ✅ |

**Dependencies:** Phase A (Archive domain) — satisfied
**Building blocks ready:** `retentionExpiry` column on `inspections` and `archive_documents`, `ScheduleModule.forRoot()` imported

---

## Execution Order

```
Phase A (Archive) ✅         ──────┐
Phase B (Mobile DB) ❌       ─────┤
Phase C (Risk Analysis) ✅   ─────┤── A, C, D, F completed in parallel
Phase D (Form Data) ✅       ─────┤
                                 │
Phase E (Offline Sync) ❌   ─────┘── depends on Phase B
Phase F (Retention) ✅       ──────── depends on Phase A (satisfied)
```

Logical dependency chain:
1. A, B, C, D can all start immediately (no inter-dependencies)
2. E depends on B (needs local DB + network provider)
3. F depends on A (needs Archive domain package)
4. D feeds into Phase E's offline inspection capture (not blocking)

---

## Error Codes

| Code | When |
|------|------|
| `NOT_FOUND` | Inspection not found |
| `FORBIDDEN` | Permission denied |
| `FARM_ALREADY_INSPECTED` | Farm already has an active (non-cancelled) inspection |
| `INVALID_STATUS_TRANSITION` | Illegal state change (e.g. completed → scheduled) |
| `INVALID_INPUT` | Validation failure |

## Schema: `inspections` Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | `defaultRandom()` |
| `farmId` | `uuid FK → farms` | Farm being inspected |
| `inspectorId` | `uuid` | VI (veterinary inspector) |
| `status` | `inspection_status pgEnum` | SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED |
| `scheduledDate` | `date` | Scheduled inspection date |
| `inspectionDate` | `date` | Actual inspection date |
| `riskScore` | `varchar(20)` | Risk analysis score |
| `riskCriteria` | `text` | Criteria that triggered selection |
| `selectedByRiskAnalysis` | `boolean` | Whether selected via 10% risk analysis |
| `result` | `varchar(50)` | Inspection result |
| `notes` | `text` | Free-text notes |
| `discrepanciesFound` | `boolean` | Tagging/registration discrepancies |
| `checkedAnimals` | `jsonb` | Array of checked animals + tagging status + presence |
| `formPrinted` | `boolean` | Whether inspection form was printed |
| `formReturned` | `boolean` | Whether completed form was returned by VI |
| `keeperSigned` | `boolean` | Keeper signed the form |
| `signedAt` | `timestamp` | When keeper signed |
| `storedAtVi` | `boolean` | Form stored at VI office |
| `retentionExpiry` | `date` | 3-year retention deadline |
| `isActive` | `boolean` | Soft-delete flag |
| `createdAt` | `timestamp` | |
| `createdBy` | `uuid` | |
| `updatedAt` | `timestamp` | |
| `validTo` | `timestamp` | |

**Indexes:** farmId, inspectorId, status, inspectionDate
**RLS:** Org-scoped read for ADMIN/ORG_READ roles; admin-only write.

## Key Decisions

- `flagFarmForInspection()` in `InspectionRepository` uses a nullable `inspectorId` defaulting to zero-UUID as placeholder — the real inspector assignment happens during scheduling
- `HealthService` holds `InspectionRepository` as optional dependency (`inspectionRepo?`) — Health domain does NOT hard-depend on Inspection domain
- Cross-domain injection via NestJS DI: `app.module.ts` passes `InspectionRepository` to `HealthService` factory alongside `HealthRepository` and `SubjectRepository`
- Notifiable disease flagging is **fire-and-forget** — treatment record creation never fails due to inspection flagging failure
- Form data model (`models/inspection-form.yaml`) is the SINGLE SOURCE OF TRUTH for inspection form structure — both PDF generation and mobile app consume this
- PDF generation is handled by `@rocky/pdf` package — `InspectionFormTemplate` delegates to `generateInspectionForm()`, generic `document.generate()` endpoint handles output
- Mobile SQLite schema uses 3 permission-scoped profiles (FARMER, VETERINARIAN, CPC_ADMIN) — not 9 per-role schemas
- RiskAnalysisService takes DB directly (not repo) since it queries both `farms` and `risk_analyses` tables
- **Risk analysis uses weighted random selection.** Farms are scored on animal count (30%), past inspection history (30%), farm type diversity (20%), and random regional factor (20%) via `DEFAULT_WEIGHTS`. Weighted reservoir sampling selects the target count. Implemented 2026-07-05 — replaces previous pure `RANDOM()` approach.
- `createPermissionGuard()` factory function: nestjs-trpc's `@UseMiddlewares` expects class constructors, not instances — factory returns `new()` class with permission baked in via closure
- Archive wiring: `InspectionService.complete()` calls `archiveService.archiveInspectionForm()` as fire-and-forget — archive failure never blocks inspection completion
- Risk analysis cron uses `@Cron("0 0 1 1 *")` (January 1st annually) — `RiskAnalysisService` is injected into `RiskAnalysisJob` via NestJS DI

## Context Boundaries

| Bot | Reads | Writes |
|-----|-------|--------|
| **Inspection Bot** | `packages/domains/inspection/` | errors, repo, service |
| **Health Bot** | `packages/domains/health/` | Calls `InspectionRepository.flagFarmForInspection()` |
| **Archive Bot** | `packages/domains/archive/` | Inspection completion → archive entry creation |
| **PDF Bot** | `packages/pdf/` | `InspectionFormTemplate` uses `InspectionService` for form data |
| **Validation Bot** | `packages/validators/src/api/inspection.api.ts` | Inspection API schemas |
| **API Bot** | `apps/api/src/routers/inspection.router.ts` | tRPC router |
| **Mobile Bot** | `apps/mob/src/` | Offline inspection capture, sync queue |
