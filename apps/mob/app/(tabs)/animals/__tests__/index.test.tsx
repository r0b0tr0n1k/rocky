import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import AnimalsListScreen from "../index";

// `animal.list` returns the flat `{ data, total, limit, offset }` envelope
// (see animalListResponseSchema in @rocky/validators/api/animals.api), and
// each item is an AnimalSummary. The screen calls useQuery with
// `{ search: undefined, limit: 20, offset: 0 }`, so seed the same input.

const listedAnimal = {
  id: "33333333-3333-3333-3333-333333333333",
  stateCode: "MK",
  earTagNumber: "0000A001",
  sex: "F",
  breed: "Simmental",
  status: "ALIVE",
  currentFarmId: "44444444-4444-4444-4444-444444444444",
  birthDate: "2025-03-12",
};

function seedAnimalList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.animal.list, { search: undefined, limit: 20, offset: 0 }, "query"), {
    data: rows,
    total: rows.length,
    limit: 20,
    offset: 0,
  });
}

test("renders a listed animal identifier from animal.list", async () => {
  const queryClient = makeTestQueryClient();
  seedAnimalList(queryClient, [listedAnimal]);
  renderWithProviders(<AnimalsListScreen />, { queryClient });

  // The row renders "{stateCode} {earTagNumber}" in one Text node.
  expect(await screen.findByText("MK 0000A001")).toBeTruthy();
});

test("shows the loading state before data resolves", async () => {
  // No seeding → animal.list stays pending → ListEmptyComponent shows Loading…
  renderWithProviders(<AnimalsListScreen />);
  expect(await screen.findByText("Loading...")).toBeTruthy();
});

test("shows the empty state when there are no animals", async () => {
  const queryClient = makeTestQueryClient();
  seedAnimalList(queryClient, []);
  renderWithProviders(<AnimalsListScreen />, { queryClient });

  expect(await screen.findByText("No animals found")).toBeTruthy();
});
