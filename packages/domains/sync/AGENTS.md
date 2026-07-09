# Sync Domain Service

**Scope:** `packages/domains/sync/` — offline-first sync engine (WO-081).
**Status:** Initial implementation (promoted from a health-router stub).

## Responsibility

Server-side sync engine for PDA (handheld) clients:

- **`syncDownload(since?)`** — pulls master data (diseases, vaccines, batches,
  vaccine↔disease links) and field entities (animals, farms, movements,
  inspections, ear tags) for offline use. Post-filters by `updatedAt >= since`
  when a watermark is supplied. RLS is **auto-injected** by the ExecutionPipeline
  — this domain never sets `SET LOCAL` itself.
- **`syncUpload(records, createdBy)`** — applies PDA-created records in order with
  three guards: idempotency (by `idempotencyKey`), version/conflict check
  (`baseUpdatedAt` vs current `updatedAt`), and apply via the relevant domain
  service. Failed records spawn a correction case (when `CorrectionService` is
  wired) and are marked processed so they are never retried forever.

## Architecture

```
Router (tRPC) → SyncService (orchestrate) → domain services + SyncRepository
                     │
                     └─ SyncRepository → sync_idempotency (idempotency ledger)
                                          movements (direct read for download)
```

- `SyncService` — orchestration only, returns `Result<T, Error>` (neverthrow).
- `SyncRepository` — DB access (extends `BaseRepository`), no business logic.
- `sync_idempotency` — global table (NOT tenant-scoped), see
  `packages/database/src/schema/sync.ts`.

## Contracts

- Sync request/response/record types (`SyncDownloadRequest`, `SyncDownloadResponse`,
  `SyncUploadItem`, `SyncUploadItemType`, `SyncUploadRequest`, `SyncUploadResult`,
  `SyncUploadResponse`) live in `@rocky/validators/api` (owned by the Validation Bot).
- Error Sovereignty Doctrine applies: services return `Result`, routers map to tRPC.
- No manual RLS injection — the ExecutionPipeline scopes every query per request.

## Known Gaps

- Movement master data is read directly from the `movements` table (no list method
  on `MovementService`); raw rows are returned, not `MovementResponse`.
- Health master-data `listAll*` methods exist on `HealthRepository`, not
  `HealthService`; `syncDownload()` reuses `HealthService.syncDownload()`.
