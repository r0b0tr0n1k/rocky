import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import EarTagOrdersScreen from "../index";

// `earTag.listOrders` returns the `{ data, total, limit, offset }` envelope
// (earTagOrderListResponseSchema in @rocky/validators/api/eartags.api), and each
// item is an EarTagOrderResponse. The screen calls useQuery with
// `{ limit: 50, offset: 0 }`, so seed the same input. The screen renders
// `orderNumber`, `orderDate`, and the `status` badge.

const order = {
  id: "b2b2b2b2-2222-2222-2222-222222222222",
  orderNumber: "ORD-1001",
  orderDate: "2026-07-15",
  status: "draft",
  supplierName: "Acme Tags",
  totalQuantity: 100,
};

function seedOrderList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.earTag.listOrders, { limit: 50, offset: 0 }, "query"), {
    data: rows,
    total: rows.length,
    limit: 50,
    offset: 0,
  });
}

test("renders an order number from earTag.listOrders", async () => {
  const queryClient = makeTestQueryClient();
  seedOrderList(queryClient, [order]);
  renderWithProviders(<EarTagOrdersScreen />, { queryClient });

  // The row renders "Order #{orderNumber}".
  expect(await screen.findByText("Order #ORD-1001")).toBeTruthy();
});

test("renders the ear-tag order status badge", async () => {
  const queryClient = makeTestQueryClient();
  seedOrderList(queryClient, [order]);
  renderWithProviders(<EarTagOrdersScreen />, { queryClient });

  expect(await screen.findByText("draft")).toBeTruthy();
});

test("shows the empty state when there are no orders", async () => {
  const queryClient = makeTestQueryClient();
  seedOrderList(queryClient, []);
  renderWithProviders(<EarTagOrdersScreen />, { queryClient });

  expect(await screen.findByText("No orders found")).toBeTruthy();
});

test("shows the loading/empty placeholder while the query is pending", async () => {
  // No seeding → earTag.listOrders stays pending → ListEmptyComponent shows.
  renderWithProviders(<EarTagOrdersScreen />);

  expect(await screen.findByText("No orders found")).toBeTruthy();
});
