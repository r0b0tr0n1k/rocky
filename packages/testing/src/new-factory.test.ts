// Tests for new domain factories
// Verifies ArchiveDocumentFactory, CattlePassportFactory, InspectionFactory

import { describe, expect, it } from "vitest";
import { ArchiveDocumentFactory } from "./factory/factories/archive-document.js";
import { CattlePassportFactory } from "./factory/factories/cattle-passport.js";
import { InspectionFactory } from "./factory/factories/inspection.js";

describe("ArchiveDocumentFactory", () => {
  it("should create an archive document", () => {
    const farmId = crypto.randomUUID();

    const factory = new ArchiveDocumentFactory(farmId);
    const record = factory.create();

    expect(record.farmId).toBe(farmId);
    expect(record.documentType).toBeDefined();
    expect(record.archiveLocation).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create a CPC archive document", () => {
    const factory = new ArchiveDocumentFactory();
    const record = factory.createCPC();

    expect(record.archiveLocation).toBe("cpc");
  });

  it("should create a VS archive document", () => {
    const factory = new ArchiveDocumentFactory();
    const record = factory.createVS();

    expect(record.archiveLocation).toBe("vs");
  });

  it("should create an archived document", () => {
    const factory = new ArchiveDocumentFactory();
    const record = factory.createArchived();

    expect(record.isArchived).toBe(true);
    expect(record.archivedAt).toBeDefined();
  });
});

describe("CattlePassportFactory", () => {
  it("should create a cattle passport", () => {
    const animalId = crypto.randomUUID();
    const farmId = crypto.randomUUID();

    const factory = new CattlePassportFactory(animalId, farmId);
    const record = factory.create();

    expect(record.animalId).toBe(animalId);
    expect(record.farmId).toBe(farmId);
    expect(record.passportNumber).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create an issued passport", () => {
    const factory = new CattlePassportFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createIssued();

    expect(record.status).toBe("issued");
  });

  it("should create a seized passport", () => {
    const factory = new CattlePassportFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createSeized();

    expect(record.status).toBe("seized");
    expect(record.seizeDate).toBeDefined();
    expect(record.deathDate).toBeDefined();
  });

  it("should create a reprinted passport", () => {
    const factory = new CattlePassportFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createReprinted();

    expect(record.status).toBe("reprinted");
    expect(record.isReprint).toBe(true);
    expect(record.originalPassportId).toBeDefined();
  });
});

describe("InspectionFactory", () => {
  it("should create an inspection", () => {
    const farmId = crypto.randomUUID();
    const inspectorId = crypto.randomUUID();

    const factory = new InspectionFactory(farmId, inspectorId);
    const record = factory.create();

    expect(record.farmId).toBe(farmId);
    expect(record.inspectorId).toBe(inspectorId);
    expect(record.status).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create a scheduled inspection", () => {
    const factory = new InspectionFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createScheduled();

    expect(record.status).toBe("scheduled");
  });

  it("should create an in-progress inspection", () => {
    const factory = new InspectionFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createInProgress();

    expect(record.status).toBe("in_progress");
    expect(record.inspectionDate).toBeDefined();
  });

  it("should create a completed inspection", () => {
    const factory = new InspectionFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createCompleted();

    expect(record.status).toBe("completed");
    expect(record.inspectionDate).toBeDefined();
    expect(record.result).toBeDefined();
  });

  it("should create an inspection with risk analysis", () => {
    const factory = new InspectionFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createWithRiskAnalysis();

    expect(record.selectedByRiskAnalysis).toBe(true);
    expect(record.riskScore).toBeDefined();
  });
});
