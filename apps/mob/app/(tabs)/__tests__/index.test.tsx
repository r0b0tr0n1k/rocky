import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import HomeScreen from "../index";

// `animal.list` returns the flat `{ data, total, limit, offset }` envelope
// (see animalListResponseSchema in @rocky/validators/api/animals.api), and
// each item is an AnimalSummary (id, stateCode, earTagNumber, sex, breed,
// status, currentFarmId, birthDate). `notification.unreadCount` returns
// `{ count }`.

// One hand-built AnimalSummary matching the validator's animal.list shape.
const recentAnimal = {
  id: "11111111-1111-1111-1111-111111111111",
  stateCode: "MK",
  earTagNumber: "00000001",
  sex: "M",
  breed: "Holstein",
  status: "ALIVE",
  currentFarmId: "22222222-2222-2222-2222-222222222222",
  birthDate: "2025-01-01",
};

function seedAnimalList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.animal.list, { limit: 5, offset: 0 }, "query"), {
    data: rows,
    total: rows.length,
    limit: 5,
    offset: 0,
  });
}

function seedUnreadCount(queryClient: ReturnType<typeof makeTestQueryClient>, count: number) {
  seedQuery(queryClient, getQueryKey(trpc.notification.unreadCount, undefined, "query"), { count });
}

test("renders a recent animal identifier from animal.list", async () => {
  const queryClient = makeTestQueryClient();
  seedAnimalList(queryClient, [recentAnimal]);
  renderWithProviders(<HomeScreen />, { queryClient });

  // The row renders "{stateCode} {earTagNumber}" in one Text node.
  expect(await screen.findByText("MK 00000001")).toBeTruthy();
});

test("shows the unread notification badge when unreadCount > 0", async () => {
  const queryClient = makeTestQueryClient();
  seedAnimalList(queryClient, [recentAnimal]);
  seedUnreadCount(queryClient, 3);
  renderWithProviders(<HomeScreen />, { queryClient });

  expect(await screen.findByText("3")).toBeTruthy();
});

test("shows the empty state when there are no animals", async () => {
  const queryClient = makeTestQueryClient();
  seedAnimalList(queryClient, []);
  renderWithProviders(<HomeScreen />, { queryClient });

  expect(await screen.findByText("No animals found")).toBeTruthy();
});
