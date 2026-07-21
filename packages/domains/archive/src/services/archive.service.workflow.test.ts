import { describe, expect, it, vi, beforeEach } from "vitest";
import { ok } from "neverthrow";
import { ArchiveService } from "./archive.service.js";
import type { ArchiveRepository } from "../repositories/archive.repository.js";
import { ArchiveDocumentFactory } from "@rocky/testing";
import { archiveDocumentResponseSchema } from "@rocky/validators/api";
import { ArchiveError, ARCHIVE_ERRORS } from "../errors/archive.errors.js";
import type { SystemService } from "@rocky/domains-system";
import type { AuditService } from "@rocky/domains-audit";

/**
 * WO-030 workflow test — pure unit test (Scenario B): mock the repository,
 * drive the document lifecycle with `ArchiveDocumentFactory`, assert on `Result`,
 * and re-parse with the integration `archiveDocumentResponseSchema`. No DB.
 */
describe("ArchiveService — document lifecycle state machine (workflow)", () => {
  const farmId = "88888888-8888-4888-8888-888888888888";
  let service: ArchiveService;
  let repo: ArchiveRepository;
  let auditService: AuditService;

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      markArchived: vi.fn(),
      markDestroyed: vi.fn(),
    } as unknown as ArchiveRepository;
    // system is required by the constructor; markArchived/markDestroyed don't call it.
    const system = { getRuleSet: vi.fn().mockResolvedValue(ok({ jurisdiction: "MK" })) } as unknown as SystemService;
    // WO-159 Part 4 — archive lifecycle events must be mirrored to the audit trail.
    auditService = { recordArchiveAction: vi.fn().mockResolvedValue(ok(undefined)) } as unknown as AuditService;
    service = new ArchiveService(repo, system, auditService);
  });

  describe("markArchived", () => {
    it("archives a not-yet-archived document", async () => {
      const doc = new ArchiveDocumentFactory(farmId).create();
      repo.findById = vi.fn().mockResolvedValue(doc);
      repo.markArchived = vi.fn().mockResolvedValue({ ...doc, isArchived: true, archivedAt: new Date() });

      const res = await service.markArchived(doc.id);

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.isArchived).toBe(true);
        expect(() => archiveDocumentResponseSchema.parse(res.value)).not.toThrow();
      }
      // WO-159 Part 4 — the archive transition must be recorded as an ARCHIVE action.
      expect(auditService.recordArchiveAction).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "archiveDocument", resourceId: doc.id }),
      );
    });

    it("does NOT record an audit event when archiving is rejected", async () => {
      const doc = new ArchiveDocumentFactory(farmId).createArchived();
      repo.findById = vi.fn().mockResolvedValue(doc);

      const res = await service.markArchived(doc.id);

      expect(res.isErr()).toBe(true);
      expect(auditService.recordArchiveAction).not.toHaveBeenCalled();
    });

    it("rejects archiving an already-archived document", async () => {
      const doc = new ArchiveDocumentFactory(farmId).createArchived();
      repo.findById = vi.fn().mockResolvedValue(doc);

      const res = await service.markArchived(doc.id);

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(ArchiveError);
        expect(res.error.code).toBe(ARCHIVE_ERRORS.ALREADY_ARCHIVED);
      }
    });
  });

  describe("markDestroyed", () => {
    it("destroys a document", async () => {
      const doc = new ArchiveDocumentFactory(farmId).create();
      repo.findById = vi.fn().mockResolvedValue(doc);
      repo.markDestroyed = vi.fn().mockResolvedValue({ ...doc, destroyedAt: new Date() });

      const res = await service.markDestroyed(doc.id);

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.destroyedAt).not.toBeNull();
    });
  });

  describe("not found", () => {
    it("returns NOT_FOUND for a missing document", async () => {
      repo.findById = vi.fn().mockResolvedValue(undefined);

      const res = await service.markArchived("missing-id");

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(ArchiveError);
        expect(res.error.code).toBe(ARCHIVE_ERRORS.NOT_FOUND);
      }
    });
  });
});
