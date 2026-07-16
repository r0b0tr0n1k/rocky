import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import LabTestListScreen from "../index";

function seedList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(
    queryClient,
    getQueryKey(trpc.health.listLabTests, { limit: 20, offset: 0 }, "query"),
    { data: rows, meta: { total: rows.length, limit: 20, offset: 0 } },
  );
}

test("renders seeded lab tests from listLabTests", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, [
    { id: "l1", testType: "Brucella", sampleDate: "2026-02-01", result: "NEGATIVE" },
  ]);
  renderWithProviders(<LabTestListScreen />, { queryClient });
  expect(await screen.findByText("Brucella")).toBeTruthy();
  expect(screen.getByText("NEGATIVE")).toBeTruthy();
});

test("shows loading state before data resolves", async () => {
  renderWithProviders(<LabTestListScreen />);
  expect(await screen.findByText("Loading…")).toBeTruthy();
});

test("shows empty state when no lab tests", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, []);
  renderWithProviders(<LabTestListScreen />, { queryClient });
  expect(await screen.findByText("No lab tests found")).toBeTruthy();
});
