// ── CorrectionService — Scenario B unit tests (mocked Repository, no DB) ──
//
// Per the Diamond Seal Testing Doctrine: we mock the Repository (the shovel),
// never @rocky/database. Factory data (ErrorCorrectionFactory) drives the test,
// and we assert the Result-monad outcomes + the correction state machine.
//
// NOTE: CorrectionService pipes every repository result through
// correctionResponseSchema, which is .strict() and omits `createdBy`/`validTo`.
// So the mock repository must return the factory record *minus* those two keys.

import { describe, expect, it, vi } from "vitest";
import { CorrectionService } from "./correction.service.js";
import type { CorrectionRepository } from "../repositories/correction.repository.js";
import { CORRECTION_STATUS, DETECTION_SOURCE } from "@rocky/database/constants";
import { ErrorCorrectionFactory, mockRepoReturn } from "@rocky/testing";
import type { ErrorCorrectionRecord } from "@rocky/testing";

// Strip the two keys the API response schema omits (it is .strict()).
function asResponse(record: ErrorCorrectionRecord) {
  const { createdBy, validTo, ...rest } = record;
  return rest;
}

type RepoResponse = ReturnType<typeof asResponse>;

/** Build a fully-mocked repo that returns `seed` for every read/write. */
function makeRepo(seed: ErrorCorrectionRecord) {
  const response = asResponse(seed);
  const repo = {
    findById: mockRepoReturn(response),
    listFiltered: mockRepoReturn({ data: [response], total: 1 }),
    create: mockRepoReturn(response),
    updateStatus: mockRepoReturn(response),
    escalate: mockRepoReturn(response),
  } as unknown as CorrectionRepository;
  return { repo, response, seed };
}

/** Repo that simulates "not found" everywhere. */
function notFoundRepo(): CorrectionRepository {
  return {
    findById: mockRepoReturn(null),
    listFiltered: mockRepoReturn({ data: [], total: 0 }),
    create: mockRepoReturn(null),
    updateStatus: mockRepoReturn(null),
    escalate: mockRepoReturn(null),
  } as unknown as CorrectionRepository;
}

describe("CorrectionService — getById", () => {
  it("returns the correction when found", async () => {
    const { repo, seed } = makeRepo(new ErrorCorrectionFactory().create());
    const result = await new CorrectionService(repo).getById(seed.id);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value.id).toBe(seed.id);
  });

  it("returns an error when not found", async () => {
    const result = await new CorrectionService(notFoundRepo()).getById("missing-id");
    expect(result.isErr()).toBe(true);
  });
});

describe("CorrectionService — create", () => {
  it("creates a pending correction", async () => {
    const { repo, seed } = makeRepo(new ErrorCorrectionFactory().createPending());
    const result = await new CorrectionService(repo).create({
      detectionSource: DETECTION_SOURCE.FIELD,
      errorType: "duplicate_ear_tag",
      errorDescription: "Tag applied twice",
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value.status).toBe(CORRECTION_STATUS.PENDING);
  });
});

describe("CorrectionService — state machine", () => {
  it("review: PENDING → UNDER_REVIEW succeeds", async () => {
    const { repo, seed } = makeRepo(new ErrorCorrectionFactory().createPending());
    const result = await new CorrectionService(repo).review(seed.id);
    expect(result.isOk()).toBe(true);
  });

  it("review: RESOLVED → UNDER_REVIEW is rejected (no valid transition)", async () => {
    const { repo, seed } = makeRepo(new ErrorCorrectionFactory().createResolved());
    const result = await new CorrectionService(repo).review(seed.id);
    expect(result.isErr()).toBe(true);
  });

  it("resolve: UNDER_REVIEW → RESOLVED succeeds and archives + reprints", async () => {
    const passportId = crypto.randomUUID();
    const seed = new ErrorCorrectionFactory().create({
      status: CORRECTION_STATUS.UNDER_REVIEW,
      passportReprintRequired: true,
      passportId,
    });
    const { repo } = makeRepo(seed);
    const archiveService = { archiveErrorCorrection: vi.fn().mockResolvedValue(undefined) };
    const passportService = { reprint: vi.fn().mockResolvedValue(undefined) };

    const result = await new CorrectionService(repo, archiveService, passportService).resolve(
      seed.id,
      { resolvedBy: crypto.randomUUID() },
    );

    expect(result.isOk()).toBe(true);
    expect(archiveService.archiveErrorCorrection).toHaveBeenCalled();
    expect(passportService.reprint).toHaveBeenCalledWith(passportId);
  });

  it("resolve: PENDING → RESOLVED is rejected (must be reviewed first)", async () => {
    const { repo, seed } = makeRepo(new ErrorCorrectionFactory().createPending());
    const result = await new CorrectionService(repo).resolve(seed.id, {
      resolvedBy: crypto.randomUUID(),
    });
    expect(result.isErr()).toBe(true);
  });

  it("escalate: UNDER_REVIEW → ESCALATED succeeds", async () => {
    const { repo, seed } = makeRepo(
      new ErrorCorrectionFactory().create({ status: CORRECTION_STATUS.UNDER_REVIEW }),
    );
    const result = await new CorrectionService(repo).escalate(seed.id, {
      escalatedTo: crypto.randomUUID(),
      reason: "Needs VI on-spot control",
    });
    expect(result.isOk()).toBe(true);
  });

  it("reject: PENDING → REJECTED succeeds", async () => {
    const { repo, seed } = makeRepo(new ErrorCorrectionFactory().createPending());
    const result = await new CorrectionService(repo).reject(seed.id);
    expect(result.isOk()).toBe(true);
  });
});

describe("CorrectionService — list", () => {
  it("returns a paginated list", async () => {
    const { repo } = makeRepo(new ErrorCorrectionFactory().create());
    const result = await new CorrectionService(repo).list({ limit: 20, offset: 0 });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.data).toHaveLength(1);
      expect(result.value.total).toBe(1);
      expect(result.value.limit).toBe(20);
    }
  });
});
