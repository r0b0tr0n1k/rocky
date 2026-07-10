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
- **Row-scoping is RLS-enforced, not a JS profile resolver.** The
  `models/mobile-schema-profiles.yaml` role profiles (own_farms / org_farms / all)
  are realized by Postgres RLS (`rlsForFarmColumn` / `farmOwnedByUser` /
  `farmInOrgArea` / admin bypass in `packages/database/src/schema/rls-helpers.ts`).
  `syncDownload()` runs inside the ExecutionPipeline, so every SELECT is
  auto-scoped to the caller's role. Do NOT add a profile resolver to this domain —
  it would duplicate RLS and risk bypassing it. Column projection from the YAML is
  deferred (the wire contract returns full Diamond-Seal entities).
- **Health-record upload conflict detection is wired (gap ② closed).**
  `getCurrentEntity()` now resolves `vaccination`/`treatment`/`labTest` via
  `HealthService.getVaccination/getTreatment/getLabTest`, so the `syncUpload`
  `baseUpdatedAt` version-conflict check is no longer skipped for health pushes
  (previously `default: return null` made every health update a silent pass).
  Health *creates* (no `data.id`) still skip the check by design — there is no
  existing row to conflict with.
