import { screen } from "@testing-library/react";
import { getQueryKey } from "@trpc/react-query";
import { renderWithProviders, seedQuery, makeTestQueryClient } from "@/test/render";
import { trpc } from "@/providers/trpc-provider";
import CorrectionsListScreen from "../index";

// `correction.list` returns the `{ data, total, limit, offset }` envelope
// (correctionListResponseSchema in @rocky/validators/api/correction.api), and
// each item is a CorrectionResponse. The screen calls useQuery with
// `{ limit: 50, offset: 0 }`, so seed the same input. The screen renders
// `errorType`, `errorDescription`, and the `status` badge.

const correction = {
  id: "d1d1d1d1-1111-1111-1111-111111111111",
  detectionSource: "field",
  farmId: "cccccccc-3333-3333-3333-333333333333",
  animalId: "bbbbbbbb-2222-2222-2222-222222222222",
  errorType: "duplicate_ear_tag",
  errorDescription: "Two animals share the same ear tag.",
  originalData: null,
  correctedData: null,
  status: "pending",
  caseType: null,
  resolutionNotes: null,
  resolvedBy: null,
  resolvedAt: null,
  archiveNumber: null,
  passportReprintRequired: false,
  passportId: null,
  escalatedTo: null,
  escalatedAt: null,
  escalationReason: null,
  assignedToVs: null,
  assignedAt: null,
  vsResolutionAttempted: false,
  techCode: null,
  isActive: true,
  createdAt: "2026-07-15",
  updatedAt: null,
} as const;

function seedCorrectionList(queryClient: ReturnType<typeof makeTestQueryClient>, rows: unknown[]) {
  seedQuery(queryClient, getQueryKey(trpc.correction.list, { limit: 50, offset: 0 }, "query"), {
    data: rows,
    total: rows.length,
    limit: 50,
    offset: 0,
  });
}

test("renders an error type from correction.list", async () => {
  const queryClient = makeTestQueryClient();
  seedCorrectionList(queryClient, [correction]);
  renderWithProviders(<CorrectionsListScreen />, { queryClient });

  expect(await screen.findByText("duplicate_ear_tag")).toBeTruthy();
});

test("renders the correction description", async () => {
  const queryClient = makeTestQueryClient();
  seedCorrectionList(queryClient, [correction]);
  renderWithProviders(<CorrectionsListScreen />, { queryClient });

  expect(await screen.findByText("Two animals share the same ear tag.")).toBeTruthy();
});

test("renders the correction status badge", async () => {
  const queryClient = makeTestQueryClient();
  seedCorrectionList(queryClient, [correction]);
  renderWithProviders(<CorrectionsListScreen />, { queryClient });

  expect(await screen.findByText("pending")).toBeTruthy();
});

test("shows the empty state when there are no corrections", async () => {
  const queryClient = makeTestQueryClient();
  seedCorrectionList(queryClient, []);
  renderWithProviders(<CorrectionsListScreen />, { queryClient });

  expect(await screen.findByText("No corrections found")).toBeTruthy();
});

test("shows the empty state while the query is pending", async () => {
  renderWithProviders(<CorrectionsListScreen />);

  expect(await screen.findByText("No corrections found")).toBeTruthy();
});
