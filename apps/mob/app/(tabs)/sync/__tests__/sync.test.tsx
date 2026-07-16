import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import SyncScreen from "../index";
import { vi } from "vitest";

// SMOKE test only — the Sync tab is intentionally UNWIRED by design: it is an
// offline outbox driven by `useOffline` (local SQLite, no live tRPC). We mock
// the provider with controllable state and assert the static UI (connection
// status badge, pending badge, sync button, and the empty-outbox message)
// renders correctly for the relevant local states. The mock replaces the whole
// module, so the real provider's native (SQLite) surface never loads.

const { current, fns } = vi.hoisted(() => ({
  current: {
    isOnline: true,
    pendingCount: 0,
    items: [] as Array<{ idempotency_key: string; type: string; status: string; error_message?: string }>,
    isBusy: false,
  },
  fns: { flush: vi.fn(), download: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/providers/offline-provider", () => ({
  useOffline: () => ({
    isOnline: current.isOnline,
    pendingCount: current.pendingCount,
    items: current.items,
    isBusy: current.isBusy,
    flush: fns.flush,
    download: fns.download,
    dismiss: fns.dismiss,
  }),
}));

beforeEach(() => {
  fns.flush.mockClear();
  fns.download.mockClear();
  fns.dismiss.mockClear();
  current.isOnline = true;
  current.pendingCount = 0;
  current.items = [];
  current.isBusy = false;
});

test("renders connection status + pending badge when online with empty outbox", () => {
  current.isOnline = true;
  current.pendingCount = 0;
  current.items = [];
  renderWithProviders(<SyncScreen />);
  expect(screen.getByText("Connection")).toBeTruthy();
  expect(screen.getByText("Online")).toBeTruthy();
  expect(screen.getByText("Pending")).toBeTruthy();
  expect(screen.getByText("0")).toBeTruthy();
  expect(screen.getByText("Nothing queued. All changes are synced.")).toBeTruthy();
});

test("shows pending count + queued item when the outbox has items", () => {
  current.isOnline = true;
  current.pendingCount = 2;
  current.items = [
    { idempotency_key: "k1", type: "vaccination", status: "pending" },
    { idempotency_key: "k2", type: "treatment", status: "syncing" },
  ];
  renderWithProviders(<SyncScreen />);
  expect(screen.getByText("2")).toBeTruthy();
  expect(screen.getByText("Outbox (2)")).toBeTruthy();
  expect(screen.getByText("vaccination")).toBeTruthy();
  expect(screen.getByText("treatment")).toBeTruthy();
});

test("shows Offline status and disabled sync affordance when not online", () => {
  current.isOnline = false;
  current.pendingCount = 1;
  current.items = [{ idempotency_key: "k1", type: "vaccination", status: "pending" }];
  renderWithProviders(<SyncScreen />);
  expect(screen.getByText("Offline")).toBeTruthy();
  expect(screen.getByText("Offline — syncs on reconnect")).toBeTruthy();
});
