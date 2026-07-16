import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import NotificationsScreen from "../index";

// The notification router has NO `list` procedure — only `unreadCount`, `send`,
// `markAsRead`, `confirmDelivery`, and `registerDevice`. The screen reads
// `trpc.notification.unreadCount.useQuery()` (input undefined) and renders the
// returned `{ count }` as a large number. Seed that shape and assert the
// unread-count text appears.

function seedUnreadCount(queryClient: ReturnType<typeof makeTestQueryClient>, count: number) {
  seedQuery(queryClient, getQueryKey(trpc.notification.unreadCount, undefined, "query"), { count });
}

test("renders the unread notification count from notification.unreadCount", async () => {
  const queryClient = makeTestQueryClient();
  seedUnreadCount(queryClient, 7);
  renderWithProviders(<NotificationsScreen />, { queryClient });

  expect(await screen.findByText("7")).toBeTruthy();
});

test("shows zero when there are no unread notifications", async () => {
  const queryClient = makeTestQueryClient();
  seedUnreadCount(queryClient, 0);
  renderWithProviders(<NotificationsScreen />, { queryClient });

  // The screen falls back to 0 via `unreadCount?.count ?? 0`.
  expect(await screen.findByText("0")).toBeTruthy();
});

test("renders the unread-notifications heading (mount smoke)", async () => {
  const queryClient = makeTestQueryClient();
  seedUnreadCount(queryClient, 3);
  renderWithProviders(<NotificationsScreen />, { queryClient });

  expect(await screen.findByText("Unread Notifications")).toBeTruthy();
});
