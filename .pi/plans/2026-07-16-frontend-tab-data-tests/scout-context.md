# Scout Context: Frontend Tab Data-Wiring & Test Coverage

**Date:** 2026-07-16
**Scope:** Reconnaissance only — no code written. Identifies which frontend "tabs" (mobile tab group + web admin nav) lack (a) live data wiring and (b) tests, plus the tRPC client patterns and test infra the planner needs.

---

## TL;DR

- **Web admin (29 top-level nav tabs):** ALL are wired to live tRPC data. **ZERO screen/tab tests exist.** The vitest config only picks up `lib/**/*.test.ts` in a `node` environment, so screen tests aren't even runnable yet.
- **Mobile (11 tabs):** 7 tabs are fully wired; **4 tabs have NO live data** (`explore`/Profile, `health` index, `movements` index, `sync` — sync is local-only by design). Health/movements sub-screens are create-only (mutation submit, no list/query to populate existing records). **ZERO mobile screen tests** — and the mobile app has **no test runner configured at all** (no `test` script, no vitest/jest dependency; its one test file uses Node's built-in `node:test` and is never executed).
- **Every tab's backend router exists** in `packages/trpc/src/generated/server.ts`. No missing routers/enums block wiring.
- **Test infra gap:** `@rocky/testing` provides data factories only — no React render helper and no tRPC mock. Web needs `jsdom`/`happy-dom` + a screen-test `include` glob + RTL; mobile needs a whole test runner stood up.

---

## 1. Mobile Tabs — `apps/mob/app/(tabs)/`

Tab bar is defined in `apps/mob/app/(tabs)/_layout.tsx` (lines 30-80, `Tabs.Screen` entries, gated by `can(permission)` mirroring web `filterNavByPermissions`). The 11 real tabs:

| # | Tab (route) | File | Permission gate |
|---|-------------|------|-----------------|
| 1 | Home | `(tabs)/index.tsx` | always |
| 2 | Animals | `(tabs)/animals/index.tsx` | `animal:read` |
| 3 | Health | `(tabs)/health/index.tsx` | `health:read` |
| 4 | Movements | `(tabs)/movements/index.tsx` | `movement:read` |
| 5 | Inspections | `(tabs)/inspections/index.tsx` | `analysis:read` |
| 6 | Ear Tags | `(tabs)/eartags/index.tsx` | `eartag:read` |
| 7 | Passport | `(tabs)/passport/index.tsx` | `passport:read` |
| 8 | Corrections | `(tabs)/corrections/index.tsx` | `correction:read` |
| 9 | Alerts | `(tabs)/notifications/index.tsx` | `notification:read` |
| 10 | Sync | `(tabs)/sync/index.tsx` | always |
| 11 | Profile | `(tabs)/explore.tsx` | always |

### Per-tab table (mobile)

Columns: `tab | sub-screens | has live data? | has test? | backend router exists? | notes`

| Tab | Sub-screens | Live data? | Test? | Backend router? | Notes |
|-----|-------------|-----------|-------|-----------------|-------|
| **Home** (`index.tsx`) | — | **YES** | NO | animal ✅ / notification ✅ | `trpc.animal.list.useQuery({limit:5})` (L18), `trpc.notification.unreadCount.useQuery()` (L16) |
| **Animals** | `[id].tsx`, `create.tsx`, `birth.tsx`, `search.tsx` | **YES** | NO | animal ✅ | index: `animal.list` (L18); `[id]`: `animal.getById` (L12); `search`: `animal.findByTag` (L23); `create`/`birth`: `animal.create` mutation (L87/L86) |
| **Health** | `vaccination.tsx`, `treatment.tsx`, `lab-test.tsx` | **NO (index)** | NO | health ✅ | **index.tsx: navigation cards only, no query** (verified — no `trpc`/`fetch`). Sub-screens only `useMutation` (`health.recordVaccination` L87, `health.recordTreatment` L69, `health.recordLabTest` L107) — **no query to load existing vaccines/treatments/lab-tests/animals**. Pure create-forms. |
| **Movements** | `death.tsx`, `pasture.tsx`, `slaughter.tsx` | **NO (index)** | NO | movement ✅ | **index.tsx: navigation cards only, no query**. Sub-screens only mutations (`movement.recordDeath` L54, `declarePasture` L63, `recordSlaughter` L55). No list of past movements. |
| **Inspections** | `[id].tsx` | **YES** | NO | inspection ✅ | index: `inspection.list` (L11); `[id]`: `inspection.getById` (L20) + `complete` mutation (L30) |
| **Ear Tags** | `create-order.tsx`, `collect-tags.tsx` | **YES** | NO | earTag ✅ | index: `earTag.listOrders` (L12); `create-order`: `earTag.createOrder` (L62); `collect-tags`: `earTag.collectOrderTags` (L16) |
| **Passport** | `[id].tsx` | **YES** | NO | passport ✅ | index: `passport.list` (L11); `[id]`: `passport.getById` (L12) |
| **Corrections** | `[id].tsx` | **YES** | NO | correction ✅ | index: `correction.list` (L18); `[id]`: `correction.getById` (L17) + review/resolve/escalate mutations (L22/L26/L30) |
| **Alerts** | — | **YES** | NO | notification ✅ | `notification.unreadCount` (L11) + `notification.markAsRead` mutation (L12) |
| **Sync** | — | **NO (by design)** | NO | sync ✅ (unused) | `sync/index.tsx` uses local `useOffline()` hook (outbox SQLite) — no tRPC query. Backend `sync.syncDownload`/`syncUpload` exist but not called here. |
| **Profile** (`explore.tsx`) | — | **NO** | NO | n/a | Sign-out screen only (`signOut()`). No data needed. |

**Mobile data gaps:** `explore` (Profile), `health` index, `movements` index, `sync` index. Additionally `health`/`movements` sub-screens are create-only (no query to prefill/lookup existing records).

---

## 2. Web Admin Nav — `apps/web/app/(admin)/`

Nav is defined in `apps/web/lib/nav-config.ts` (`navSections`, filtered by `filterNavByPermissions` in `apps/web/components/admin-shell.tsx` L37/L58). 29 top-level entries. All are Next.js `page.tsx` client components using `useTRPC()` + TanStack `useQuery(trpc.x.queryOptions(...))`.

### Per-route table (web)

Columns: `tab | route | has live data? | has test? | backend router? | procedure(s) used`

| Tab | Route | Live data? | Test? | Backend router? | Procedure(s) |
|-----|-------|-----------|-------|-----------------|--------------|
| Dashboard | `/dashboard` | **YES** | NO | animal ✅ / movement ✅ / farm ✅ / inspection ✅ | via `useDashboardData()` → `useQuery(trpc.animal.list …)` (`components/dashboard/analytics.tsx`) |
| Animals | `/animals` | **YES** | NO | animal ✅ | `animal.list` (`animals/page.tsx` L30) |
| Movements | `/movements` | **YES** | NO | movement ✅ / farm ✅ / animal ✅ | `movement.list`, `farm.list`, `animal.list` (L37-38) |
| Movement Lineage | `/movement-lineage` | **YES** | NO | animal ✅ | `animal.list` (L23) |
| Passports | `/passports` | **YES** | NO | passport ✅ / animal ✅ / farm ✅ | `passport.list`, `animal.list`, `farm.list` (L31-44) |
| Ear Tags | `/ear-tags` | **YES** | NO | earTag ✅ / animal ✅ / farm ✅ | `earTag.list`, `earTag.listOrders`, `earTag.getOrderById`, `earTag.list`, `earTag.generateTagNumbers`, `animal.list`, `earTag.listTypes`, `farm.list` (L54-626) |
| VS Contracts | `/vs-contracts` | **YES** | NO | vsContract ✅ | `vsContract.getByRegion`, `vsContract.create`, `vsContract.updateStatus` (verified full file) |
| VS Assignments | `/vs-assignments` | **YES** | NO | vsAssignment ✅ / farm ✅ | `vsAssignment.list`, `farm.list` (L51) |
| Health | `/health` | **YES** | NO | health ✅ / animal ✅ / farm ✅ / user ✅ | `health.listVaccines`, `health.listBatches`, `health.listDiseases`, `health.listVaccinations`, `animal.list`, `farm.list`, `user.list` (L76-139) |
| Inspections | `/inspections` | **YES** | NO | inspection ✅ / farm ✅ / user ✅ | `inspection.list`, `farm.list`, `user.list` (L32-33) |
| Corrections | `/corrections` | **YES** | NO | correction ✅ / animal ✅ / farm ✅ | `correction.list`, `animal.list`, `farm.list` (L36-48) |
| Farms | `/farms` | **YES** | NO | farm ✅ | `farm.list` (`farms/page.tsx` L27-28) |
| Farm Books | `/farm-books` | **YES** | NO | farmBook ✅ / farm ✅ | `farmBook.list`/`getByFarmId`, `farm.list` (L65) |
| Organizations | `/organizations` | **YES** | NO | organization ✅ | `organization.listByType`, `organization.getById` (L32/L95) |
| Subjects | `/subjects` | **YES** | NO | subject ✅ / farm ✅ | `subject.list`/`search`, `farm.list` (L37) |
| PDA Devices | `/devices` | **YES** | NO | device ✅ / user ✅ | `device.list`, `user.list` (L25/L33) |
| IoT | `/iot` | **YES** | NO | iot ✅ / farm ✅ / animal ✅ | `iot.listDevices`, `iot.listReadings`, `farm.list`, `animal.list` (L31-73) |
| Geo & EUDR | `/geo` | **YES** | NO | geo ✅ / farm ✅ | `geo.listGeofences`, `farm.list` (L34/L41) |
| Offline Sync | `/sync` | **YES** | NO | sync ✅ | `sync.syncDownload` (`sync/page.tsx` L18) |
| Notifications | `/notifications` | **YES** | NO | notification ✅ | `notification.unreadCount` (L21) |
| Archive | `/archive` | **YES** | NO | archive ✅ / farm ✅ / animal ✅ / inspection ✅ | `archive.list`, `archive.listExpired`, `farm.list`, `animal.list`, `inspection.list` (L45-52) |
| Documents | `/documents` | **YES** | NO | document ✅ | `document.listTypes` (L37) |
| Verify document | `/verify` | **YES** | NO | document ✅ | `document.statusList` (L65) |
| Roles & Permissions | `/rbac` | **YES** | NO | rbac ✅ / user ✅ / farm ✅ | `rbac.listRoles`, `rbac.listPermissions`, `user.list`, `farm.list` (L30-33) |
| Users | `/users` | **YES** | NO | user ✅ | `user.list` (`users/page.tsx`) |
| Audit | `/audit` | **YES** | NO | audit ✅ | `audit.list` (L26) |
| Feature Flags | `/feature-flags` | **YES** | NO | modules ✅ | `modules.list` (L20) |
| System Parameters | `/system-parameters` | **YES** | NO | systemParameters ✅ | `systemParameters.list` (L32) |

**Web data gaps (top-level tabs):** NONE. All 29 top-level nav tabs are wired to live tRPC.

### Web detail/edit/new sub-pages (NOT "tabs" — secondary finding)

17 sub-pages exist (`animals/[id]/edit`, `animals/new`, `archive/[id]/edit`, `archive/new`, `devices/[id]/edit`, `devices/new`, `farms/[id]/edit`, `farms/new`, `inspections/[id]/edit`, `inspections/new`, `movements/[id]/edit`, `movements/new`, `organizations/new`, `subjects/[id]/edit`, `subjects/new`, `users/[id]/edit`, `users/new`). Their `page.tsx` files contain **no tRPC query themselves** — data loading is delegated to a child form component (`#components/...`). Verified wired examples: `components/animals/animal-edit-form.tsx` → `trpc.animal.getById.queryOptions({id})` (L21); `components/movements/movement-create-form.tsx` → `trpc.farm.list` (L36). **All 17 still lack tests.** Note: rows in list tables link only to `/…/[id]/edit` (e.g. `components/animals/columns.tsx` L47) — there is no standalone read-only detail view route (edit page doubles as the view via the form's GET).

---

## 3. Consolidated GAPS

### Tabs with NO live data

- **Mobile `explore` (Profile)** — `apps/mob/app/(tabs)/explore.tsx` — sign-out only.
- **Mobile `health` index** — `apps/mob/app/(tabs)/health/index.tsx` — nav cards, no query.
- **Mobile `movements` index** — `apps/mob/app/(tabs)/movements/index.tsx` — nav cards, no query.
- **Mobile `sync` index** — `apps/mob/app/(tabs)/sync/index.tsx` — local outbox only (by design).
- **Mobile `health`/`movements` sub-screens** — create-only; no query to load existing records (vaccines, treatments, lab tests, past movements, animal/farm dropdowns are hardcoded UUID inputs).

### Tabs with NO tests

- **EVERY frontend screen/tab** — zero screen tests on both platforms.
- The only frontend test files in the whole repo are:
  - `apps/web/lib/permissions-core.test.ts` (logic test, under `lib/`, IS picked up by web vitest)
  - `apps/mob/lib/offline/pii.test.ts` (uses Node `node:test`; **NOT run by any script**)

### Test-runner gaps (blocking)

- **Mobile: no test runner.** `apps/mob/package.json` has no `test` script and no `vitest`/`jest` devDependency. The lone `pii.test.ts` is orphaned.
- **Web: runner exists but mis-scoped.** `apps/web/package.json` → `"test": "vitest run"`; config `apps/web/vitest.config.ts`:
  - `include: ["lib/**/*.test.ts"]` → screen tests under `app/**` are ignored.
  - `environment: "node"` → React component rendering needs `jsdom`/`happy-dom` + `@testing-library/react`.

---

## 4. tRPC Client Usage Patterns (for the planner)

### Mobile — legacy `@trpc/react-query` v10 API

- **Setup:** `apps/mob/providers/trpc-provider.tsx`
  - `export const trpc = createTRPCReact<AppRouter>();` (L20)
  - `TRPCProvider({ children, apiUrl })` builds `trpc.createClient({ links: [loggerLink, splitLink(httpSubscriptionLink | httpBatchLink)] })`, wires `QueryClient` + `QueryClientProvider` (L22-110).
  - Transformer: `transformer` from `@rocky/trpc/superjson` (L4). Offline persistence via `persistQueryClient` (native-only).
  - Mounted in `apps/mob/app/_layout.tsx` (`<TRPCProvider apiUrl={config.apiUrl}>`).
- **In screens:** `import { trpc } from "@/providers/trpc-provider";`
  - Query: `const { data, isLoading } = trpc.animal.list.useQuery({ limit: 20, offset: 0 });`
  - Mutation: `const createAnimal = trpc.animal.create.useMutation({ ... });`

### Web — TanStack React Query v11 API (`@trpc/tanstack-react-query`)

- **Setup:** `apps/web/lib/trpc.ts`
  - `export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();` (L27)
  - `createRockyTRPCClient()` → `createTRPCClient<AppRouter>` with `splitLink(httpSubscriptionLink | httpBatchLink)`, relative URL `/trpc` proxied through Next.js (L30-52).
  - Transformer: `transformer` from `@rocky/trpc/superjson` (L6).
  - Wrapped in `apps/web/components/trpc-provider.tsx` (`<TRPCProvider>` + `QueryClientProvider`), mounted by `apps/web/app/(admin)/layout.tsx` → `AdminShell`.
- **In screens/components:** `import { useTRPC } from "#lib/trpc";` then `const trpc = useTRPC();`
  - Query: `const q = useQuery(trpc.animal.list.queryOptions({ limit: 20 }));`
  - Mutation: `useMutation(trpc.animal.create.mutationOptions({ onSuccess }));`
  - Invalidations: `queryClient.invalidateQueries({ queryKey: trpc.animal.list.queryKey(...) });`

### Shared types/exports (`packages/trpc/src/index.ts`)

- `export type { AppRouter } from "./generated/server.js";`
- `export { appRouter } from "./generated/server.js";`
- `export { superjson, transformer } from "./superjson.js";`
- `export { createResultUnwrapper, toAppError } from "./unwrap.js";`
- `export { clientCan } from "./client-can.js";`

---

## 5. Available Backend Procedures (AppRouter)

Source: `packages/trpc/src/generated/server.ts` (auto-generated by `nestjs-trpc generate`; 23 routers). Router aliases + procedures relevant to tabs:

| Router alias | Procedures (queries/mutations) |
|--------------|--------------------------------|
| `animal` | getById, findByTag, list, create, update |
| `archive` | getById, list, create, listExpired, markArchived, markDestroyed, archiveInspectionForm |
| `audit` | list, getById |
| `correction` | getById, list, create, review, resolve, escalate, reject |
| `device` | getById, list, create, update, assignUser, recordSync, registerFailedAttempt, unblock |
| `document` | generate, verify, credential, credentialBatch, verifyCredential, listTypes, statusList |
| `earTag` | getById, list, findByNumber, getType, listTypes, getOrderById, listOrders, generateTagNumbers, transitionStatus, collectOrderTags, createDuplicateOrder, createOrder, updateOrder, cancelOrder, cancelOrderItem, appendToOrder, assignSupplierContingent, getTakeoverFile |
| `farmBook` | getById, getByFarmId, create, updateStatus |
| `farm` | getById, list, create, update |
| `geo` | listGeofences, findActiveDiseaseZones, listGeofenceEvents, createGeofence, deleteGeofence, logGeofenceEvent, listSettlements, declareDiseaseZone, listDiseaseZones, findGeofencesForAnimalPastures, findActiveDiseaseZonesNearFarm, findGeofencesIntersectingPolygon, forwardGeocode, reverseGeocode, staticMapUrl, geolocation, assessDeforestation, forestLayer |
| `health` | getDisease, listDiseases, createDisease, updateDisease, getVaccine, listVaccines, createVaccine, createVaccineBatch, getVaccination, listVaccinations, recordVaccination, getTreatment, listTreatments, recordTreatment, listBatches, getLabTest, listLabTests, recordLabTest, getVaccineDiseases, linkVaccineDisease, unlinkVaccineDisease |
| `inspection` | getById, list, create, schedule, complete, printForm, listRiskAnalyses, runRiskAnalysis |
| `iot` | registerDevice, listDevices, getDevice, ingestReading, ingestReadings, listReadings |
| `modules` | list, update |
| `movement` | getById, getLineage, list, eudrDueDiligence, diseaseZoneCheck, create, recordDeath, declarePasture, declareAlpine, returnFromAlpine, recordSlaughter, importEU, importThirdCountry, exportAnimal, recordMarketTransaction, recordMarketUnsold, recordMarketSlaughter |
| `notification` | unreadCount, send, markAsRead, confirmDelivery, registerDevice |
| `organization` | getById, list, listByType, create |
| `passport` | getById, list, issueForAnimal, shipToVs, deliverToKeeper, seize, reprint |
| `rbac` | listRoles, getRole, listPermissions, assignRole, revokeRole, myPermissions |
| `subject` | getById, search, create, update, bindToFarm, unbindFromFarm |
| `sync` | syncDownload, syncUpload |
| `systemParameters` | list, update, getById |
| `user` | getById, list, create, update |
| `vsAssignment` | getById, getBySubject, getByRegion, create, assign, unassign |
| `vsContract` | getById, getBySubject, getByRegion, create, updateStatus |

**Conclusion:** Every tab's backend router already exists. The `health` and `movements` mobile tabs have the queries they'd need (`health.listVaccines`/`listTreatments`/`listLabTests`, `movement.list`) — they're simply not called from the screens yet.

---

## 6. Test Infrastructure (for the planner)

### Web (`apps/web`)

- **Runner:** `vitest` (devDep). Script: `"test": "vitest run"` (`apps/web/package.json`).
- **Config:** `apps/web/vitest.config.ts`:

  ```ts
  export default defineConfig({
    resolve: { tsconfigPaths: true },
    test: { globals: true, environment: "node", include: ["lib/**/*.test.ts"] },
  });
  ```

- **Blockers for screen tests:**
  1. `include` is `lib/**/*.test.ts` → must add `app/**/*.test.tsx`.
  2. `environment: "node"` → needs `environment: "jsdom"` (or happy-dom) + `@testing-library/react` + `@testing-library/jest-dom` for component rendering.
- **Existing example:** `apps/web/lib/permissions-core.test.ts` — pure logic, uses `describe/it/expect` (vitest globals), `PermissionFactory` from `@rocky/testing`, `Permissions` catalog from `@rocky/authorization`. No DOM, no tRPC mock.

### Mobile (`apps/mob`)

- **Runner:** NONE. No `test` script in `apps/mob/package.json`; no `vitest`/`jest` devDependency. React Native + Expo env would need `vitest` + `@testing-library/react-native` + a React Native preset (e.g. `vitest-react-native` / `react-native-web` + jsdom, or Detox for e2e).
- **Orphaned test:** `apps/mob/lib/offline/pii.test.ts` uses Node's built-in `node:test` + `node:assert` — not executed by any configured runner.

### Shared test utilities (`@rocky/testing`, `packages/testing/`)

- Exports (per `packages/testing/src/index.ts`): data **factories** (`AnimalFactory`, `MovementFactory`, `Health*Factory`, `EarTagOrderFactory`, `CattlePassportFactory`, `InspectionFactory`, `VsContractFactory`, `VsAssignmentFactory`, `PdaDeviceFactory`, `UserFactory`, etc.), `SchemaDataFactory` base, `/factory`, `/scenarios`, `/setup` subpaths.
- **Does NOT provide**: a React render helper, a tRPC mock client, or a QueryClient seeder. The planner must build these for component tests.
- **Config:** `packages/testing/vitest.config.ts` uses `vite-tsconfig-paths` plugin, `globals: true`, `environment: "node"`, `setupFiles: ["./src/setup.ts"]`.
- **Convention (backend/domain tests elsewhere):** `describe/it/expect` vitest globals; files named `*.workflow.test.ts`, `*.rls.test.ts`, `*.factory.test.ts`; "Scenario B" = mock the repository, never mock `@rocky/database`, build inputs via factories (`packages/domains/*/src/**/*.test.ts`).

### How to mock tRPC in a future screen test (guidance, not code)

- **Web:** Provide a wrapper that supplies a real `QueryClient` (from `@tanstack/react-query`) and a stub `useTRPC()` returning an object whose every `trpc.x.y.queryOptions` returns a stable query key and whose `mutate`/`mutationOptions` are no-ops; seed results with `queryClient.setQueryData(trpc.x.y.queryKey(input), data)`. Alternatively, mock `@/lib/trpc`'s `useTRPC`.
- **Mobile:** Wrap the screen in `<trpc.Provider client={fakeClient} queryClient={qc}><QueryClientProvider client={qc}>`. A `fakeClient` implements the `trpc.x.y.useQuery`/`useMutation` surface (or use `@trpc/react-query`'s `createTRPCReact` with a mock client from `@trpc/client`).

---

## 7. Blockers / Gotchas Summary

1. **Mobile has zero test infrastructure** — standing up a runner (vitest + RN preset) is a prerequisite, not just writing tests.
2. **Web vitest is scoped to `lib/**` + `node` env** — screen tests need an `app/**` glob and a DOM environment.
3. **No tRPC mock / render helper exists** in `@rocky/testing` — must be authored for both platforms before screen tests are practical.
4. **Mobile `health` & `movements` tabs are create-only** — no query prefills animal/farm dropdowns (they're raw UUID `Input` fields), and the index screens show no list. Backend queries exist; screens just don't call them.
5. **`explore` (Profile) and `sync` mobile tabs** legitimately need no backend data (auth + local outbox) — exclude from "wire data" remediation, but they still need tests if coverage is the goal.
6. **No read-only detail view routes** on web — lists link straight to `/…/[id]/edit`; detail data loads inside the edit form component (confirmed for animals/movements). Verify per-form for the other 15 sub-pages.
7. **All backend routers present** — nothing in `packages/trpc/src/generated/server.ts` blocks wiring. Generated file is regenerated via `pnpm generate:trpc` (root script) — keep it committed.
