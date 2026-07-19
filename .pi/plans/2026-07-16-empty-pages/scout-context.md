# Empty Admin Pages — Root-Cause Map (apps/web/(admin)/)

Source of truth for seed = `packages/database/src/seed.ts` (the default `pnpm seed`).
A separate `packages/database/src/stress-seed.ts` exists but is NOT the default seed.

## Domain table → seeded?

| Domain | Table | In seed.ts? | In stress-seed.ts? |
|---|---|---|---|
| animals / movements | animals, movements | ✅ (3 each) | ✅ |
| subjects / farms | subjects, farms, farm_subjects | ✅ (2 subjects, 5 farms) | ✅ |
| passports | cattle_passports | ❌ | ✅ |
| vs-contracts | vs_contracts | ❌ | ✅ |
| vs-assignments | vs_assignments | ❌ | ✅ |
| farm-books | farm_books | ❌ | ✅ |
| corrections | corrections | ❌ | ❌ |
| devices | pda_devices | ❌ | ❌ |
| iot | iot_devices, sensor_readings | ❌ | ❌ |
| notifications | notifications | ❌ | ❌ |
| audit | audit_log | ❌ | ❌ |

All tRPC procedures referenced by these 12 pages EXIST in `packages/trpc` AppRouter /
`apps/api/src/routers/*` — none are missing (rules out cause (b)).
Admin user = `admin@test.com` = `SUPER_ADMIN`, so every RLS policy
(`staffOrVetAccess`, `subjectAccess`, etc. in `rls-policies.ts`) passes — no RLS/role
blocking of the seeded data (rules out (d) for the seeded domains).

---

## 1. movement-lineage — `apps/web/app/(admin)/movement-lineage/page.tsx`

Renders a `Timeline`. Calls `trpc.animal.list` + `trpc.movement.getLineage({animalId})`,
but the lineage query has `enabled: !!animalId` — it does NOT run until an animal is
picked from the dropdown. `getLineage` → `MovementRouter.getLineage` (`movement.router.ts:79`,
`lineageRequestSchema`). Reads `movements` (seeded: 3).
**VERDICT (e):** Conditionally rendered — only fetches after an animal is selected.
Animals/movements ARE seeded, so data would appear once selected; page is not empty due to
missing data.

## 2. passports — `apps/web/app/(admin)/passports/page.tsx`

Renders a `DataTable`. Calls `trpc.passport.list` on mount (no enabled gate) +
`trpc.animal.list`, `trpc.farm.list`. `passport.list` → `PassportRouter` (`passport.router.ts:45`,
`passportListRequestSchema`) → `cattle_passports`. Table is NOT seeded in `seed.ts`.
**VERDICT (c):** No seed data — `cattle_passports` has 0 rows under default seed. (stress-seed
seeds it, but that's not the default path.)

## 3. vs-contracts — `apps/web/app/(admin)/vs-contracts/page.tsx`

Renders a `DataTable`. Calls `trpc.vsContract.getByRegion({region})` with `enabled: region.length > 0`.
→ `VsContractRouter.getByRegion` (`vs-contract.router.ts:49`, `regionParam`) → `vs_contracts`.
Not seeded in `seed.ts`.
**VERDICT (c):** No seed data — even with a region typed, `vs_contracts` is empty. (Secondary (e):
query gated on non-empty region input.)

## 4. vs-assignments — `apps/web/app/(admin)/vs-assignments/page.tsx`

Renders a `DataTable`. Calls `trpc.vsAssignment.getByFarm({farmId})` with `enabled: !!farmId`
→ `VsAssignmentRouter.getByFarm` (`vs-assignment.router.ts:44`, `farmIdParam`) → `vs_assignments`.
Not seeded in `seed.ts`.
**VERDICT (c):** No seed data. (Secondary (e): query gated on farm selection.)

## 5. corrections — `apps/web/app/(admin)/corrections/page.tsx`

Renders a `DataTable`. Calls `trpc.correction.list` on mount → `CorrectionRouter` (`correction.router.ts:43`,
`correctionListRequestSchema`) → `corrections`. Not seeded anywhere (not in seed.ts or stress-seed.ts).
**VERDICT (c):** No seed data — `corrections` is empty in all seeds.

## 6. farm-books — `apps/web/app/(admin)/farm-books/page.tsx`

Renders a `DataTable`. Calls `trpc.farmBook.getByFarmId({farmId})` with `enabled: !!farmId`
→ `FarmBookRouter.getByFarmId` (`farm-book.router.ts:43`, `farmIdParam`) → `farm_books`.
Not seeded in `seed.ts`.
**VERDICT (c):** No seed data. (Secondary (e): gated on farm selection.)

## 7. subjects — `apps/web/app/(admin)/subjects/page.tsx`

Renders a `DataTable`. Calls `trpc.subject.search({q})` with `skipToken` until a query is typed
(`q.trim() ? ... : skipToken`) + `trpc.farm.list`. `subject.search` → `SubjectRouter` (`subject.router.ts:56`,
`searchParam`) → `subjects` (seeded: 2).
**VERDICT (e):** Conditionally rendered — only searches after the user types. Subjects ARE seeded,
so results appear once searched.

## 8. devices — `apps/web/app/(admin)/devices/page.tsx`

Renders a `DataTable`. Calls `trpc.device.list` on mount → `DeviceRouter` (`device.router.ts:48`,
`pdaDeviceListRequestSchema`) → `pda_devices`. Not seeded anywhere.
**VERDICT (c):** No seed data — `pda_devices` is empty.

## 9. iot — `apps/web/app/(admin)/iot/page.tsx`

Two tabs (Devices / Readings). Calls `trpc.iot.listDevices` + `trpc.iot.listReadings` on mount
→ `IotRouter` (`iot.router.ts:52` listDevices, `:74` listReadings) → `iot_devices`, `sensor_readings`.
Neither table is seeded anywhere.
**VERDICT (c):** No seed data — both IoT tables are empty.

## 10. sync — `apps/web/app/(admin)/sync/page.tsx`

Renders count cards. Calls `trpc.sync.syncDownload({since})` with `enabled: false` — it does NOT
auto-fetch; a "Pull snapshot" button calls `download.refetch()`. `syncDownload` → `SyncRouter`
(`sync.router.ts:34`) aggregates seeded entities (animals, farms, movements, inspections, ear tags,
diseases, vaccines, batches, vaccine_diseases).
**VERDICT (e):** Data only loads on manual button click (query disabled by default). If clicked, it
WOULD show counts from seeded tables — so not a seed problem.

## 11. notifications — `apps/web/app/(admin)/notifications/page.tsx`

Renders a single "N unread" `Badge`. Calls ONLY `trpc.notification.unreadCount` — there is NO list
query (and `NotificationRouter` exposes no `list` procedure, only `unreadCount` + mutations).
`notifications` table is not seeded anywhere.
**VERDICT (a):** Stub/placeholder — the page never fetches or renders a notification list, only an
unread count. No seed data → count is 0 regardless.

## 12. audit — `apps/web/app/(admin)/audit/page.tsx`

Renders a `DataTable`. Calls `trpc.audit.list` on mount → `AuditRouter` (`audit.router.ts:34`) →
`audit_log`. The seed only does INSERTs (no audit writes) and `audit_log` is not seeded anywhere,
so it stays empty.
**VERDICT (c):** No seed data — `audit_log` has 0 rows (audit rows are only produced by mutation
triggers, none of which run during seed).

---

## Overall summary (by cause)

- **No seed data (c): 8 pages** — passports, vs-contracts, vs-assignments, corrections,
  farm-books, devices, iot, audit. (vs-contracts/vs-assignments/farm-books/passports are also
  gated behind a region/farm selector, but emptiness is fundamentally due to empty tables.)
- **Page does not fetch / stub (a): 1 page** — notifications (only renders a count badge; no list).
- **Procedure missing (b): 0 pages** — all referenced procedures exist.
- **RLS / permissions (d): 0 pages** — admin is SUPER_ADMIN; all policies pass; only the
  *seeded* domains (movements, subjects) are even subject to RLS and those pass.
- **Conditional render hides data (e): 3 pages** — movement-lineage, subjects, sync (all three
  sit on seeded data and would show rows once triggered).

## Bottom line

The fix is **overwhelmingly a seeding problem**, not page wiring or backend. 8 of 12 empty pages
have valid procedures, valid RLS, and valid UI — they are simply backed by tables that
`seed.ts` never populates. The remaining 4 are: 1 genuine stub (notifications), and 3 valid
pages that only render after user interaction (movement-lineage needs an animal pick, subjects
needs a search, sync needs a button click) — all three sit on seeded data and work.

Recommended action: extend `packages/database/src/seed.ts` to insert rows for
`cattle_passports`, `vs_contracts`, `vs_assignments`, `farm_books`, `corrections`,
`pda_devices`, `iot_devices`/`sensor_readings`, `notifications`, and to emit `audit_log`
entries (or wire a trigger) so the admin screens have something to show. (Note:
`stress-seed.ts` already covers passports/vs-contracts/vs-assignments/farm-books — consider
promoting those inserts into the default `seed.ts`, and add the rest.)
