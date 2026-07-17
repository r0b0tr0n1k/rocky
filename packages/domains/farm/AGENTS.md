# Farm Domain Service

**Scope:** `packages/domains/farm/` — service, repository, errors
**Subject domain:** `packages/domains/subject/` — **separate package**, not in farm domain
**Source spec:** `docs/old/workflow.md` §Instances 1-3
**Last verified:** 2026-07-05 — AGENTS.md aligned to actual code

## Overview

Manages farms (holdings) and their keepers. The farm is the spatial unit of the I&R system.

> ⚠️ **Subject domain is in a separate package** (`packages/domains/subject/`). Keepers/subjects are managed by `SubjectService` and `SubjectRepository` there, not in the farm package. The farm package handles farms and their binding to subjects.

## Workflow Instances Covered

| Instance | Description | Status |
| -------- | -------------------------- | ------------------------ |
| 1 | Farm Census | ~75% (CRUD + address + verification workflow, no farm book) |
| 2 | New Keeper/Holding | ~60% (create + bind exists, no dedup, no farm book) |
| 3 | Change Keeper/Holding Info | ~90% (FarmService.update ✅, SubjectService.update ✅, audit trail ✅) |

## Business Rules

### Farm Census (Instance 1)

| # | Rule | Status |
| --- | --------------------------------------------------------------- | ------ |
| 1 | Farm ID with check digit validation | ✅ `farmIdSchema` in check-digit.ts validates 9-digit MOD10 |
| 2 | Auto-generated 9-digit farm ID | ✅ `generateFarmId()` in check-digit.ts |
| 3 | Address hierarchy (states → zip codes → communes → admin units) | ✅ Addresses table with hierarchy |
| 4 | Farm type classification | ✅ `farmTypePgEnum` |
| 5 | PostGIS location/GPS coordinates | ✅ `geometry("location")` with SRID 4326 + GIST index |
| 6 | Verification workflow (PENDING_VD_APPROVAL → approved/rejected) | ✅ `verificationStatus` field with workflow |
| 7 | Farm book printing/delivery | ✅ `farm_books` table + `FarmBookService` with lifecycle status tracking |
| 8 | VS service contract assignment | ✅ `vs_contracts` table + `VsContractService` with DRAFT→ACTIVE→SUSPENDED→TERMINATED/EXPIRED lifecycle |
| 9 | VS assignment to keepers/holdings | ✅ `vs_assignments` table + `VsAssignmentService` — assigns VS (via ACTIVE contract) to farm |

### New Keeper/Holding (Instance 2)

| # | Rule | Status |
| --- | ---------------------------------------------------- | ------ |
| 1 | Create new subject (keeper) with dual-language names | ✅ `SubjectService.create()` in `packages/domains/subject/` |
| 2 | Create new farm with check-digit farm ID | ✅ `FarmService.create()` |
| 3 | Bind keeper to farm with role | ✅ `SubjectService.bindToFarm()` |
| 4 | Check-against-register dedup logic | ✅ Subject `personalId` dedup in `SubjectService.create()`. Farm `farmId` dedup added to `FarmService.create()` — throws `FARM_DUPLICATE_ID` |
| 5 | Farm book assembly/delivery | ✅ | `FarmBookService.create()` assembles + creates record. Status lifecycle via `updateStatus()`. |

### Change Keeper/Holding Info (Instance 3)

| # | Rule | Status | Details |
| --- | ----------------------------------------- | -------------------- | ------- |
| 1 | Update farm information | ✅ | `FarmService.update()` + `updateFarmRequestSchema` exist |
| 2 | Update keeper information | ✅ Implemented | `SubjectService.update()` at `subject.service.ts:48`. `updateSubjectRequestSchema` at `subjects.api.ts:54`. Router mutation at `subject.router.ts:61`. |
| 3 | Change audit trail | ✅ | `AuditService` at `packages/domains/audit/`. Records pre/post snapshots + diff to `audit_log`. Wired into `FarmService.update()`, `SubjectService.update()`. |
| 4 | Passport/cattle register reprint triggers | ✅ `SubjectService.update()` fires `FarmBookService.create()` per farm binding. `CorrectionService.resolve()` fires `PassportService.reprint()` when `passportReprintRequired`. |

## Architecture

```
FarmRouter (tRPC) → FarmService (validate + orchestrate) → FarmRepository (DB)
SubjectRouter (tRPC) → SubjectService (validate + orchestrate) → SubjectRepository (DB)
                                                                    ↑
                                                              (packages/domains/subject/)
```

Both return `Result<T, FarmError>` / `Result<T, SubjectError>`.

## Repository Methods — `FarmRepository`

**Row-shape types:** `FarmRow` is re-exported from this repository so services import it relative (ROCKY-DS 001:2026(E) §8.2) instead of importing `@rocky/database` table definitions.

`packages/domains/farm/src/repositories/farm.repository.ts` (extends `BaseRepository`, reaches the DB only via `this.client`):

- `findById(id)` / `findByFarmId(farmId)` / `findAddressById(id)`
- `listFiltered(filter)` — paginated + counted list with type/verification/status filters and search
- `insert(data)` / `update(id, data)`
- `countActiveFarms(): Promise<number>` — `COUNT(*)` over `farms WHERE isActive = true`
- `getFarmsWithRiskFactors()` — read-only aggregate: `farms` LEFT JOIN `animals` LEFT JOIN `inspections` (active farms only), selecting `{ id, type, animalCount, pastInspections }`, `GROUP BY farms.id HAVING count(animals.id) > 0`. Consumed cross-domain by Inspection's `RiskAnalysisService` (§8.5 module-wiring exception; Farm Bot owns the method).

> Note: `getFarmsWithRiskFactors()` is a **read-join** over `animals`/`inspections` (read-only sources) — no writes outside the farm domain.

## Error Codes — Farm (`farm.errors.ts`)

| Code | String Value | When |
| ------------------- | ----------------------------- | ------ |
| `NOT_FOUND` | `FARM_NOT_FOUND` | Farm not found |
| `DUPLICATE_FARM_ID` | `FARM_DUPLICATE_ID` | Farm ID already exists |
| `INVALID_INPUT` | `FARM_INVALID_INPUT` | Validation failure |
| `FORBIDDEN` | `FARM_FORBIDDEN` | Permission denied |

> **Note:** `INVALID_FARM_ID` is NOT a defined error code in the current codebase (it was listed in older docs but never implemented).

## Schema

- Table: `farms` (`packages/database/src/schema/hk/farms.ts`)
- Table: `subjects` (`packages/database/src/schema/hk/subjects.ts`)
- Table: `farm_subjects` (`packages/database/src/schema/hk/farm-subjects.ts`)
- Table: `addresses` (`packages/database/src/schema/hk/addresses.ts`)
- Table: `vs_contracts` (`packages/database/src/schema/hk/vs-contracts.ts`)
- Table: `vs_assignments` (`packages/database/src/schema/hk/vs-assignments.ts`)
- Type pgEnum: `farm_type`, `subject_role`, `vs_contract_status`

## tRPC Endpoints

**FarmRouter** (`apps/api/src/routers/farm.router.ts`):

- Query: `getById`, `list`
- Mutation: `create`, `update`

**SubjectRouter** (`apps/api/src/routers/subject.router.ts`):

- Query: `getById`, `search`
- Mutation: `create`, `update`, `bindToFarm`, `unbindFromFarm`

**VsContractRouter** (`apps/api/src/routers/vs-contract.router.ts`):

- Query: `getById`, `getBySubject`, `getByRegion`
- Mutation: `create`, `updateStatus`

**VsAssignmentRouter** (`apps/api/src/routers/vs-assignment.router.ts`):

- Query: `getById`, `getByFarm`, `getActiveByFarm`, `getByContract`
- Mutation: `assign`, `unassign`

## Implementation Priority

1. **Phase 1:** Add update mutations — FarmService.update ✅, SubjectService.update ✅
2. **Phase 2:** Add update validators — `updateFarmRequestSchema` ✅, `updateSubjectRequestSchema` ✅
3. **Phase 3:** Change audit trail integration — ✅ `packages/domains/audit/` — `AuditService.recordUpdate()` records farm/subject changes with pre/post snapshots + computed diff
4. **Phase 4:** Farm book workflow — ✅ `farm_books` table, `FarmBookService`, `FarmBookRouter` — lifecycle: ASSEMBLED → PRINTED → SHIPPED_TO_VS → DELIVERED
5. **Phase 5:** VS assignment workflow — ✅ `vs_contracts` + `vs_assignments` tables, `VsContractService` + `VsAssignmentService`, `VsContractRouter` + `VsAssignmentRouter` — contract lifecycle + farm assignment
6. **Phase 6:** Check-against-register dedup — ✅ Farm `farmId` dedup in `FarmService.create()` throws `FARM_DUPLICATE_ID`. Subject `personalId` dedup already existed.
