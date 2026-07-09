import { describe, expect, it, vi, beforeEach } from "vitest";
import { InspectionService } from "./inspection.service.js";
import type { InspectionRepository } from "../repositories/inspection.repository.js";
import { InspectionFactory } from "@rocky/testing";
import { inspectionResponseSchema } from "@rocky/validators/api";
import { InspectionError, INSPECTION_ERRORS } from "../errors/inspection.errors.js";
import { INSPECTION_STATUS } from "@rocky/database/constants";

/**
 * WO-030 workflow test — pure unit test (Scenario B): mock the repository,
 * drive the inspection lifecycle with `InspectionFactory`, assert on `Result`,
 * and re-parse with the integration `inspectionResponseSchema`. No DB.
 */
describe("InspectionService — lifecycle state machine (workflow)", () => {
  const farmId = "66666666-6666-4666-8666-666666666666";
  const inspectorId = "77777777-7777-4777-8777-777777777777";
  let service: InspectionService;
  let repo: InspectionRepository;

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      update: vi.fn(),
    } as unknown as InspectionRepository;
    // animalRepo / archiveService / riskAnalysisService are optional and omitted;
    // complete()'s fire-and-forget archive call is therefore not exercised.
    service = new InspectionService(repo);
  });

  describe("schedule (SCHEDULED → SCHEDULED)", () => {
    it("re-schedules a SCHEDULED inspection", async () => {
      const scheduled = new InspectionFactory(farmId, inspectorId).createScheduled();
      repo.findById = vi.fn().mockResolvedValue(scheduled);
      repo.update = vi.fn().mockResolvedValue({ ...scheduled, scheduledDate: "2026-06-01" });

      const res = await service.schedule(scheduled.id, "2026-06-01");

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.status).toBe(INSPECTION_STATUS.SCHEDULED);
        expect(() => inspectionResponseSchema.parse(res.value)).not.toThrow();
      }
    });

    it("rejects scheduling a COMPLETED inspection (invalid transition)", async () => {
      const completed = new InspectionFactory(farmId, inspectorId).create({ status: INSPECTION_STATUS.COMPLETED });
      repo.findById = vi.fn().mockResolvedValue(completed);

      const res = await service.schedule(completed.id, "2026-06-01");

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(InspectionError);
        expect(res.error.code).toBe(INSPECTION_ERRORS.INVALID_STATUS_TRANSITION);
      }
    });
  });

  describe("complete (→ COMPLETED)", () => {
    it("completes a SCHEDULED inspection when the inspection date is on/after the scheduled date", async () => {
      const scheduled = new InspectionFactory(farmId, inspectorId).createScheduled({ scheduledDate: "2026-05-01" });
      repo.findById = vi.fn().mockResolvedValue(scheduled);
      repo.update = vi.fn().mockResolvedValue({
        ...scheduled,
        status: INSPECTION_STATUS.COMPLETED,
        inspectionDate: "2026-05-10",
      });

      const res = await service.complete({ id: scheduled.id, inspectionDate: "2026-05-10" });

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.status).toBe(INSPECTION_STATUS.COMPLETED);
        expect(() => inspectionResponseSchema.parse(res.value)).not.toThrow();
      }
    });

    it("rejects completion when the inspection date precedes the scheduled date", async () => {
      const scheduled = new InspectionFactory(farmId, inspectorId).createScheduled({ scheduledDate: "2026-05-10" });
      repo.findById = vi.fn().mockResolvedValue(scheduled);

      const res = await service.complete({ id: scheduled.id, inspectionDate: "2026-05-01" });

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(InspectionError);
        expect(res.error.code).toBe(INSPECTION_ERRORS.INVALID_DATE_ORDER);
      }
      expect(repo.update).not.toHaveBeenCalled();
    });
  });
});
