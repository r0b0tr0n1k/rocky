import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { HealthService } from "@rocky/domains-health";
import { CORRECTION_CASE_TYPE, DETECTION_SOURCE } from "@rocky/database/constants";
import { VaccineReconciliationJob } from "../jobs/vaccine-reconciliation.job.js";

// The constructor requires repo + subjectRepo + animalRepo + system (non-optional).
// reconcileVaccineStock only touches repo + correctionService; the others are dummies.
const dummySubjectRepo = {} as never;
const dummyAnimalRepo = {} as never;
const dummySystem = {} as never;

function makeService(opts: { drifted?: any[]; createOk?: boolean } = {}) {
  const drifted = opts.drifted ?? [];
  const repo = {
    findDriftedVaccineBatches: vi.fn().mockResolvedValue(drifted),
  } as any;

  const createdCases: any[] = [];
  const correctionService = {
    create: vi.fn(async (input: any) => {
      createdCases.push(input);
      return opts.createOk === false
        ? { isOk: () => false, isErr: () => true, error: new Error("boom") }
        : { isOk: () => true, isErr: () => false, value: { id: "case-1" } };
    }),
  } as any;

  const svc = new HealthService(
    repo,
    dummySubjectRepo,
    dummyAnimalRepo,
    dummySystem,
    undefined,
    correctionService,
  );
  return { svc, repo, correctionService, createdCases };
}

const driftedBatch = (id: string, received: number, remaining: number, administered: number) => ({
  id,
  quantityReceived: received,
  quantityRemaining: remaining,
  administered,
});

describe("HealthService.reconcileVaccineStock (WO-020)", () => {
  it("opens an a-posteriori COMPLEX case per drifted batch", async () => {
    const { svc, correctionService, createdCases } = makeService({
      drifted: [
        driftedBatch("b1", 100, 90, 5), // 100 != 90 + 5 -> drift
        driftedBatch("b2", 50, 40, 3), // 50 != 40 + 3 -> drift
      ],
    });

    const result = await svc.reconcileVaccineStock("tester");

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value).toEqual({ driftedCount: 2, correctionsCreated: 2 });
    expect(correctionService.create).toHaveBeenCalledTimes(2);
    expect(createdCases[0].caseType).toBe(CORRECTION_CASE_TYPE.COMPLEX);
    expect(createdCases[0].detectionSource).toBe(DETECTION_SOURCE.A_POSTERIORI);
    expect(createdCases[0].errorType).toBe("vaccine_stock_mismatch");
    expect(createdCases[0].createdBy).toBe("tester");
  });

  it("opens no cases when nothing is drifted", async () => {
    const { svc, correctionService } = makeService({ drifted: [] });
    const result = await svc.reconcileVaccineStock();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value).toEqual({ driftedCount: 0, correctionsCreated: 0 });
    expect(correctionService.create).not.toHaveBeenCalled();
  });

  it("is a silent no-op when correctionService is not injected", async () => {
    const repo = { findDriftedVaccineBatches: vi.fn().mockResolvedValue([driftedBatch("b1", 100, 90, 5)]) } as any;
    const correctionService = { create: vi.fn() } as any;
    const svc = new HealthService(repo, dummySubjectRepo, dummyAnimalRepo, dummySystem, undefined, undefined);
    const result = await svc.reconcileVaccineStock();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value).toEqual({ driftedCount: 0, correctionsCreated: 0 });
    expect(correctionService.create).not.toHaveBeenCalled();
  });

  it("keeps driftedCount but counts 0 corrections when case creation fails", async () => {
    const { svc } = makeService({
      drifted: [driftedBatch("b1", 100, 90, 5)],
      createOk: false,
    });
    const result = await svc.reconcileVaccineStock();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value).toEqual({ driftedCount: 1, correctionsCreated: 0 });
  });
});

describe("VaccineReconciliationJob (WO-020)", () => {
  it("runs the daily reconciliation via HealthService", async () => {
    const reconcile = vi.fn().mockResolvedValue({ isOk: () => true, isErr: () => false, value: { driftedCount: 3, correctionsCreated: 3 } });
    const healthService = { reconcileVaccineStock: reconcile } as any;
    const job = new VaccineReconciliationJob(healthService);
    await job.runReconciliation();
    expect(reconcile).toHaveBeenCalledOnce();
  });

  it("does not throw when reconciliation errors", async () => {
    const reconcile = vi.fn().mockResolvedValue({ isOk: () => false, isErr: () => true, error: new Error("x") });
    const healthService = { reconcileVaccineStock: reconcile } as any;
    const job = new VaccineReconciliationJob(healthService);
    await expect(job.runReconciliation()).resolves.toBeUndefined();
  });
});
