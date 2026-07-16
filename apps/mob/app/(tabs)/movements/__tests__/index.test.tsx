import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import MovementsIndexScreen from "../index";

// `movement.list` returns a flat `{ data, total, limit, offset }` envelope
// (see movementListResponseSchema in @rocky/validators/api), unlike the
// `{ data, meta }` envelope some other list procedures use.
function seedList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.movement.list, { limit: 20, offset: 0 }, "query"), {
    data: rows,
    total: rows.length,
    limit: 20,
    offset: 0,
  });
}

test("renders seeded movements from movement.list", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, [
    {
      id: "m1",
      animalId: "ANIMAL-MOV-1",
      fromFarmId: "farm-a",
      toFarmId: "farm-b",
      type: "TRANSFER",
      movementDate: new Date("2026-01-15"),
      isActive: true,
    },
    {
      id: "m2",
      animalId: "ANIMAL-MOV-2",
      fromFarmId: null,
      toFarmId: "farm-c",
      type: "DEATH",
      movementDate: new Date("2026-02-20"),
      isActive: true,
    },
  ]);
  renderWithProviders(<MovementsIndexScreen />, { queryClient });

  expect(await screen.findByText("TRANSFER")).toBeTruthy();
  expect(await screen.findByText("ANIMAL-MOV-1")).toBeTruthy();
  expect(screen.getByText("DEATH")).toBeTruthy();
  expect(screen.getByText("ANIMAL-MOV-2")).toBeTruthy();
});

test("shows loading state before data resolves", async () => {
  renderWithProviders(<MovementsIndexScreen />);
  expect(await screen.findByText("Loading…")).toBeTruthy();
});

test("shows empty state when no movements", async () => {
  const queryClient = makeTestQueryClient();
  seedList(queryClient, []);
  renderWithProviders(<MovementsIndexScreen />, { queryClient });
  expect(await screen.findByText("No movements found")).toBeTruthy();
});
