# Todos — Populate the 12 Empty Admin Pages (empty-pages)

Granular, sequential todo list. Each item is independently implementable; follow the repo
conventions in `AGENTS.md` (SUPER_ADMIN SET LOCAL RLS transaction in seed, `Result<T,E>` services,
`createResultUnwrapper` + `*TRPC_ERROR_MAP` in routers, Zod `satisfies`, enums `as const`,
regenerate `@generated/server.ts` after new procedures).

---

## T-01 — Seed Section 8 scaffold (transaction + adminId)

**Description:** Add a new `db.transaction` block in `packages/database/src/seed.ts` right after
Section 7's try/catch (before `console.log("✅ Seed complete.")`), mirroring the Section 7 shape
with `await tx.execute(sql\`SET LOCAL "app.current_role" = 'SUPER_ADMIN'\`)` and a `42P01`
try/catch guard.
**Files touched:** `packages/database/src/seed.ts` (imports already present: `users`,`farms`,`eq`,`sql`).
**Tag:**`empty-pages`
**Code example:**

```ts
try {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL "app.current_role" = 'SUPER_ADMIN'`);
    const [adminUser] = await tx.select().from(users).where(eq(users.email, "admin@test.com")).limit(1);
    const adminId = adminUser!.id;
    const [testFarm] = await tx.select().from(farms).where(eq(farms.farmId, "100000001")).limit(1);
    // ... inserts below (T-02..T-09) ...
    console.log(`  ✓ Domain seed data inserted`);
  });
} catch (e: any) {
  if (e.cause?.code === "42P01") {
    console.warn(`  ⚠ domain tables not found - skipping`);
  } else { throw e; }
}
```

**Anti-patterns:** do NOT omit `SET LOCAL` (RLS would block inserts); do NOT hardcode UUIDs from
other sections (look ids up inside the transaction).
**Acceptance:** transaction compiles; seed still runs; verifies against ISC-7.

## T-02 — Seed cattle_passports (promote from stress-seed)

**Description:** Insert one `cattle_passports` row per seeded animal (`10000001`, `10000002`,
`10000003`) inside the Section 8 transaction. Copy the insert shape from stress-seed
`seedCoherentDependentData` `passportRows`.
**Files touched:** `packages/database/src/seed.ts` (add import `cattlePassports` from `./schema/an/index.js`; import `PASSPORT_STATUS` from `./constants/passport-status.js`; `STATE_CODE` already imported).
**Code example (from stress-seed):**

```ts
await tx.insert(cattlePassports).values([
  { passportNumber: `PASS-10000001`, stateCode: STATE_CODE.MK, animalId: a1, farmId: originFarm1Id, status: PASSPORT_STATUS.ACTIVE, issueDate: "2026-07-16" },
  // one per seeded animal (look up animalId + farmId inside tx)
]);
```

**Reference:** stress-seed `packages/database/src/stress-seed.ts` `seedCoherentDependentData`
(`passportRows.push(...)` block).
**Acceptance:** `trpc.passport.list` returns >=1 row — ISC-2.

## T-03 — Seed vs_contracts + vs_assignments (promote from stress-seed)

**Description:** Insert 1 `vs_contracts` row (`region: "Test Region"`, `status: VS_CONTRACT_STATUS.ACTIVE`,
fixed id + contractNumber) and 1 `vs_assignments` row binding it to `Test Farm` (`isPrimary: true`).
**Files touched:** `packages/database/src/seed.ts` (import `vsContracts`,`vsAssignments` from `./schema/hk/index.js`; `VS_CONTRACT_STATUS` from `./constants/vs-contract-status.js`).
**Code example:** mirror stress-seed `vsContracts`/`vsAssignments` inserts (use `onConflictDoNothing()` or fixed UUIDs for idempotency).
**Reference:** stress-seed `vsContracts`/`vsAssignments` blocks.
**Acceptance:** `trpc.vsContract.getByRegion({region:"Test Region"})` and `trpc.vsAssignment.getByFarm` return rows — ISC-2. (vs pages also gate on region/farm selection — accepted UX.)

## T-04 — Seed farm_books (promote from stress-seed)

**Description:** Insert 1 `farm_books` row for `Test Farm` (`status: FARM_BOOK_STATUS.DELIVERED`,
`deliveredAt` date).
**Files touched:** `packages/database/src/seed.ts` (import `farmBooks` from `./schema/hk/index.js`; `FARM_BOOK_STATUS` from `./constants/farm-book-status.js`).
**Code example:** mirror stress-seed `farmBooks` insert (use fixed farmId/UUID for idempotency).
**Acceptance:** `trpc.farmBook.getByFarmId({farmId})` returns a row — ISC-2.

## T-05 — Seed corrections (net-new)

**Description:** Insert 2-3 `corrections` rows (valid `detection_source`, `errorType`,
`errorDescription`, `status`; optional `farmId`/`animalId`). Use fixed UUIDs on `id` for idempotency.
**Files touched:** `packages/database/src/seed.ts` (import `corrections` from `./schema/an/index.js`; `CORRECTION_STATUS` from `./constants/correction-status.js` if available).
**Code example:** source of truth = `packages/database/src/schema/an/error-corrections.ts` column list.

```ts
await tx.insert(corrections).values([
  { id: crypto.randomUUID(), detectionSource: "field", errorType: "tag_mismatch",
    errorDescription: "Ear tag does not match registry", status: CORRECTION_STATUS.PENDING,
    farmId: testFarm!.id },
]);
```

**Acceptance:** `trpc.correction.list` returns >=1 row — ISC-2.

## T-06 — Seed pda_devices (net-new)

**Description:** Insert 1-2 `pda_devices` rows (`deviceIdentifier` unique, `deviceType: "web"`,
`currentUserId: adminId`, `createdBy: adminId`).
**Files touched:** `packages/database/src/seed.ts` (import `pdaDevices` from `./schema/an/index.js`; `DEVICE_STATUS`/`DEVICE_TYPE` if applicable).
**Code example:** source of truth = `packages/database/src/schema/an/pda-devices.ts`.
**Acceptance:** `trpc.device.list` returns >=1 row — ISC-2.

## T-07 — Seed iot_devices + sensor_readings (net-new)

**Description:** Insert 1-2 `iot_devices` (`deviceEui` unique, `assignedToFarmId: testFarm`,
`status: "active"`, `createdBy: adminId`), then 2-3 `sensor_readings` referencing an inserted
`iotDevices.id` (`recordedAt`, `readingType` enum, `valueNumeric`+`unit`).
**Files touched:** `packages/database/src/seed.ts` (import `iotDevices`,`sensorReadings` from `./schema/an/index.js`; reading-type enum constant).
**Code example:** source of truth = `packages/database/src/schema/an/iot-devices.ts` and `sensor-readings.ts`.
**Acceptance:** `trpc.iot.listDevices` + `trpc.iot.listReadings` return rows — ISC-2.

## T-08 — Seed notifications (net-new)

**Description:** Insert 3-5 `notifications` rows for `adminId` (`type`, `category`, `priority`,
`subject`, `message`, `status: "UNREAD"`). Use fixed UUIDs on `id` for idempotency.
**Files touched:** `packages/database/src/seed.ts` (import `notifications` from `./schema/sm/notifications.js`; notification-type/category/priority/status enums from `./constants/...`).
**Code example:** insert schema source = `packages/database/src/schema/sm/notifications.ts`. Mirror
the `sendNotificationSchema` field set.
**Acceptance:** feeds ISC-3/ISC-4; `trpc.notification.list` (added in T-10) returns these rows.

## T-09 — Seed audit_log (net-new)

**Description:** Insert 3-5 `audit_log` rows (`action` enum, `resource`, `source` enum (non-null!),
`success: true`, `userId: adminId`).
**Files touched:** `packages/database/src/seed.ts` (import `auditLog` from `./schema/sm/audit-log.js`; `eventSourceSchema`/enum constant).
**Code example:** source of truth = `packages/database/src/schema/sm/audit-log.ts` (note `source` is
NOT NULL enum).
**Acceptance:** `trpc.audit.list` returns >=1 row — ISC-2.

## T-10 — NotificationRouter.list Query procedure

**Description:** Add `@Query({ input: notificationListRequestSchema, output: notificationOutputSchema })`
`async list(...)` to `NotificationRouter` calling `NotificationService.list({ userId: ctx.execution!.principal.id, ...input })` via the existing `unwrapResult`. Add a guillotine type alias
(`_verify_listOutput`) like the others.
**Files touched:** `apps/api/src/routers/notification.router.ts` (import `notificationListRequestSchema`, `notificationOutputSchema` from `@rocky/validators/api`).
**Code example:** mirror existing `unreadCount` shape; service method exists at
`packages/domains/notification/src/services/notification.service.ts:148` (`list(input)`), validates
`listNotificationsSchema` (requires `userId`).
**Anti-patterns:** do NOT `return res.data`; use `unwrapResult(await this.notificationService.list({ userId: ctx.execution!.principal.id, ...input }))`.
**Acceptance:** new procedure present in AppRouter — ISC-3.

## T-11 — Regenerate + commit AppRouter types

**Description:** After T-10, regenerate generated tRPC server types and commit.
**Files touched:** `packages/trpc/src/generated/server.ts` (auto-generated; commit).
**Command:** `cd apps/api && npx nestjs-trpc generate --entrypoint src/app.module.ts --output ../../packages/trpc/src/generated` then `git add packages/trpc/src/generated/server.ts`.
**Acceptance:** `@generated/server.ts` includes `notification.list` — ISC-A-2.

## T-12 — Render notifications DataTable on the page

**Description:** In `apps/web/app/(admin)/notifications/page.tsx`, add
`useQuery(trpc.notification.list.queryOptions({ limit: 20, offset: 0 }))` and render a `<DataTable>`
of notifications (columns: subject, category, priority, status, createdAt). Keep the existing unread
`Badge`.
**Files touched:** `apps/web/app/(admin)/notifications/page.tsx` (import `notificationListRequestSchema`/`notificationOutputSchema` from `@rocky/validators/api`; mirror the DataTable used on `apps/web/app/(admin)/passports/page.tsx`).
**Code example:** mirror `passports/page.tsx` DataTable wiring (`useTRPC`, `useQuery`, render rows).
**Acceptance:** page shows a list of notifications, not only the badge — ISC-4.

## T-13 — Documentation note for the 3 interaction-gated pages

**Description:** Add a one-line comment in `seed.ts` Section 8 noting movement-lineage / subjects /
sync are working-as-designed (render after user interaction over seeded data). No code change to
those pages.
**Files touched:** `packages/database/src/seed.ts` (comment only).
**Acceptance:** ISC-A-1 satisfied (no page wiring change to the 3 pages).

## T-14 — Guardians + manual verification

**Description:** Run `pnpm check:adrs && pnpm check:md-links && pnpm check:standards`; run
`pnpm -C packages/database seed` (confirm all 8 tables + notifications + audit_log populated, and an
idempotent re-run); load all 12 admin pages and confirm 8 seeded pages show rows, notifications list
renders, and movement-lineage/subjects/sync work after interaction.
**Files touched:** none (verification only).
**Acceptance:** all ISC items green; Definition of Done met.
