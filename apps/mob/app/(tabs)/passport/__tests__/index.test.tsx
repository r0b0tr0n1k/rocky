import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import { PASSPORT_STATUS } from "@rocky/validators/enums";
import PassportListScreen from "../index";

// `passport.list` returns the `{ data, total, limit, offset }` envelope
// (passportListResponseSchema in @rocky/validators/api/passport.api), and each
// item is a PassportResponse. The screen calls useQuery with
// `{ limit: 50, offset: 0 }`, so seed the same input. The screen renders
// `passportNumber`, `Animal: {animalId.slice(0, 8)}`, and the `status` badge.

const passport = {
  id: "a1a1a1a1-1111-1111-1111-111111111111",
  passportNumber: "PASS-1001",
  animalId: "bbbbbbbb-2222-2222-2222-222222222222",
  farmId: "cccccccc-3333-3333-3333-333333333333",
  status: PASSPORT_STATUS.ACTIVE,
  issueDate: "2026-07-15",
  isActive: true,
} as const;

function seedPassportList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.passport.list, { limit: 50, offset: 0 }, "query"), {
    data: rows,
    total: rows.length,
    limit: 50,
    offset: 0,
  });
}

test("renders a passport number from passport.list", async () => {
  const queryClient = makeTestQueryClient();
  seedPassportList(queryClient, [passport]);
  renderWithProviders(<PassportListScreen />, { queryClient });

  expect(await screen.findByText("PASS-1001")).toBeTruthy();
});

test("renders the passport status badge", async () => {
  const queryClient = makeTestQueryClient();
  seedPassportList(queryClient, [passport]);
  renderWithProviders(<PassportListScreen />, { queryClient });

  expect(await screen.findByText("active")).toBeTruthy();
});

test("shows the empty state when there are no passports", async () => {
  const queryClient = makeTestQueryClient();
  seedPassportList(queryClient, []);
  renderWithProviders(<PassportListScreen />, { queryClient });

  expect(await screen.findByText("No passports found")).toBeTruthy();
});

test("shows the empty state while the query is pending", async () => {
  renderWithProviders(<PassportListScreen />);

  expect(await screen.findByText("No passports found")).toBeTruthy();
});
