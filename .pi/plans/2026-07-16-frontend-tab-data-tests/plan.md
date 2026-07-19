# Frontend Tab Data-Wiring & Tests (Mobile)

**Date:** 2026-07-16
**Status:** Draft (decisions locked — planning only, no implementation)
**Plan dir:** `/home/goce/appz/rocky/.pi/plans/2026-07-16-frontend-tab-data-tests`
**Scope root:** `apps/mob/app/(tabs)/` (the 11-tab Expo group)

---

## 1. Summary

> ### ⚠️ DEVIATION (resolved during T01 — read before implementing T02+)
>
> The plan specified **`@testing-library/react-native`** as the renderer. That package
> transitively imports the real `react-native` entry, whose first line is Flow
> (`import typeof * as ReactNativePublicAPI from './index.js.flow';`). Under **Vitest 4 /
> Vite 8** that Flow syntax cannot be parsed and there is no clean CJS/Flow interop
> (no `vitest-react-native` preset works with the ESM pipeline; forcing RN packages
> through Vite's transform breaks CJS `exports`).
>
> **Resolution:** render **`react-native-web`** (aliased from `react-native`) into a
> **jsdom DOM** and query it with **`@testing-library/react`** (DOM testing library).
> react-native-web's compiled CJS dist has no Flow, so this is clean with **zero extra
> plugins** (no Flow-strip plugin, no `ssr.noExternal`). The mobile package name is
> **`@rocky/mobile-app`** (not `@rocky/mobile`).
>
> **Impact on todos:** T02's shared helper uses `@testing-library/react` instead of
> `@testing-library/react-native`. All per-tab tests import `renderWithProviders` from
> `@/test/render` and use `screen` / `fireEvent` / `waitFor` from
> `@testing-library/react` — the SAME names as in the plan's examples, just a different
> import source. The tRPC fake-link helper (`trpc-fake-client.ts`) is unchanged.

The mobile `(tabs)` group has 11 tabs. Scouting confirmed a split:

- **Wired but untested** — Home, Animals, Inspections, Ear Tags, Passport, Corrections, Alerts already call tRPC procedures but have **no tests**.
- **Unwired / create-only** — `health` (index = nav cards, sub-screens create-only with raw UUID inputs for vaccine/batch/disease) and `movements` (index = nav cards, sub-screens create-only with raw UUID inputs for source/destination farm + slaughterhouse) do not read list data and force the user to paste UUIDs instead of picking from server data.
- **No-data-by-design** — `explore` (Profile: sign-out only) and `sync` (offline outbox) are intentionally not wired to tRPC; each gets a **smoke test**.

This plan (a) **remediates the data gaps** for `health` + `movements` (wire list queries, replace raw UUID inputs with `farm.list`/`animal.list`/`health.list*` dropdowns using the EXISTING backend procedures), and (b) **stands up a lightweight mobile test layer** (vitest + jsdom + react-native-web + `@testing-library/react-native`) plus a shared tRPC mock/render helper, then **interleaves** a data-wire + test unit for every target tab.

Web admin (`apps/web`) is **explicitly OUT of scope** — its data is already wired; its test infra is a separate future plan.

---

## 2. Decisions (locked)

| Q | Decision | Rationale |
|---|----------|-----------|
| **Q1 Scope** | **(a) MOBILE ONLY** — `apps/mob/app/(tabs)/`. Web admin out. | Web data already wired; keeping scope tight avoids a second test stack. |
| **Q2 Strategy** | **(c) INTERLEAVED PER-TAB** — for each target tab, wire data AND write its test as one unit/todo. | A tab is "done" only when its data renders and a test proves it; prevents half-wired tabs. |
| **Q3 Test infra** | **(a) IN SCOPE** — standing up the runner + shared tRPC mock/render helper is a prerequisite todo (not optional). | Without a shared helper, every tab test reinvents mocking → drift + flakiness. |
| **Q4 No-data tabs** | **(a) `explore` + `sync` stay UNWIRED** (auth + local outbox by design) but each gets a **smoke test**. | Don't fake data for tabs that have none; prove they mount and react to local state. |

---

## 3. Best Practices (required section)

### 3.1 Mobile testing strategy — lightweight unit/component layer, not Detox

- **Recommend: a node/vitest unit + component layer** (`vitest` + `jsdom` + `react-native-web` + `@testing-library/react-native`).
  - **Why not Detox (E2E) for these tabs?** Detox drives a real simulator/device, needs a running Metro bundle + a live backend, is slow (minutes per run), and is flaky on CI. These tabs are pure **data-in / data-out** screens (list query → render; form → mutation → invalidate). That logic is fully exercisable in **isolation** with a mocked tRPC client in milliseconds. Detox is reserved for true cross-screen flows (e.g. "register animal → see it on Home") later, if ever.
  - The repo already depends on `react-native-web` (`apps/mob/package.json`), so aliasing `react-native` → `react-native-web` under jsdom is the **zero-new-native-dep** path.
- **Render engine:** `@testing-library/react-native` (queries + `fireEvent`/`press`) mounted through `react-native-web` into jsdom.
- **One assertion style:** `findBy*` (async, waits for render) for data that arrives via query; `getBy*` only for static/loading UI.

### 3.2 How to mock tRPC in React Native tests

The mobile app uses the v10 API from `@trpc/react-query`:

```tsx
// apps/mob/providers/trpc-provider.tsx (EXISTING — do not change)
export const trpc = createTRPCReact<AppRouter>();
// <trpc.Provider client={trpcClient} queryClient={queryClient}> ...
```

Two complementary techniques, both offline-safe:

1. **Fake-link client + real `QueryClient`.** Build `trpc.createClient({ links: [createFakeLink(handlers)] })` where `createFakeLink` is a custom `@trpc/server` `observable`-based link that resolves every query/mutation from an in-memory map — **no network, no timers, deterministic**. This also answers `invalidateQueries()` refetches (the screen's `onSuccess` calls `utils.health.listVaccinations.invalidate()`, which re-runs the fake link — so you MUST also register the invalidated list handler).
2. **Seed the cache by query key.** For read-only screens, seed results directly so `useQuery` returns cached data without any fetch:

   ```ts
   queryClient.setQueryData(trpc.health.listVaccines.queryKey({ limit: 50, offset: 0 }), seed);
   ```

   The test `QueryClient` sets `staleTime: Infinity`, so a seeded query never background-refetches (belt-and-suspenders with the fake link).

**Use the EXISTING mobile `trpc` object** (`createTRPCReact<AppRouter>()`) — do NOT re-create a second `trpc`. Import `trpc` from `@/providers/trpc-provider` in tests so `trpc.health.listVaccines.queryKey(...)` resolves against the real `AppRouter` types.

### 3.3 Offline-first considerations

- The app wraps the client in `persistQueryClient` (`trpc-provider.tsx`). **Tests must never touch a live network or the persisted SQLite store.** The fake link guarantees this.
- Control liveness explicitly: `import { onlineManager } from "@tanstack/react-query"` and `onlineManager.setOnline(false)` to exercise the **offline write-local-then-enqueue** path (the screens call `useOfflineMutation("vaccination")` when `!onlineManager.isOnline()`). Reset in `afterEach`.
- **Assert loading / empty / error deterministically:**
  - *Loading:* render with an **unseeded** query and assert the loading affordance (e.g. `ActivityIndicator` / skeleton / disabled button) via `queryClient.setQueryData` left absent.
  - *Empty:* seed `{ data: [], meta: { total: 0, limit, offset } }` → assert the `<Empty>` block ("No animals found" etc.).
  - *Error:* throw from the fake-link handler for that path → assert the error UI / `Alert.alert` toast (mock `@/lib/notify`).
- Tests run in jsdom; `persistQueryClient` is native-only (ADR-0036) so it's a no-op under web — no extra mocking needed.

### 3.4 Data-wiring best practices (for the remediation todos)

- **Per-tab query hooks** stay colocated in the screen (no new hook file needed unless reused). Call `trpc.<domain>.<proc>.useQuery(input)` exactly as `index.tsx` already does for `animal.list`.
- **Dropdown data via `list` queries**, never raw UUID inputs:
  - Animal/Farm selection → reuse the existing `AnimalPicker` / `FarmPicker` (`@/components/animals/animal-picker`, `@/components/farms/farm-picker`) which already query `trpc.animal.list` / `trpc.farm.list`.
  - Vaccine/Batch/Disease selection → new small `Select`-backed pickers fed by `trpc.health.listVaccines` / `trpc.health.listBatches` / `trpc.health.listDiseases`.
- **Cache invalidation:** after a successful create mutation, call `utils.<domain>.<list>.invalidate()` (the screens already do this — keep it; tests assert the refetch via the fake link).
- **Mandatory UI states:** every list screen must render a loading state, an empty state (`<Empty>` from `@/components/ui/empty`, already imported in `index.tsx`), and an error path. Add these where missing.

### 3.5 Use `@rocky/testing` factories — never invent fixtures

- Seed test data with the Diamond-Seal factories: `AnimalFactory`, `MovementFactory`, `VaccinationFactory`, `LabTestFactory`, `TreatmentFactory`, `DiseaseFactory`, `VaccineFactory`, `VaccineBatchFactory`, `FarmFactory` — all exported from `@rocky/testing/factory`.
- Map factory output to the **summary projection the screen renders** (e.g. `AnimalSummary` = `{ id, stateCode, earTagNumber, sex, breed, status }`). The factories produce full `$inferSelect` rows; pick/override the fields the UI reads.
- Keep `packages/trpc/src/generated/server.ts` **committed**. Scout confirmed every needed procedure already exists (`health.listVaccines`, `health.listVaccinations`, `health.listTreatments`, `health.listLabTests`, `health.listBatches`, `health.listDiseases`, `movement.list`, `animal.list`, `farm.list`). If a future procedure is missing, regenerate with `pnpm generate:trpc` — do NOT hand-edit the generated file.

---

## 4. Prerequisites (test-infra todo)

Stand up the runner before any tab work:

1. **Add deps** to `apps/mob/package.json` (dev): `vitest` (catalog), `@testing-library/react-native`, `vitest-react-native` (preset) or manual `jsdom` + `react-native-web` alias, `vite-tsconfig-paths` (catalog), `@rocky/testing` (workspace).
2. **`apps/mob/vitest.config.ts`** — see §7.1.
3. **`apps/mob/vitest.setup.ts`** — `cleanup` after each; mock `expo-router` (`useRouter` → `{ push, replace, back }`); mock `@/lib/notify` to a no-op/`vi.fn()`; silence `persistQueryClient` (native-only, harmless under web).
4. **`package.json` script:** `"test": "vitest run"`, `"test:watch": "vitest"`.
5. **Shared helper** `apps/mob/test/render.tsx` + `apps/mob/test/trpc-fake-client.ts` — see §7.2.

---

## 5. Per-tab remediation table

| Tab | Current state (scout) | Data change | Test | Best-practice note |
|-----|------------------------|-------------|------|--------------------|
| **health/index** | Nav cards only, **no query** | Add `trpc.health.listVaccinations.useQuery(...)` (recent events list) | Component test: seeds list, asserts rows + empty state | List + `<Empty>`; per §3.4 |
| **health/vaccination** | Create-only; **raw UUID Inputs** for `vaccineId`, `batchId` | Replace with `health.listVaccines` / `health.listBatches` dropdowns | Test: online submit → mutation + `listVaccinations` invalidate; offline → enqueue | Reuse factory; assert offline via `onlineManager` |
| **health/treatment** | Create-only; raw UUID Input for `diseaseId` (`animalId`/`farmId` already pickers) | Replace `diseaseId` with `health.listDiseases` dropdown | Test: submit → `listTreatments` invalidate | Animal/Farm already correct |
| **health/lab-test** | Create-only; raw UUID Inputs (labTestType/param) | Replace raw UUIDs with dropdowns **where a list procedure exists**; else document the gap | Test: submit → `listLabTests` invalidate | Verify against available `list*` procs |
| **movements/index** | Nav cards only, **no query** | Add `trpc.movement.list.useQuery(...)` (recent movements) | Component test: seeds list, asserts rows + empty | List + `<Empty>` |
| **movements/death** | Uses `AnimalPicker`/`FarmPicker` (compliant) | None (verify) | Test: submit → `movement.list` invalidate | Already best-practice |
| **movements/pasture** | Raw UUID Inputs for `sourceFarmId`, `destinationPastureId` | Replace with `farm.list` dropdowns (`FarmPicker`) | Test: submit → `movement.list` invalidate | `animalIds` stays comma-string by design |
| **movements/slaughter** | `animalId`/`farmId` pickers; raw UUID for `slaughterhouseId` | Replace `slaughterhouseId` with `farm.list` dropdown (or document if no slaughterhouse list) | Test: submit → `movement.list` invalidate | Farm picker reuse |
| **explore** (Profile) | Sign-out only, **unwired by design** | None | **Smoke:** renders "Sign Out"; `signOut` called on press (mock `@/lib/auth`) | §3.3 — no data |
| **sync** | Offline outbox, **unwired by design** | None | **Smoke:** renders with mocked `useOffline` (online/offline + pending count + empty "Nothing queued.") | §3.3 — offline state |
| **Home** | Wired (`animal.list`, `notification.unreadCount`), **untested** | None | Test: seeds both queries; asserts recent animals + unread badge + empty | Read-only seed pattern |
| **Animals** | Wired (`animal.list`), untested | None | Test: seeds list; asserts rows + empty + error | Read-only seed pattern |
| **Inspections** | Wired, untested | None | Test: seeds `inspection.list`; asserts rows + empty | Read-only seed pattern |
| **Ear Tags** | Wired, untested | None | Test: seeds `earTag.list`; asserts rows + empty | Read-only seed pattern |
| **Passport** | Wired, untested | None | Test: seeds `passport.list`; asserts rows + empty | Read-only seed pattern |
| **Corrections** | Wired, untested | None | Test: seeds `correction.list`; asserts rows + empty | Read-only seed pattern |
| **Alerts** | Wired (`notification.*`), untested | None | Test: seeds notifications; asserts rows + empty | Read-only seed pattern |

> **Wired-tab test rule:** read-only screens are tested purely by **seeding the query cache** (§3.2 technique 2) — no fake-link handler needed. Create-only tabs (health sub-screens, movements sub-screens) need fake-link handlers for the mutation **and** the invalidated list query.

---

## 6. Scope

**In scope:** mobile `(tabs)` data remediation for `health` + `movements`; mobile vitest runner + shared helper; interleaved tests for all 11 tabs (7 wired tests, 4 data-remediation tests, 2 smoke tests).

**Out of scope:** web admin tests; new backend procedures (all exist); Detox E2E; persistence-layer changes; new navigation.

---

## 7. Implementation steps (with mandatory concrete code)

### 7.1 Vitest config (diff — new file `apps/mob/vitest.config.ts`)

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import reactNative from "vitest-react-native"; // preset: jsdom + react-native-web alias + RN transforms
// If the preset is unavailable, fall back to manual:
//   environment: "jsdom", resolve: { alias: { "react-native": "react-native-web" } }

export default defineConfig({
  plugins: [tsconfigPaths()],
  define: { __DEV__: JSON.stringify(true), global: "globalThis" },
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    ...reactNative(), // wires environment: "jsdom" + react-native-web alias + transforms
    server: { deps: { inline: [/^@rocky\//, /react-native/] } },
  },
});
```

`apps/mob/vitest.setup.ts`:

```ts
import { cleanup } from "@testing-library/react-native";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

// expo-router is not run under vitest — provide a no-op router.
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Toast surface is a side-effect; make it observable/silent.
vi.mock("@/lib/notify", () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
```

### 7.2 Shared tRPC mock + render helper (new files)

> **Uses `@testing-library/react` (DOM), not `@testing-library/react-native`** — see
> the ⚠️ DEVIATION box in §1.

`apps/mob/test/trpc-fake-client.ts`:

```ts
import { observable } from "@trpc/server";
import type { TRPCLink } from "@trpc/client";
import type { AppRouter } from "@rocky/trpc";

export type FakeHandler = (input: unknown) => unknown | Promise<unknown>;

/**
 * Offline, deterministic tRPC link. Every query/mutation resolves from the
 * handler map — no network, no timers. Return a value to resolve; throw to
 * simulate an error (assert error UI deterministically). Path = "domain.proc"
 * (e.g. "health.recordVaccination").
 */
export function createFakeLink(handlers: Record<string, FakeHandler> = {}): TRPCLink<AppRouter> {
  return () => (ctx) =>
    observable((observer) => {
      const handler = handlers[ctx.op.path];
      if (!handler) {
        observer.error(new Error(`[fakeLink] no handler for ${ctx.op.path}`));
        return;
      }
      Promise.resolve()
        .then(() => handler(ctx.op.input))
        .then(
          (data) => {
            observer.next({ result: { type: "data", data } });
            observer.complete();
          },
          (err) => observer.error(err),
        );
    });
}
```

`apps/mob/test/render.tsx`:

```tsx
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createFakeLink, type FakeHandler } from "./trpc-fake-client";
import { trpc } from "@/providers/trpc-provider";

export interface RenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  linkHandlers?: Record<string, FakeHandler>;
}

/** QueryClient with retry off + staleTime Infinity so seeded data never refetches. */
export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
}

export function renderWithProviders(ui: React.ReactElement, options: RenderOptions = {}) {
  const { queryClient = makeTestQueryClient(), linkHandlers = {}, ...rtl } = options;
  const client = trpc.createClient({ links: [createFakeLink(linkHandlers)] });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...rtl }) };
}

/** Seed a query result via the real tRPC queryKey helper (resolves against AppRouter). */
export function seedQuery(queryClient: QueryClient, queryKey: readonly unknown[], data: unknown) {
  queryClient.setQueryData(queryKey as unknown[], data);
}
```

### 7.3 Sample test — WIRED tab (Home, read-only seed pattern)

`apps/mob/app/(tabs)/__tests__/index.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { renderWithProviders, seedQuery } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import { AnimalFactory } from "@rocky/testing/factory";
import HomeScreen from "../index";

describe("Home tab", () => {
  it("renders recent animals from the cache", async () => {
    const animals = AnimalFactory.createMany(3).map((a) => ({
      id: a.id,
      stateCode: a.stateCode ?? "MK",
      earTagNumber: a.earTagNumber ?? "00000001",
      sex: a.sex ?? "M",
      breed: a.breed ?? null,
      status: a.status ?? "ALIVE",
    }));

    const { queryClient } = renderWithProviders(<HomeScreen />);
    seedQuery(queryClient, trpc.animal.list.queryKey({ limit: 5, offset: 0 }), {
      data: animals,
      meta: { total: 3, limit: 5, offset: 0 },
    });

    expect(await screen.findByText(animals[0].earTagNumber!)).toBeTruthy();
  });

  it("shows the empty state when there are no animals", async () => {
    const { queryClient } = renderWithProviders(<HomeScreen />);
    seedQuery(queryClient, trpc.animal.list.queryKey({ limit: 5, offset: 0 }), {
      data: [],
      meta: { total: 0, limit: 5, offset: 0 },
    });
    expect(await screen.findByText("No animals found")).toBeTruthy();
  });
});
```

### 7.4 Sample test — CREATE-ONLY tab (vaccination, mutation + invalidate + offline)

`apps/mob/app/(tabs)/health/__tests__/vaccination.test.tsx`:

```tsx
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { onlineManager } from "@tanstack/react-query";
import { renderWithProviders, seedQuery } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import {
  VaccinationFactory, AnimalFactory, FarmFactory, VaccineFactory, VaccineBatchFactory,
} from "@rocky/testing/factory";
import VaccinationScreen from "../vaccination";

const listSeed = (data: unknown[]) => ({
  data,
  meta: { total: data.length, limit: 50, offset: 0 },
});

describe("Vaccination screen", () => {
  afterEach(() => onlineManager.setOnline(true));

  it("records a vaccination online and invalidates the list", async () => {
    const recorded = VaccinationFactory.create();
    let captured: unknown;

    const { queryClient } = renderWithProviders(<VaccinationScreen />, {
      linkHandlers: {
        "health.recordVaccination": (input) => { captured = input; return recorded; },
        "health.listVaccinations": () => listSeed([recorded]),
        "animal.list": () => listSeed([AnimalFactory.create()]),
        "farm.list": () => listSeed([FarmFactory.create()]),
        "health.listVaccines": () => listSeed([VaccineFactory.create()]),
        "health.listBatches": () => listSeed([VaccineBatchFactory.create()]),
      },
    });
    // dropdowns resolve from seeded `list*` handlers; drive pickers + selects, then:
    fireEvent.press(screen.getByText("Record Vaccination"));
    await waitFor(() => expect(captured).toBeDefined());
    expect(captured).toMatchObject({ animalId: expect.any(String), vaccineId: expect.any(String) });
  });

  it("enqueues locally when offline", async () => {
    onlineManager.setOnline(false);
    renderWithProviders(<VaccinationScreen />, {
      linkHandlers: {
        "animal.list": () => listSeed([AnimalFactory.create()]),
        "farm.list": () => listSeed([FarmFactory.create()]),
        "health.listVaccines": () => listSeed([VaccineFactory.create()]),
        "health.listBatches": () => listSeed([VaccineBatchFactory.create()]),
        "health.listVaccinations": () => listSeed([]),
      },
    });
    fireEvent.press(screen.getByText("Record Vaccination"));
    // offline branch writes to the outbox (useOfflineMutation) and navigates back —
    // assert no online mutation fired (no "health.recordVaccination" handler → would throw).
    await waitFor(() => expect(screen.queryByText("Record Vaccination")).toBeTruthy());
  });
});
```

### 7.5 Data-wiring example — replace raw UUID input with a list dropdown

For `health/vaccination.tsx`, swap the `vaccineId` `Input` for a `Select` fed by `listVaccines` (same pattern already used by `AnimalPicker`):

```tsx
// inside VaccinationScreen — replace the Vaccine ID <FormField><Input/></FormField> block:
const { data: vaccines } = trpc.health.listVaccines.useQuery({ limit: 50, offset: 0 });

<FormField label="Vaccine" error={errors.vaccineId?.message} nativeID="vaccineId">
  <Select
    value={vaccines?.data.find((v) => v.id === watch("vaccineId"))
      ? { value: watch("vaccineId"), label: vaccines.data.find((v) => v.id === watch("vaccineId"))!.name }
      : undefined}
    onValueChange={(opt) => setValue("vaccineId", opt?.value ?? "", { shouldValidate: true })}
  >
    <SelectTrigger><SelectValue placeholder="Select vaccine..." /></SelectTrigger>
    <SelectContent>
      {vaccines?.data.map((v) => (
        <SelectItem key={v.id} label={v.name} value={v.id} />
      ))}
    </SelectContent>
  </Select>
</FormField>
```

Apply the same shape for `batchId` (`health.listBatches`), `health/treatment.tsx` `diseaseId` (`health.listDiseases`), and `movements/pasture.tsx`/`slaughter.tsx` farm UUIDs (`farm.list` via `FarmPicker`).

### 7.6 Data-wiring example — index list query

`health/index.tsx` (add a recent-events list after the nav cards):

```tsx
const { data: recent } = trpc.health.listVaccinations.useQuery({ limit: 5, offset: 0 });
// ...render recent?.data.map(...) with an <Empty> fallback when !recent || recent.data.length === 0
```

`movements/index.tsx`:

```tsx
const { data: recent } = trpc.movement.list.useQuery({ limit: 5, offset: 0 });
// ...render recent?.data.map(...) with an <Empty> fallback
```

---

## 8. Premortem (risks)

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|------------|
| R1 | `react-native-web` + jsdom doesn't render a specific native-only primitive (e.g. `Alert`, `FlatList`) cleanly | Medium | Mock `@/lib/notify` (Alert flows) ; `FlatList` maps to a scroll view under RNW; add per-component setup mocks as discovered. |
| R2 | `expo-router` `useRouter`/`Stack` not mocked → tests crash on import | High | Global `vi.mock("expo-router", …)` in `vitest.setup.ts` (done in §7.1). |
| R3 | `invalidateQueries` after a create mutation has no fake-link handler → throws "no handler" | Medium | Every create-screen test registers BOTH the mutation path AND the invalidated `list*` path (§7.4). |
| R4 | Seeded query refetches and hits an absent handler (staleTime not Infinity) | Low | Test `QueryClient` forces `staleTime: Infinity` (§7.2). |
| R5 | Offline path not exercised (onlineManager defaults online) | Medium | Explicit `onlineManager.setOnline(false)` + `afterEach` reset (§7.4). |
| R6 | Factory output shape ≠ screen's summary projection | Low | Map factory rows to the summary fields the screen reads (§7.3 shows the `AnimalSummary` mapping). |
| R7 | `generated/server.ts` drift if a procedure name guessed wrong | Low | Scout confirmed all procedure names; if a real name differs, `pnpm generate:trpc` regenerates (do NOT hand-edit). |

---

## 9. Verification

Run the new mobile suite:

```bash
pnpm --filter @rocky/mobile test          # vitest run (CI)
pnpm --filter @rocky/mobile test:watch    # watch mode
```

Or from repo root after the runner todo lands:

```bash
pnpm test --filter @rocky/mobile
```

Acceptance:

- `apps/mob/vitest.config.ts` + `vitest.setup.ts` exist; `pnpm --filter @rocky/mobile test` runs green.
- Shared helper `apps/mob/test/{render,trpc-fake-client}.ts(x)` exists and is imported by tab tests.
- Every target tab has a `*.test.{ts,tsx}` next to it (interleaved with its data wire).
- `health` + `movements` sub-screens no longer contain raw UUID `Input`s for vaccine/batch/disease/farm — replaced by `list*` dropdowns.
- `health/index` + `movements/index` render a seeded recent-events/movements list with an `<Empty>` fallback.
- `explore` + `sync` smoke tests pass (mount + local-state assertions only).
