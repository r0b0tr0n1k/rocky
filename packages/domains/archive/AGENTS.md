# Archive Domain Service — Archive Bot

**Scope:** `packages/domains/archive/` — service, repository, errors, tRPC router
**Source spec:** `docs/old/workflow.md` §Instance 25 — The I&R Archive
**Status:** All phases complete (CRUD, retention enforcement cron, domain integration).

## Overview

The I&R system maintains a **3-tier document archive**:

1. **Central CPC Archive:** Passports of ceased animals, correspondence on ear tag allocation, correspondence on cases assigned to VI
2. **VS Archive:** Holding/keeper census forms, change of holding/keeper forms, animal census forms, tagging receipts, order forms
3. **VI Archive:** Cases assigned as routine control, special cases assigned by CPC, measures taken by VI, inspection forms

## Architecture

```
ArchiveRouter (tRPC) → ArchiveService (validate + orchestrate) → ArchiveRepository (DB)
                              ↑
InspectionService.complete() → ArchiveService.archiveInspectionForm()
```

## Implementation Inventory

### Done ✅

| Component | File | Notes |
|-----------|------|-------|
| Drizzle schema | `packages/database/src/schema/an/archive-documents.ts` | 15 columns, RLS, indexes |
| Constants | `packages/database/src/constants/archive-location.ts` | CPC/VS/VI/BIP |
| Constants | `packages/database/src/constants/archive-document-type.ts` | 8 document types |
| pgEnums | `packages/database/src/schemas/enums/` | archive_location, archive_document_type |
| zEnums | `packages/validators/src/enums/domain.ts` | archiveLocationSchema, archiveDocumentTypeSchema |
| Dumb Zod | `packages/database/src/zod/an.ts` | archiveDocumentSelectSchema + archiveDocumentInsertSchema |
| Domain package | `packages/domains/archive/` | package.json, tsconfig.json, src/{errors,repositories,services}/ |
| Errors | `packages/domains/archive/src/errors/archive.errors.ts` | 5 codes: NOT_FOUND, FORBIDDEN, RETENTION_EXPIRED, ALREADY_ARCHIVED, INVALID_INPUT |
| Repository | `packages/domains/archive/src/repositories/archive.repository.ts` | findById, list, findExpiredRetention, findByInspectionId, create, update, markArchived, markDestroyed |
| Service | `packages/domains/archive/src/services/archive.service.ts` | CRUD, markArchived, markDestroyed, findExpiredRetention, archiveInspectionForm (3-year retention) |
| API validators | `packages/validators/src/api/archive.api.ts` | Response + list + create + archiveInspectionForm schemas with guillotines |
| TRPC error map | `packages/validators/src/errors/archive.errors.ts` | 5 error code → TRPCError mappings |
| tRPC router | `apps/api/src/routers/archive.router.ts` | 6 endpoints: getById, list, create, markArchived, markDestroyed, archiveInspectionForm |
| App module wiring | `apps/api/src/app.module.ts` | ArchiveRepository + ArchiveService + ArchiveRouter |

### Phase 2: Retention Enforcement ✅

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| 2.1 | `@Cron` daily job: query expired archives, mark as destroyed | `apps/api/src/jobs/retention.job.ts` | ✅ |
| 2.2 | Retention enforcement tRPC endpoints (query expired, trigger purge manually) | `apps/api/src/routers/archive.router.ts` | ✅ `listExpired` + `markDestroyed` both exist (listExpired added 2026-07-05) |

### Phase 3: Domain Integration ✅

| Step | Deliverable | Files | Status |
|------|-------------|-------|--------|
| 3.1 | Wire `InspectionService.complete()` → `ArchiveService.archiveInspectionForm()` | `packages/domains/inspection/src/services/inspection.service.ts` | ✅ |
| 3.2 | Passport seizure → archive entry creation | `packages/domains/archive/src/services/archive.service.ts` | ✅ |
| 3.3 | Error correction → archive entry creation | `packages/domains/archive/src/services/archive.service.ts` | ✅ |

## Error Codes

| Code | When |
|------|------|
| `NOT_FOUND` | Document not found |
| `FORBIDDEN` | Permission denied |
| `RETENTION_EXPIRED` | Document past retention period |
| `ALREADY_ARCHIVED` | Document already archived |
| `INVALID_INPUT` | Validation failure |

## Schema: `archive_documents` Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | `defaultRandom()` |
| `documentType` | `archive_document_type pgEnum` | PASSPORT/CENSUS_FORM/TAGGING_RECEIPT/ORDER_FORM/INSPECTION_FORM/SLAUGHTER_LIST/CORRESPONDENCE/OTHER |
| `documentRef` | `varchar(100)` | Nullable — reference number |
| `archiveLocation` | `archive_location pgEnum` | CPC/VS/VI/BIP |
| `physicalLocation` | `varchar(200)` | Nullable — shelf/box reference |
| `animalId` | `uuid` | Nullable — FK to animals |
| `farmId` | `uuid FK → farms` | Nullable — FK to farms |
| `passportId` | `uuid` | Nullable — FK to cattle_passports |
| `inspectionId` | `uuid` | Nullable — FK to inspections |
| `retentionExpiry` | `date` | NOT NULL — when document can be destroyed |
| `isArchived` | `boolean` | Default false — physically archived? |
| `archivedAt` | `timestamp` | Nullable — when archived |
| `destroyedAt` | `timestamp` | Nullable — when destroyed |
| `isActive` | `boolean` | Default true — soft delete |
| `createdAt` | `timestamp` | |
| `createdBy` | `uuid` | |
| `updatedAt` | `timestamp` | |
| `validTo` | `timestamp` | |

**Indexes:** documentType, archiveLocation, farmId, animalId, retentionExpiry
**RLS:** Org-scoped read for ADMIN/ORG_READ roles; admin-only write.

## Key Decisions

- `archiveInspectionForm()` creates a 3-year retention entry on inspection completion — idempotent (checks existing before creating)
- `findExpiredRetention()` queries `retentionExpiry < NOW() AND destroyedAt IS NULL` for scheduled cleanup
- `markArchived()` and `markDestroyed()` are separate operations — archiving is physical storage, destruction is disposal
- RLS policy allows null `farmId` documents (e.g., correspondence not tied to specific farm)

## Context Boundaries

| Bot | Reads | Writes |
|-----|-------|--------|
| **Archive Bot** | `packages/domains/archive/` | errors, repo, service |
| **Inspection Bot** | `packages/domains/inspection/` | Calls `ArchiveService.archiveInspectionForm()` on completion |
| **Validation Bot** | `packages/validators/src/api/archive.api.ts` | Archive API schemas |
| **API Bot** | `apps/api/src/routers/archive.router.ts` | tRPC router |
