import { screen, waitFor } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import VaccineListScreen from "../index";

function seedList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.health.listVaccines, { limit: 20, offset: 0 }, "query"), {
    data: rows,
    meta: { total: rows.length, limit: 20, offset: 0 },
  });
}

test("renders seeded vaccines from listVaccines", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, [{ id: "v1", name: "Bovilis IBR", manufacturer: "Merck", type: "INJECTABLE" }]);
  renderWithProviders(<VaccineListScreen />, { queryClient });
  expect(await screen.findByText("Bovilis IBR")).toBeTruthy();
  expect(screen.getByText("Merck")).toBeTruthy();
});

test("shows loading state before data resolves", async () => {
  renderWithProviders(<VaccineListScreen />);
  expect(await screen.findByText("Loading…")).toBeTruthy();
});

test("shows empty state when no vaccines", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, []);
  renderWithProviders(<VaccineListScreen />, { queryClient });
  expect(await screen.findByText("No vaccines found")).toBeTruthy();
});
