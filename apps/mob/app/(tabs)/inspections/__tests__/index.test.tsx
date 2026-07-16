import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import InspectionsListScreen from "../index";

// `inspection.list` returns the `{ data, total, limit, offset }` envelope
// (inspectionListResponseSchema in @rocky/validators/api/inspection.api), and
// each item is an InspectionResponse. The screen calls useQuery with
// `{ limit: 50, offset: 0 }`, so seed the same input. The screen renders
// `farmId` (sliced to 8), `scheduledDate`, and the `status` badge.

const inspection = {
  id: "a1a1a1a1-1111-1111-1111-111111111111",
  farmId: "f1f1f1f1-1111-1111-1111-111111111111",
  inspectorId: "i1i1i1i1-1111-1111-1111-111111111111",
  status: "scheduled",
  scheduledDate: "2026-07-20",
  riskScore: null,
  notes: null,
};

function seedInspectionList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.inspection.list, { limit: 50, offset: 0 }, "query"), {
    data: rows,
    total: rows.length,
    limit: 50,
    offset: 0,
  });
}

test("renders a farm identifier from inspection.list", async () => {
  const queryClient = makeTestQueryClient();
  seedInspectionList(queryClient, [inspection]);
  renderWithProviders(<InspectionsListScreen />, { queryClient });

  // The row renders "Farm: {farmId.slice(0, 8)}".
  expect(await screen.findByText("Farm: f1f1f1f1")).toBeTruthy();
});

test("renders the inspection status badge", async () => {
  const queryClient = makeTestQueryClient();
  seedInspectionList(queryClient, [inspection]);
  renderWithProviders(<InspectionsListScreen />, { queryClient });

  expect(await screen.findByText("scheduled")).toBeTruthy();
});

test("shows the empty state when there are no inspections", async () => {
  const queryClient = makeTestQueryClient();
  seedInspectionList(queryClient, []);
  renderWithProviders(<InspectionsListScreen />, { queryClient });

  expect(await screen.findByText("No inspections found")).toBeTruthy();
});

test("shows the loading/empty placeholder while the query is pending", async () => {
  // No seeding → inspection.list stays pending → ListEmptyComponent shows.
  renderWithProviders(<InspectionsListScreen />);

  expect(await screen.findByText("No inspections found")).toBeTruthy();
});
