// Tests for health domain factories
// Verifies VaccinationFactory, LabTestFactory, TreatmentFactory

import { describe, expect, it } from "vitest";
import { VaccinationFactory } from "./factory/factories/vaccination.js";
import { LabTestFactory } from "./factory/factories/lab-test.js";
import { TreatmentFactory } from "./factory/factories/treatment.js";

describe("VaccinationFactory", () => {
  it("should create a vaccination record", () => {
    const animalId = crypto.randomUUID();
    const farmId = crypto.randomUUID();
    const vaccineId = crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const vetId = crypto.randomUUID();

    const factory = new VaccinationFactory(animalId, farmId, vaccineId, batchId, vetId);
    const record = factory.create();

    expect(record.animalId).toBe(animalId);
    expect(record.farmId).toBe(farmId);
    expect(record.vaccineId).toBe(vaccineId);
    expect(record.batchId).toBe(batchId);
    expect(record.vetId).toBe(vetId);
    expect(record.id).toBeDefined();
  });

  it("should create an intramuscular vaccination", () => {
    const factory = new VaccinationFactory(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    );
    const record = factory.createIntramuscular();

    expect(record.route).toBe("intramuscular");
  });

  it("should create a subcutaneous vaccination", () => {
    const factory = new VaccinationFactory(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    );
    const record = factory.createSubcutaneous();

    expect(record.route).toBe("subcutaneous");
  });
});

describe("LabTestFactory", () => {
  it("should create a lab test record", () => {
    const animalId = crypto.randomUUID();
    const farmId = crypto.randomUUID();
    const diseaseId = crypto.randomUUID();

    const factory = new LabTestFactory(animalId, farmId, diseaseId);
    const record = factory.create();

    expect(record.animalId).toBe(animalId);
    expect(record.farmId).toBe(farmId);
    expect(record.diseaseId).toBe(diseaseId);
    expect(record.id).toBeDefined();
  });

  it("should create a positive test result", () => {
    const factory = new LabTestFactory(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    );
    const record = factory.createPositive();

    expect(record.result).toBe("positive");
  });

  it("should create a negative test result", () => {
    const factory = new LabTestFactory(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    );
    const record = factory.createNegative();

    expect(record.result).toBe("negative");
  });

  it("should create a serology test", () => {
    const factory = new LabTestFactory(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    );
    const record = factory.createSerology();

    expect(record.testType).toBe("serology");
  });
});

describe("TreatmentFactory", () => {
  it("should create a treatment record with diseaseId", () => {
    const animalId = crypto.randomUUID();
    const farmId = crypto.randomUUID();
    const vetId = crypto.randomUUID();
    const diseaseId = crypto.randomUUID();

    const factory = new TreatmentFactory(animalId, farmId, vetId, diseaseId);
    const record = factory.create();

    expect(record.animalId).toBe(animalId);
    expect(record.farmId).toBe(farmId);
    expect(record.vetId).toBe(vetId);
    expect(record.diseaseId).toBe(diseaseId);
    expect(record.id).toBeDefined();
  });

  it("should inherit diseaseId in createDiagnosis", () => {
    const diseaseId = crypto.randomUUID();
    const factory = new TreatmentFactory(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      diseaseId,
    );

    const diagnosis = factory.createDiagnosis();

    // Should inherit diseaseId from constructor
    expect(diagnosis.diseaseId).toBe(diseaseId);
  });

  it("should create an AMR treatment", () => {
    const factory = new TreatmentFactory(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    );
    const amr = factory.createAMR();

    expect(amr.amrFlag).toBe(true);
    expect(amr.antibioticName).toBeDefined();
    expect(amr.withdrawalPeriod).toBeDefined();
  });
});
