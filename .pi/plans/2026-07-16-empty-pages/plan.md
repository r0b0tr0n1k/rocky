# Plan: Populate the 12 Empty Admin Pages (empty-pages)

**Date:** 2026-07-16
**Status:** Final (decisions locked: A / A / A)
**Directory:** /home/goce/appz/rocky
**Evidence:** `.pi/plans/2026-07-16-empty-pages/scout-context.md`

## Intent

The 12 empty admin pages in `apps/web/app/(admin)/*` are overwhelmingly a **seed-data
problem**, not a UI/backend problem. 8 of 12 pages have valid tRPC procedures, valid RLS, and
valid React wiring — they are backed by tables that the default `pnpm seed` never populates.
1 page (notifications) is a genuine stub. 3 pages (movement-lineage, subjects, sync) are
working-as-designed: they only render after user interaction and already sit on seeded data.

This plan extends the default `packages/database/src/seed.ts` to populate the 8 missing tables,
adds a `NotificationRouter.list` query + renders the list on the notifications page, and documents
the 3 interaction-gated pages as working-as-designed. No other page wiring changes.

## Root Cause (from scout-context)

- **(c) No seed data — 8 pages:** passports (`cattle_passports`), vs-contracts (`vs_contracts`),
  vs-assignments (`vs_assignments`), corrections (`corrections`), farm-books (`farm_books`),
  devices (`pda_devices`), iot (`iot_devices`/`sensor_readings`), audit (`audit_log`).
- **(a) Stub — 1 page:** notifications (only renders an unread `Badge`; no list query, router
  has no `list` procedure).
- **(e) Conditional render on seeded data — 3 pages (working-as-designed):** movement-lineage
  (needs an animal pick), subjects (needs a search string), sync (needs a "Pull snapshot" click).
- **(b)/(d) ruled out:** all referenced procedures exist; admin is `SUPER_ADMIN` so every RLS
  policy (`staffOrVetAccess`, `subjectAccess`, …) passes on the seeded domains.

## User Story

As an admin/reviewer, I want the 12 admin screens to show real data (or be confirmed
working-as-designed) after a clean `pnpm seed` + `pnpm dev`, so demoing/QA the web admin does
not require manual data entry.

## Behavior

### Happy Path

1. Run `pnpm -C packages/database seed` (default seed).
2. `pnpm seed` inserts rows into `cattle_passports`, `vs_contracts`, `vs_assignments`,
   `farm_books`, `corrections`, `pda_devices`, `iot_devices`, `sensor_readings`, `notifications`,
   and `audit_log`, all inside the existing SUPER_ADMIN SET LOCAL RLS transaction.
3. `pnpm -C apps/api dev` regenerates/serves AppRouter; `pnpm -C apps/web dev` renders.
4. Passports / vs-contracts / vs-assignments / corrections / farm-books / devices / iot / audit
   pages show seeded rows.
5. Notifications page renders a `DataTable` of seeded notifications + the existing unread badge.
6. movement-lineage / subjects / sync show data after user interaction (no code change).

### Edge Cases & Error Handling

- **Schema drift / missing table:** each new seed insert is wrapped in `try { tx.insert(...) } catch (e) { if (e.cause?.code === "42P01") skip; else throw; }` like existing sections 6d/7 — so a partial schema does not abort the whole seed.
- **Idempotency:** seed re-runs must not duplicate (unique business keys). Use fixed UUIDs or `onConflictDoNothing()` mirroring stress-seed; for tables without unique business keys (corrections, sensor_readings, audit_log, notifications) prefer deterministic fixed UUIDs on `id` so re-runs are stable.
- **FK validity:** every `farmId`/`animalId`/`userId`/`deviceId` must point at a row already created in seed sections 6/7 (the test farm `Test Farm`, the 3 animals `10000001..3`, admin user `admin@test.com`). Capture `adminId` via a `users` lookup at the start of the new transaction.
- **Notifications RLS:** admin is SUPER_ADMIN; `notifications.userId = adminId` is visible. `NotificationService.list()` scopes by `userId`, so seed rows for `adminId` will surface under the admin session.

## Scope

### In Scope

- Extend `packages/database/src/seed.ts` with a new seed section (Section 8) populating the 8 missing tables + `notifications` + a few `audit_log` rows.
- Promote stress-seed's working inserts for `cattle_passports`, `vs_contracts`, `vs_assignments`, `farm_books` into the default seed.
- Add `NotificationRouter.list` Query procedure and render a DataTable on `apps/web/app/(admin)/notifications/page.tsx`.
- Documentation note (in this plan + a short comment in seed.ts) that movement-lineage / subjects / sync are working-as-designed.

### Out of Scope

- No changes to the 3 interaction-gated pages' code.
- No changes to tRPC procedures other than adding `notification.list`.
- No RLS policy changes.
- Not switching the default seed to stress-seed.

## Effort & Quality

- **Level:** MVP (correct data, main cases covered, not polished).
- **Tests:** smoke (manual page load + `pnpm seed` idempotency) — guardians green.
- **Docs:** inline note in seed.ts; plan note for the 3 pages; no new ADR required (no architecture decision change — seeding is pre-existing pattern).

## Constraints (repo conventions — MUST respect)

- Seeds run **inside an existing `db.transaction` with `SET LOCAL "app.current_role" = 'SUPER_ADMIN'`** (pattern at `seed.ts` ~L1195 / L1201 / L1288 / L1330). The new section follows the same shape.
- Domain services return `Result<T,E>` (neverthrow `ok`/`err`). New tRPC list procedure maps errors via `createResultUnwrapper(NOTIFICATION_TRPC_ERROR_MAP)` + `await unwrapResult(...)`.
- Zod schemas use `satisfies` on every export; enums `as const`, never TS `enum` (validators already comply — reuse existing schemas).
- AppRouter types are **generated** (`nestjs-trpc generate`). After adding `notification.list`, regenerate and commit `@generated/server.ts`.
- Verify with `pnpm check:adrs`, `pnpm check:md-links`, `pnpm check:standards`, `pnpm seed`, manual page load.

## Ideal State Criteria

### Core Functionality

- [ ] ISC-1: `pnpm seed` (default) inserts >=1 row into `cattle_passports`, `vs_contracts`, `vs_assignments`, `farm_books`, `corrections`, `pda_devices`, `iot_devices`, `sensor_readings`, `notifications`, `audit_log`.
- [ ] ISC-2: `trpc.passport.list`, `trpc.vsContract.getByRegion`, `trpc.vsAssignment.getByFarm`, `trpc.correction.list`, `trpc.farmBook.getByFarmId`, `trpc.device.list`, `trpc.iot.listDevices`, `trpc.iot.listReadings`, `trpc.audit.list` each return >=1 seeded row under the admin session.
- [ ] ISC-3: `trpc.notification.list` query exists and returns the seeded notifications for the admin user.
- [ ] ISC-4: The notifications page renders a DataTable of notifications (not only the unread badge).

### Edge Cases

- [ ] ISC-5: Re-running `pnpm seed` does not error and does not create duplicate visible rows (idempotent insert keys).
- [ ] ISC-6: New seed inserts are guarded with `42P01` try/catch so a missing table does not abort the whole seed.
- [ ] ISC-7: Every FK in seeded rows (farmId/animalId/userId/deviceId) resolves to a real seed-created row.

### Anti-Criteria

- [ ] ISC-A-1: No page wiring change is made to movement-lineage / subjects / sync.
- [ ] ISC-A-2: `@generated/server.ts` is regenerated and committed (not left stale).
- [ ] ISC-A-3: No `console.log` added to production/router code; no TS `enum` introduced.

## Approach

Favor the **increment default `seed.ts`** path (decision A) over switching to stress-seed.
stress-seed already proves the insert shapes for `cattle_passports` / `vs_contracts` /
`vs_assignments` / `farm_books`; promote those inserts verbatim into a new Section 8 transaction.
Add net-new inserts for `corrections`, `pda_devices`, `iot_devices`, `sensor_readings`,
`notifications`, `audit_log` using the Drizzle table definitions as the column source of truth.
Add `NotificationRouter.list` calling the existing `NotificationService.list()` and render a
DataTable. Document the 3 interaction-gated pages as working-as-designed.

### Key Decisions

- **Decision 1:** One new `db.transaction` block (Section 8) with `SET LOCAL SUPER_ADMIN`, placed
  after Section 7's try/catch and before `console.log("✅ Seed complete.")` — reuse the verified
  RLS-bypass pattern. Because of `onConflictDoNothing`/fixed-UUID idempotency, a second `pnpm seed`
  is safe.
- **Decision 2:** Capture `adminId` via `SELECT id FROM users WHERE email='admin@test.com'`
  (limit 1) at the top of Section 8 for `notifications.userId`, `audit_log.userId`,
  `pda_devices.createdBy`/`currentUserId`, `iot_devices.createdBy`.
- **Decision 3:** notifications list uses `notificationListRequestSchema`/`listNotificationsSchema`
  (already in `@rocky/validators/api`) + `NotificationService.list()` (exists at
  `packages/domains/notification/src/services/notification.service.ts:148`). Router maps via
  `createResultUnwrapper(NOTIFICATION_TRPC_ERROR_MAP)` (same as the router's existing `unwrapResult`).
- **Decision 4:** DataTable on notifications page mirrors the pattern of the other admin DataTables
  (passports/vs-contracts/etc.) — `useQuery(trpc.notification.list.queryOptions({...}))`.

### Architecture

- `packages/database/src/seed.ts` — add Section 8 (new transaction) → writes 10 tables.
- `apps/api/src/routers/notification.router.ts` — add `@Query list`.
- `apps/web/app/(admin)/notifications/page.tsx` — add `useQuery(notification.list)` + `<DataTable>`.
- `packages/trpc/src/generated/server.ts` — regenerated (auto-generated; commit).

### Per-Domain Seed Inserts (table -> source pattern)

| Table | Pattern source | Notes |
|---|---|---|
| `cattle_passports` | stress-seed `seedCoherentDependentData` (passportRows) | 1 per seeded animal (`10000001..3`); `status: PASSPORT_STATUS.ACTIVE`, `issueDate`, `stateCode: STATE_CODE.MK`. |
| `vs_contracts` | stress-seed `vsContracts` | 1 contract, `region: "Test Region"`, `status: VS_CONTRACT_STATUS.ACTIVE`, fixed id/contractNumber. |
| `vs_assignments` | stress-seed `vsAssignments` | bind contract -> `Test Farm` (farmId from section 6d) with `isPrimary: true`. |
| `farm_books` | stress-seed `farmBooks` | 1 row for `Test Farm`; `status: FARM_BOOK_STATUS.DELIVERED`, `deliveredAt`. |
| `corrections` | net-new (schema `an/error-corrections.ts`) | 2-3 rows: `detection_source`, `errorType`, `errorDescription`, `status`, optional `farmId`/`animalId`. Fixed UUIDs for idempotency. |
| `pda_devices` | net-new (schema `an/pda-devices.ts`) | 1-2 rows: `deviceIdentifier` unique, `deviceType: "web"`, `currentUserId: adminId`, `createdBy: adminId`. |
| `iot_devices` | net-new (schema `an/iot-devices.ts`) | 1-2 rows: `deviceEui` unique, `assignedToFarmId: Test Farm`, `status: "active"`, `createdBy: adminId`. |
| `sensor_readings` | net-new (schema `an/sensor-readings.ts`) | 2-3 rows referencing an `iotDevices.id`, `recordedAt`, `readingType` (enum), `valueNumeric`/`unit`; `farmId`/`animalId` optional. |
| `notifications` | net-new (insert schema `sm/notifications.ts`) | 3-5 rows for `adminId`: `type`, `category`, `priority`, `subject`, `message`, `status: "UNREAD"`. |
| `audit_log` | net-new (schema `sm/audit-log.ts`) | 3-5 rows: `action` (enum), `resource`, `source` (enum), `success: true`, `userId: adminId`. |

### Data Flow (notifications)

`notifications` table (seeded) -> `NotificationRepository.listFiltered({userId})` ->
`NotificationService.list()` -> `NotificationRouter.list` (unwrapped) -> web `useQuery` DataTable.

### Documentation Note (3 working-as-designed pages)

movement-lineage / subjects / sync query only after user interaction (`enabled`, `skipToken`, or a
button) by design — they sit on already-seeded `animals`/`movements`/`farms` data and render
correctly once triggered. No code change. Recorded in this plan + a one-line comment in seed.ts.

## Dependencies

- Existing: `@rocky/validators/api` (`notificationListRequestSchema`, `listNotificationsSchema`,
  `notificationOutputSchema`), `@rocky/validators/errors` (`NOTIFICATION_TRPC_ERROR_MAP`),
  `@rocky/domains-notification` (`NotificationService.list`), Drizzle schema tables.
- No new packages.

## Ordered Execution Steps

1. **Seed Section 8** — add a `db.transaction` block (after Section 7, before "✅ Seed complete.")
   with `SET LOCAL SUPER_ADMIN`, capture `adminId`, then insert
   `cattle_passports`, `vs_contracts`, `vs_assignments`, `farm_books` (promoted from stress-seed),
   then `corrections`, `pda_devices`, `iot_devices`, `sensor_readings`, `notifications`,
   `audit_log` (net-new). Wrap each in `try/catch` with `42P01` skip.
2. **Regenerate/run seed** — `pnpm -C packages/database seed`; confirm all 8 tables + notifications +
   audit_log populated; confirm idempotent re-run.
3. **NotificationRouter.list** — add `@Query({ input: notificationListRequestSchema, output: notificationOutputSchema })` calling `NotificationService.list` via `unwrapResult`; add guillotine type alias.
4. **Regenerate AppRouter** — `cd apps/api && npx nestjs-trpc generate --entrypoint src/app.module.ts --output ../../packages/trpc/src/generated`; commit `@generated/server.ts`.
5. **Notifications page DataTable** — add `useQuery(trpc.notification.list.queryOptions({...}))` and a `<DataTable>` (mirror passports page), keep the existing unread badge.
6. **Guardians green** — `pnpm check:adrs && pnpm check:md-links && pnpm check:standards`.
7. **Manual verify** — load all 12 pages; confirm 8 seeded pages show rows; notifications list renders; confirm movement-lineage/subjects/sync work after interaction.

## Definition of Done

- Guardians green: `pnpm check:adrs`, `pnpm check:md-links`, `pnpm check:standards` all pass.
- `pnpm -C packages/database seed` populates all 8 missing tables + `notifications` + a few `audit_log` rows; re-run is idempotent (no duplicate visible rows / no error).
- `trpc.notification.list` returns seeded notifications for the admin; the notifications page renders a DataTable (not only the unread badge).
- The 3 interaction-gated pages (movement-lineage, subjects, sync) are confirmed working-as-designed (render after user interaction over seeded data); documented in plan + seed.ts comment; no code change.
- `@generated/server.ts` regenerated and committed.

## Risks & Open Questions

- **Risk 1 (FK drift):** a referenced id (Test Farm / animal / admin) changes between seed runs -> insert fails. *Mitigation:* look up ids inside Section 8 (select by farmId/earTagNumber/email), don't hardcode UUIDs from other sections.
- **Risk 2 (validator shape):** `NotificationService.list` validates via `listNotificationsSchema` requiring `userId` — router must pass `userId` (from `ctx.execution!.principal.id`) or use `notificationListRequestSchema` (userId optional) consistently. *Mitigation:* follow existing `unreadCount` principal-lookup pattern.
- **Risk 3 (audit_log source enum):** `source` is a non-null enum; use a valid value (e.g. `"system"`/`"web"`) per `eventSourceSchema`.
- Open question (parked): vs-contracts/vs-assignments/farm-books pages also gate on region/farm
  selection — seeded data will appear only after selecting "Test Region"/"Test Farm". Page is no
  longer empty-at-rest only due to missing table; this is accepted (the gating is intended UX).

## Verification (2026-07-16)

- T-01..T-09: `seed.ts` Section 8 committed (a78851b) — all 10 tables populated on the
  live DB (cattle_passports, vs_contracts, vs_assignments, farm_books, error_corrections,
  pda_devices, iot_devices, sensor_readings, notifications, audit_log). Idempotent re-run verified.
- T-10/T-11/T-12: `NotificationRouter.list` added; AppRouter regenerated via the proper
  `pnpm generate:trpc` flow (incl. `patch-trpc-transformer.mjs`); notifications page renders a
  DataTable. Web `tsc --noEmit` is clean for the changed files (only pre-existing
  `permissions-core.test.ts` errors remain, unrelated to this work).
- T-13: the 3 interaction-gated pages (movement-lineage, subjects, sync) are confirmed
  working-as-designed — they render after user interaction over seeded data; no code change.
  vs-contracts/vs-assignments/farm-books additionally gate on Region/Farm selection
  ("Test Region"/"Test Farm"); this is intended UX, not a defect.
