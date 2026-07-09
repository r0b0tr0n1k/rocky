// Tests for Tier 2 factories — child/FK tables inside already-covered domains:
// Health (disease/vaccine/vaccine-batch/vaccine-disease),
// EarTag (type/allocation/replacement/takeover/ear-tag),
// Animal (birth-notification/animal-parent),
// Passport (form-reprint), Inspection (risk-analysis),
// Movement (pasture-declaration/import-export-record), User (user-session)
//
// Verifies that every factory produces schema-valid data (create() throws on
// safeParse failure) and that the domain state helpers set correct enum values.

import { describe, expect, it } from "vitest";
import { DiseaseFactory } from "./factory/factories/disease.js";
import { VaccineFactory } from "./factory/factories/vaccine.js";
import { VaccineBatchFactory } from "./factory/factories/vaccine-batch.js";
import { VaccineDiseaseFactory } from "./factory/factories/vaccine-disease.js";
import { EarTagTypeFactory } from "./factory/factories/ear-tag-type.js";
import { EarTagAllocationFactory } from "./factory/factories/ear-tag-allocation.js";
import { EarTagReplacementFactory } from "./factory/factories/ear-tag-replacement.js";
import { EarTagTakeoverFactory } from "./factory/factories/ear-tag-takeover.js";
import { EarTagFactory } from "./factory/factories/ear-tag.js";
import { BirthNotificationFactory } from "./factory/factories/birth-notification.js";
import { AnimalParentFactory } from "./factory/factories/animal-parent.js";
import { FormReprintFactory } from "./factory/factories/form-reprint.js";
import { RiskAnalysisFactory } from "./factory/factories/risk-analysis.js";
import { PastureDeclarationFactory } from "./factory/factories/pasture-declaration.js";
import { ImportExportRecordFactory } from "./factory/factories/import-export-record.js";
import { UserSessionFactory } from "./factory/factories/user-session.js";

describe("Health factories", () => {
  it("DiseaseFactory creates a disease", () => {
    const record = new DiseaseFactory().create();
    expect(record.id).toBeDefined();
    expect(record.name).toBeDefined();
    expect(record.notifiable).toBe(false);
  });

  it("DiseaseFactory notifiable/inactive helpers", () => {
    expect(new DiseaseFactory().createNotifiable().notifiable).toBe(true);
    expect(new DiseaseFactory().createInactive().isActive).toBe(false);
  });

  it("VaccineFactory creates a vaccine with type", () => {
    const record = new VaccineFactory().create();
    expect(record.id).toBeDefined();
    expect(record.name).toBeDefined();
    expect(record.type).toBeDefined();
  });

  it("VaccineFactory type helpers", () => {
    expect(new VaccineFactory().createLive().type).toBe("live");
    expect(new VaccineFactory().createInactivated().type).toBe("inactivated");
  });

  it("VaccineBatchFactory links to a vaccine", () => {
    const vaccineId = crypto.randomUUID();
    const record = new VaccineBatchFactory(vaccineId).create();
    expect(record.vaccineId).toBe(vaccineId);
    expect(record.batchNo).toBeDefined();
    expect(record.quantityRemaining).toBeLessThanOrEqual(record.quantityReceived);
  });

  it("VaccineBatchFactory expired/low-stock helpers", () => {
    expect(new VaccineBatchFactory(crypto.randomUUID()).createExpired().expiryDate).toBeDefined();
    expect(new VaccineBatchFactory(crypto.randomUUID()).createLowStock().quantityRemaining).toBeLessThanOrEqual(5);
  });

  it("VaccineDiseaseFactory links vaccine and disease", () => {
    const vaccineId = crypto.randomUUID();
    const diseaseId = crypto.randomUUID();
    const record = new VaccineDiseaseFactory(vaccineId, diseaseId).create();
    expect(record.vaccineId).toBe(vaccineId);
    expect(record.diseaseId).toBe(diseaseId);
  });
});

describe("EarTag factories", () => {
  it("EarTagTypeFactory creates a type", () => {
    const record = new EarTagTypeFactory().create();
    expect(record.code).toBeDefined();
    expect(record.category).toBeDefined();
    expect(record.isActive).toBe(true);
  });

  it("EarTagTypeFactory category helper", () => {
    expect(new EarTagTypeFactory().createForCategory("ELECTRONIC").category).toBe("ELECTRONIC");
  });

  it("EarTagAllocationFactory links farm and type", () => {
    const farmId = crypto.randomUUID();
    const typeId = crypto.randomUUID();
    const record = new EarTagAllocationFactory(farmId, typeId).create();
    expect(record.farmId).toBe(farmId);
    expect(record.typeId).toBe(typeId);
    expect(record.allocationNumber).toBeDefined();
  });

  it("EarTagAllocationFactory status helpers", () => {
    const f = new EarTagAllocationFactory(crypto.randomUUID(), crypto.randomUUID());
    expect(f.createPending().status).toBe("PENDING");
    expect(f.createFulfilled().status).toBe("FULFILLED");
    expect(f.createCancelled().status).toBe("CANCELLED");
  });

  it("EarTagReplacementFactory links animal and farm", () => {
    const animalId = crypto.randomUUID();
    const farmId = crypto.randomUUID();
    const record = new EarTagReplacementFactory(animalId, farmId).create();
    expect(record.animalId).toBe(animalId);
    expect(record.farmId).toBe(farmId);
    expect(record.oldTagNumber).toHaveLength(8);
    expect(record.newTagNumber).toHaveLength(8);
  });

  it("EarTagReplacementFactory status helpers", () => {
    const f = new EarTagReplacementFactory(crypto.randomUUID(), crypto.randomUUID());
    expect(f.createPending().status).toBe("pending");
    expect(f.createApproved().status).toBe("approved");
    expect(f.createRejected().status).toBe("rejected");
  });

  it("EarTagTakeoverFactory links order and supplier", () => {
    const orderId = crypto.randomUUID();
    const supplierId = crypto.randomUUID();
    const record = new EarTagTakeoverFactory(orderId, supplierId).create();
    expect(record.orderId).toBe(orderId);
    expect(record.supplierOrganizationId).toBe(supplierId);
    expect(record.totalTagsCollected).toBeGreaterThan(0);
  });

  it("EarTagTakeoverFactory status helpers", () => {
    const f = new EarTagTakeoverFactory(crypto.randomUUID(), crypto.randomUUID());
    expect(f.createCompleted().status).toBe("COMPLETED");
    expect(f.createCancelled().status).toBe("CANCELLED");
  });

  it("EarTagFactory links to a type", () => {
    const typeId = crypto.randomUUID();
    const record = new EarTagFactory(typeId).create();
    expect(record.typeId).toBe(typeId);
    expect(record.tagNumber).toHaveLength(8);
    expect(record.status).toBe("available");
    expect(record.stateCode).toBe("MK");
  });

  it("EarTagFactory state helpers", () => {
    const f = new EarTagFactory(crypto.randomUUID());
    expect(f.createApplied().status).toBe("applied");
    expect(f.createApplied().animalId).toBeDefined();
    expect(f.createDefective().isDefective).toBe(true);
    expect(f.createQualityChecked().qualityChecked).toBe(true);
  });
});

describe("Animal / Passport / Inspection / Movement / User factories", () => {
  it("BirthNotificationFactory creates for a farm", () => {
    const farmId = crypto.randomUUID();
    const record = new BirthNotificationFactory(farmId).create();
    expect(record.farmId).toBe(farmId);
    expect(record.notificationDate).toBeDefined();
    expect(record.taggingDeadline).toBeDefined();
    expect(record.numberOfCalves).toBe(1);
  });

  it("BirthNotificationFactory status helpers", () => {
    const f = new BirthNotificationFactory(crypto.randomUUID());
    expect(f.createPending().status).toBe("PENDING");
    expect(f.createSent().status).toBe("SENT");
    expect(f.createFailed().status).toBe("FAILED");
    expect(f.createTagged().taggedAt).toBeDefined();
  });

  it("AnimalParentFactory links animal and parent", () => {
    const animalId = crypto.randomUUID();
    const parentId = crypto.randomUUID();
    expect(new AnimalParentFactory(animalId, parentId).createMother().parentType).toBe("MOTHER");
    expect(new AnimalParentFactory(animalId, parentId).createFather().parentType).toBe("FATHER");
  });

  it("FormReprintFactory creates for a farm", () => {
    const farmId = crypto.randomUUID();
    const record = new FormReprintFactory(farmId).create();
    expect(record.farmId).toBe(farmId);
    expect(record.documentType).toBeDefined();
    expect(record.status).toBe("requested");
  });

  it("FormReprintFactory lifecycle helpers", () => {
    const f = new FormReprintFactory(crypto.randomUUID());
    expect(f.createShipped().status).toBe("shipped");
    expect(f.createShipped().shippedToVs).toBe(true);
    expect(f.createDelivered().status).toBe("delivered");
    expect(f.createDelivered().deliveredToKeeper).toBe(true);
  });

  it("RiskAnalysisFactory creates with year", () => {
    const record = new RiskAnalysisFactory().create();
    expect(record.year).toBeGreaterThan(2000);
    expect(record.selectionPercentage).toBe(10);
    expect(record.status).toBe("pending");
  });

  it("RiskAnalysisFactory completed helper", () => {
    const record = new RiskAnalysisFactory().createCompleted(100, 10);
    expect(record.status).toBe("completed");
    expect(record.totalFarms).toBe(100);
    expect(record.selectedFarms).toBe(10);
  });

  it("PastureDeclarationFactory links farms with animals", () => {
    const from = crypto.randomUUID();
    const to = crypto.randomUUID();
    const record = new PastureDeclarationFactory(from, to).create();
    expect(record.fromFarmId).toBe(from);
    expect(record.toFarmId).toBe(to);
    expect(record.animalIds).toHaveLength(1);
    expect(record.departureDate).toBeDefined();
  });

  it("PastureDeclarationFactory type/invalidated helpers", () => {
    const f = new PastureDeclarationFactory(crypto.randomUUID(), crypto.randomUUID());
    expect(f.createMountain().pastureType).toBe("MOUNTAIN");
    expect(f.createVillage().pastureType).toBe("VILLAGE");
    expect(f.createInvalidated().conflictResolutionStatus).toBe("invalidated_data_error");
  });

  it("ImportExportRecordFactory links an animal", () => {
    const animalId = crypto.randomUUID();
    const record = new ImportExportRecordFactory(animalId).create();
    expect(record.animalId).toBe(animalId);
    expect(record.countryOfOrigin).toBeDefined();
    expect(record.direction).toBeDefined();
  });

  it("ImportExportRecordFactory direction/status helpers", () => {
    const f = new ImportExportRecordFactory(crypto.randomUUID());
    expect(f.createImport().direction).toBe("import");
    expect(f.createExport().direction).toBe("export");
    expect(f.createQuarantine().status).toBe("quarantine");
    expect(f.createCompleted().status).toBe("completed");
  });

  it("UserSessionFactory links a user", () => {
    const userId = crypto.randomUUID();
    const record = new UserSessionFactory(userId).create();
    expect(record.userId).toBe(userId);
    expect(record.accessToken).toBeDefined();
    expect(record.expiresAt).toBeDefined();
  });

  it("UserSessionFactory active/expired helpers", () => {
    expect(new UserSessionFactory(crypto.randomUUID()).createActive().isActive).toBe(true);
    expect(new UserSessionFactory(crypto.randomUUID()).createExpired().isActive).toBe(false);
  });
});

describe("Tier 2 factories — createMany", () => {
  it("produces multiple schema-valid records", () => {
    const diseases = new DiseaseFactory().createMany(4);
    expect(diseases).toHaveLength(4);
    const tags = new EarTagFactory(crypto.randomUUID()).createMany(3);
    expect(tags).toHaveLength(3);
    for (const t of tags) expect(t.tagNumber).toHaveLength(8);
  });
});
