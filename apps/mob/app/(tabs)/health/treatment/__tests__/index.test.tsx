import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import TreatmentListScreen from "../index";

function seedList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.health.listTreatments, { limit: 20, offset: 0 }, "query"), {
    data: rows,
    meta: { total: rows.length, limit: 20, offset: 0 },
  });
}

test("renders seeded treatments from listTreatments", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, [
    { id: "t1", treatmentDesc: "Antibiotic course", diagnosisDate: "2026-01-10", isolated: true },
  ]);
  renderWithProviders(<TreatmentListScreen />, { queryClient });
  expect(await screen.findByText("Antibiotic course")).toBeTruthy();
  expect(screen.getByText("Isolated")).toBeTruthy();
});

test("shows loading state before data resolves", async () => {
  renderWithProviders(<TreatmentListScreen />);
  expect(await screen.findByText("Loading…")).toBeTruthy();
});

test("shows empty state when no treatments", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, []);
  renderWithProviders(<TreatmentListScreen />, { queryClient });
  expect(await screen.findByText("No treatments found")).toBeTruthy();
});
