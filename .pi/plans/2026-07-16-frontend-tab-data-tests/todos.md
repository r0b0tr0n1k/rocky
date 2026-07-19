# Todos — Frontend Tab Data-Wiring & Tests (Mobile)

**Tag:** `frontend-tab-data-tests`
**Plan:** `.pi/plans/2026-07-16-frontend-tab-data-tests/plan.md`
**Order:** prerequisite runner → helper → per-tab interleaved wire+test (health, movements) → smoke (explore, sync) → wired-tab tests.
**Rule:** each todo is independently committable. Read the referenced files before editing. Every todo references real code (inline example or file:line).

---

## T01 — Stand up the mobile vitest runner + config

**tags:** [`frontend-tab-data-tests`, `test-infra`]
**files:** `apps/mob/vitest.config.ts` (new), `apps/mob/vitest.setup.ts` (new), `apps/mob/package.json` (devDeps + `test` script)
**constraints:**

- Do NOT add Detox. Lightweight node/vitest unit+component layer only (plan §3.1).
- `react-native` must alias to `react-native-web` under jsdom (repo already has `react-native-web` in `apps/mob/package.json:94`). Use `vitest-react-native` preset if installable, else manual `environment: "jsdom"` + `resolve.alias`.
**code example (config):**

```ts
// apps/mob/vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import reactNative from "vitest-react-native";
export default defineConfig({
  plugins: [tsconfigPaths()],
  define: { __DEV__: JSON.stringify(true), global: "globalThis" },
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    ...reactNative(),
    server: { deps: { inline: [/^@rocky\//, /react-native/] } },
  },
});
```

**setup (mock expo-router + notify — both crash/side-effect under vitest):**

```ts
// apps/mob/vitest.setup.ts
import { cleanup } from "@testing-library/react-native";
import { afterEach, vi } from "vitest";
afterEach(() => cleanup());
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/notify", () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }));
```

**package.json script:** `"test": "vitest run"`, `"test:watch": "vitest"`. Add devDeps: `vitest` (catalog), `@testing-library/react-native`, `vitest-react-native` (or `jsdom`), `vite-tsconfig-paths` (catalog), `@rocky/testing` (workspace:*).
**anti-patterns:** do NOT hand-write a custom transform; do NOT leave `expo-router`/`@/lib/notify` unmocked (crashes on import).
**acceptance:** `pnpm --filter @rocky/mobile test` runs (even with zero tests) without import/transform errors; `vitest.config.ts` + `vitest.setup.ts` committed.

---

## T02 — Author shared test helper (render + tRPC fake-link mock)

**tags:** [`frontend-tab-data-tests`, `test-infra`]
**files:** `apps/mob/test/trpc-fake-client.ts` (new), `apps/mob/test/render.tsx` (new)
**constraints:**

- Reuse the EXISTING `trpc` object: `import { trpc } from "@/providers/trpc-provider"` (`createTRPCReact<AppRouter>()` — `apps/mob/providers/trpc-provider.tsx:30`). Do NOT create a second `trpc`.
- `QueryClient` must set `retry:false`, `staleTime:Infinity`, `gcTime:Infinity` so seeded data never refetches.
**code example:** see plan §7.2 (`createFakeLink` + `renderWithProviders` + `seedQuery`). Key imports: `observable` from `@trpc/server`, `TRPCLink` from `@trpc/client`, `AppRouter` from `@rocky/trpc`, `QueryClient`/`QueryClientProvider` from `@tanstack/react-query`.
**anti-patterns:** do NOT use `react-test-renderer`; do NOT rely on live network; do NOT seed without `staleTime: Infinity`.
**acceptance:** helper compiles; a throwaway smoke render of `<HomeScreen/>` mounts under `renderWithProviders`.

---

## T03 — health: wire data AND test (index + vaccination + treatment + lab-test)

**tags:** [`frontend-tab-data-tests`, `health`]
**wire changes:**

- `apps/mob/app/(tabs)/health/index.tsx`: add `trpc.health.listVaccinations.useQuery({ limit: 5, offset: 0 })` and render recent rows with `<Empty>` fallback (follow pattern in `apps/mob/app/(tabs)/index.tsx:60-72`).
- `health/vaccination.tsx`: replace raw `vaccineId`/`batchId` `<Input>` UUIDs with `trpc.health.listVaccines` / `trpc.health.listBatches` `Select` dropdowns (pattern: plan §7.5).
- `health/treatment.tsx`: replace `diseaseId` raw UUID `<Input>` (line ~123) with `trpc.health.listDiseases` dropdown.
- `health/lab-test.tsx`: replace raw UUID `Input`s (lines ~182/190) with dropdowns **where a `list*` procedure exists**; otherwise document the gap inline.
**test files:** `apps/mob/app/(tabs)/health/__tests__/index.test.tsx`, `vaccination.test.tsx`, `treatment.test.tsx`, `lab-test.test.tsx`.
**code example (create-only test):** plan §7.4 — register `linkHandlers` for BOTH `"health.recordVaccination"` AND `"health.listVaccinations"` (invalidation target) + the dropdown list procs; assert offline via `onlineManager.setOnline(false)` + `afterEach` reset.
**seed data:** `VaccinationFactory`, `AnimalFactory`, `FarmFactory`, `VaccineFactory`, `VaccineBatchFactory`, `DiseaseFactory` from `@rocky/testing/factory` (barrel: `packages/testing/src/factory/factories/index.ts`).
**anti-patterns:** do NOT leave any raw UUID `<Input>` for vaccine/batch/disease; do NOT register only the mutation handler (invalidate throws "no handler").
**acceptance (ISC):** health index renders seeded list + empty state; vaccination/treatment submit online → mutation fires + list invalidated; offline → enqueues; no raw UUID inputs remain in these 4 screens.

---

## T04 — movements: wire data AND test (index + death + pasture + slaughter)

**tags:** [`frontend-tab-data-tests`, `movements`]
**wire changes:**

- `apps/mob/app/(tabs)/movements/index.tsx`: add `trpc.movement.list.useQuery({ limit: 5, offset: 0 })` + `<Empty>` fallback (pattern: `index.tsx:60-72`).
- `movements/pasture.tsx`: replace raw UUID `<Input>` for `sourceFarmId` (line ~116) + `destinationPastureId` (line ~123) with `FarmPicker` / `farm.list` dropdowns. (`animalIds` comma-string is by-design — leave it.)
- `movements/slaughter.tsx`: replace `slaughterhouseId` raw UUID `<Input>` (line ~128) with `farm.list` dropdown; `animalId`/`farmId` already use pickers (keep).
- `movements/death.tsx`: already uses `AnimalPicker`/`FarmPicker` (compliant) — verify, no change.
**test files:** `apps/mob/app/(tabs)/movements/__tests__/index.test.tsx`, `death.test.tsx`, `pasture.test.tsx`, `slaughter.test.tsx`.
**code example:** seed `MovementFactory` + `FarmFactory` from `@rocky/testing/factory`; create-screen tests register `"movement.recordDeath"/"movement.declarePasture"/"movement.recordSlaughter"` + `"movement.list"` handlers.
**anti-patterns:** do NOT leave raw farm UUID inputs; do NOT drop the `utils.movement.list.invalidate()` calls the screens already make.
**acceptance (ISC):** movements index renders list + empty; death/pasture/slaughter submit → mutation + `movement.list` invalidated; no raw UUID farm inputs remain.

---

## T05 — explore (Profile): SMOKE test only

**tags:** [`frontend-tab-data-tests`, `smoke`, `explore`]
**files:** `apps/mob/app/(tabs)/explore.tsx` (read-only), `apps/mob/app/(tabs)/__tests__/explore.test.tsx` (new)
**constraints:** UNWIRED by design (sign-out only). No data wiring.
**code example:**

```tsx
import { screen, fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "@/test/render";
import { signOut } from "@/lib/auth";
import ProfileScreen from "../explore";
vi.mock("@/lib/auth", () => ({ signOut: vi.fn() }));
it("signs out on press", () => {
  renderWithProviders(<ProfileScreen />);
  fireEvent.press(screen.getByText("Sign Out"));
  expect(signOut).toHaveBeenCalled();
});
```

**anti-patterns:** do NOT add tRPC queries to this tab; do NOT assert server data.
**acceptance (ISC):** screen mounts; "Sign Out" present; `signOut` called on press.

---

## T06 — sync: SMOKE test only

**tags:** [`frontend-tab-data-tests`, `smoke`, `sync`]
**files:** `apps/mob/app/(tabs)/sync/index.tsx` (read-only), `apps/mob/app/(tabs)/sync/__tests__/sync.test.tsx` (new)
**constraints:** UNWIRED by design (offline outbox via `useOffline`). Mock `useOffline` with controlled state.
**code example:**

```tsx
vi.mock("@/providers/offline-provider", () => ({
  useOffline: () => ({ isOnline: true, pendingCount: 2, items: [{ idempotency_key: "k1", type: "vaccination", status: "pending" }], flush: vi.fn(), download: vi.fn(), dismiss: vi.fn(), isBusy: false }),
}));
// assert "Sync now" enabled when online; "Nothing queued." when items=[]
```

**anti-patterns:** do NOT assert live sync/network; do NOT import the real SQLite outbox.
**acceptance (ISC):** renders connection status badge + pending badge; shows "Nothing queued." when `items:[]`; "Sync now" disabled when `isOnline:false`.

---

## T07 — Home: add test (wired, read-only seed pattern)

**tags:** [`frontend-tab-data-tests`, `home`]
**files:** `apps/mob/app/(tabs)/__tests__/index.test.tsx` (new)
**constraints:** screen already wired (`animal.list`, `notification.unreadCount` — `apps/mob/app/(tabs)/index.tsx:11-12`). Test ONLY by seeding cache (plan §3.2 technique 2).
**code example:** plan §7.3 — seed `trpc.animal.list.queryKey({ limit: 5, offset: 0 })` with `AnimalFactory.createMany(3)` mapped to `AnimalSummary` (`stateCode/earTagNumber/sex/breed/status`); also seed `notification.unreadCount`. Assert recent animals + unread badge + "No animals found" empty.
**anti-patterns:** do NOT add a fake-link handler for read-only screens; do NOT invent fixtures (use `AnimalFactory`).
**acceptance (ISC):** renders recent animals; shows unread badge when `unreadCount>0`; empty state when list `[]`.

---

## T08 — Animals: add test

**tags:** [`frontend-tab-data-tests`, `animals`]
**files:** `apps/mob/app/(tabs)/animals/__tests__/index.test.tsx` (new)
**constraints:** wired (`animal.list`). Read-only seed pattern. Mirror T07.
**seed data:** `AnimalFactory` from `@rocky/testing/factory`.
**acceptance (ISC):** list rows render; empty + error states asserted deterministically.

---

## T09 — Inspections: add test

**tags:** [`frontend-tab-data-tests`, `inspections`]
**files:** `apps/mob/app/(tabs)/inspections/__tests__/*.test.tsx` (new)
**constraints:** wired (`inspection.list`). Read-only seed pattern.
**seed data:** `InspectionFactory` from `@rocky/testing/factory`. Seed `trpc.inspection.list.queryKey(...)`.
**acceptance (ISC):** list rows render; empty state asserted.

---

## T10 — Ear Tags: add test

**tags:** [`frontend-tab-data-tests`, `eartags`]
**files:** `apps/mob/app/(tabs)/eartags/__tests__/*.test.tsx` (new)
**constraints:** wired (`earTag.list`). Read-only seed pattern.
**seed data:** `EarTagFactory` from `@rocky/testing/factory`. Seed `trpc.earTag.list.queryKey(...)`.
**acceptance (ISC):** list rows render; empty state asserted.

---

## T11 — Passport: add test

**tags:** [`frontend-tab-data-tests`, `passport`]
**files:** `apps/mob/app/(tabs)/passport/__tests__/*.test.tsx` (new)
**constraints:** wired (`passport.list`). Read-only seed pattern.
**seed data:** `CattlePassportFactory` from `@rocky/testing/factory`. Seed `trpc.passport.list.queryKey(...)`.
**acceptance (ISC):** list rows render; empty state asserted.

---

## T12 — Corrections: add test

**tags:** [`frontend-tab-data-tests`, `corrections`]
**files:** `apps/mob/app/(tabs)/corrections/__tests__/*.test.tsx` (new)
**constraints:** wired (`correction.list`). Read-only seed pattern.
**seed data:** `ErrorCorrectionFactory` from `@rocky/testing/factory`. Seed `trpc.correction.list.queryKey(...)`.
**acceptance (ISC):** list rows render; empty state asserted.

---

## T13 — Alerts: add test

**tags:** [`frontend-tab-data-tests`, `alerts`]
**files:** `apps/mob/app/(tabs)/notifications/__tests__/*.test.tsx` (new)
**constraints:** wired (`notification.*`). Read-only seed pattern.
**seed data:** `NotificationFactory` from `@rocky/testing/factory`. Seed `trpc.notification.*.queryKey(...)`.
**acceptance (ISC):** alert rows render; empty state asserted.
