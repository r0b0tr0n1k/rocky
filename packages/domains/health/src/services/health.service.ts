/**
 * Health Service
 *
 * @description Business logic for health domain — vaccination, treatment, disease management, lab tests, vaccine-disease links.
 * Validates vet authorization on farm before recording health events.
 */

import { ok, err, type Result } from "neverthrow";
import type { SubjectRepository } from "@rocky/domains-subject";
import { HealthRepository } from "../repositories/health.repository.js";
import { HealthError, HEALTH_ERRORS } from "../errors/health.errors.js";
import { SUBJECT_ROLE } from "@rocky/database/constants";

export type { HealthError, HealthErrorCode } from "../errors/health.errors.js";

// ── Input types (mirrors validator schemas) ──

export interface CreateDiseaseInput {
  name: string;
  notifiable?: boolean;
  description?: string | null;
}

export interface CreateVaccineInput {
  name: string;
  manufacturer?: string | null;
  type: string;
}

export interface CreateVaccineBatchInput {
  vaccineId: string;
  batchNo: string;
  productionDate?: Date | string | null;
  expiryDate: Date | string;
  quantityReceived: number;
}

export interface RecordVaccinationInput {
  animalId: string;
  farmId: string;
  vaccineId: string;
  batchId: string;
  vetId: string;
  adminDate: Date | string;
  route: string;
  notes?: string | null;
  createdBy?: string;
}

export interface RecordTreatmentInput {
  animalId: string;
  farmId: string;
  diseaseId?: string | null;
  vetId: string;
  diagnosisDate: Date | string;
  treatmentDesc?: string | null;
  isolated?: boolean;
  createdBy?: string;
}

export interface RecordLabTestInput {
  animalId: string;
  farmId: string;
  diseaseId: string;
  testType: string;
  testMethod?: string | null;
  result: string;
  resultNumeric?: number | null;
  resultUnit?: string | null;
  interpretation?: string | null;
  labName?: string | null;
  labSampleId?: string | null;
  sampleDate: Date | string;
  resultDate: Date | string;
  certificateRef?: string | null;
  createdBy?: string;
}

export interface LinkVaccineDiseaseInput {
  vaccineId: string;
  diseaseId: string;
  createdBy?: string;
}

export class HealthService {
  constructor(
    private readonly repo: HealthRepository,
    private readonly subjectRepo: SubjectRepository,
    private readonly inspectionRepo?: { flagFarmForInspection: (input: { farmId: string; riskScore?: string | null; riskCriteria?: string | null; notes?: string | null; triggeredBy?: string }) => Promise<any> },
  ) {}

  // ── Disease CRUD ──

  async getDisease(id: string) {
    const disease = await this.repo.findDiseaseById(id);
    if (!disease) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { diseaseId: id }));
    return ok(disease);
  }

  async listDiseases(input: { search?: string; notifiable?: boolean; limit: number; offset: number }) {
    return ok(await this.repo.listDiseases(input));
  }

  async createDisease(input: CreateDiseaseInput) {
    const disease = await this.repo.createDisease({ name: input.name, notifiable: input.notifiable ?? false, description: input.description });
    if (!disease) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(disease);
  }

  // ── Vaccine CRUD ──

  async getVaccine(id: string) {
    const vaccine = await this.repo.findVaccineById(id);
    if (!vaccine) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { vaccineId: id }));
    return ok(vaccine);
  }

  async listVaccines(input: { search?: string; type?: string; limit: number; offset: number }) {
    return ok(await this.repo.listVaccines(input));
  }

  async createVaccine(input: CreateVaccineInput) {
    const vaccine = await this.repo.createVaccine({ name: input.name, manufacturer: input.manufacturer, type: input.type });
    if (!vaccine) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(vaccine);
  }

  // ── Vaccine Batch CRUD ──

  async createVaccineBatch(input: CreateVaccineBatchInput) {
    const batch = await this.repo.createBatch({
      vaccineId: input.vaccineId,
      batchNo: input.batchNo,
      productionDate: input.productionDate instanceof Date ? input.productionDate.toISOString().split("T")[0] : input.productionDate ?? undefined,
      expiryDate: new Date(input.expiryDate).toISOString().split("T")[0]!,
      quantityReceived: input.quantityReceived,
      quantityRemaining: input.quantityReceived,
    });
    if (!batch) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(batch);
  }

  async listBatches(input: { vaccineId?: string; limit: number; offset: number }) {
    return ok(await this.repo.listBatches(input));
  }

  // ── Vaccination (with vet authorization) ──

  async recordVaccination(input: RecordVaccinationInput) {
    // 1. Vet authorization — is this vet assigned to this farm?
    const binding = await this.subjectRepo.findSubjectBinding(input.farmId, input.vetId, SUBJECT_ROLE.VETERINARIAN);
    if (!binding) return err(new HealthError(HEALTH_ERRORS.FORBIDDEN, { vetId: input.vetId, farmId: input.farmId }));

    // 2. Batch validity
    const batchRow = await this.repo.findBatchById(input.batchId);
    if (!batchRow) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { batchId: input.batchId }));
    const adminDate = input.adminDate instanceof Date ? input.adminDate : new Date(input.adminDate);
    if (new Date(batchRow.expiryDate) < adminDate) return err(new HealthError(HEALTH_ERRORS.VACCINE_EXPIRED, { batchId: input.batchId }));
    if (batchRow.quantityRemaining <= 0) return err(new HealthError(HEALTH_ERRORS.BATCH_DEPLETED, { batchId: input.batchId }));

    // 3. Create vaccination record
    const vaccination = await this.repo.createVaccination({
      animalId: input.animalId,
      farmId: input.farmId,
      vaccineId: input.vaccineId,
      batchId: input.batchId,
      vetId: input.vetId,
      adminDate: adminDate.toISOString().split("T")[0]!,
      route: input.route,
      notes: input.notes ?? undefined,
      createdBy: input.createdBy,
    });
    if (!vaccination) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));

    // 4. Decrement batch quantity
    await this.repo.decrementBatchQuantity(input.batchId);

    return ok(vaccination);
  }

  async getVaccination(id: string) {
    const vaccination = await this.repo.findVaccinationById(id);
    if (!vaccination) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { vaccinationId: id }));
    return ok(vaccination);
  }

  async listVaccinations(input: { animalId?: string; farmId?: string; vaccineId?: string; vetId?: string; limit: number; offset: number }) {
    return ok(await this.repo.listVaccinations(input));
  }

  // ── Treatment (with vet authorization) ──

  async recordTreatment(input: RecordTreatmentInput) {
    // 1. Vet authorization
    const binding = await this.subjectRepo.findSubjectBinding(input.farmId, input.vetId, SUBJECT_ROLE.VETERINARIAN);
    if (!binding) return err(new HealthError(HEALTH_ERRORS.FORBIDDEN, { vetId: input.vetId, farmId: input.farmId }));

    // 2. Check if disease is notifiable (for alert triggering)
    let isNotifiable = false;
    let diseaseName = "";
    if (input.diseaseId) {
      const disease = await this.repo.findDiseaseById(input.diseaseId);
      if (disease) {
        isNotifiable = disease.notifiable;
        diseaseName = disease.name;
      }
    }

    // 3. Create treatment record
    const treatment = await this.repo.createTreatment({
      animalId: input.animalId,
      farmId: input.farmId,
      diseaseId: input.diseaseId ?? undefined,
      vetId: input.vetId,
      diagnosisDate: (input.diagnosisDate instanceof Date ? input.diagnosisDate : new Date(input.diagnosisDate)).toISOString().split("T")[0]!,
      treatmentDesc: input.treatmentDesc ?? undefined,
      isolated: input.isolated ?? false,
      createdBy: input.createdBy,
    });
    if (!treatment) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));

    // 4. If notifiable disease, flag farm for inspection
    if (isNotifiable && this.inspectionRepo) {
      await this.inspectionRepo.flagFarmForInspection({
        farmId: input.farmId,
        riskScore: "HIGH",
        riskCriteria: `notifiable_disease:${input.diseaseId}`,
        notes: `Notifiable disease "${diseaseName}" diagnosed in animal ${input.animalId}. Inspection flagged automatically.`,
        triggeredBy: input.createdBy,
      });
      // Note: We intentionally don't fail the treatment if flagging fails.
      // The treatment record is the primary action; inspection flagging is secondary.
    }

    return ok(treatment);
  }

  async getTreatment(id: string) {
    const treatment = await this.repo.findTreatmentById(id);
    if (!treatment) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { treatmentId: id }));
    return ok(treatment);
  }

  async listTreatments(input: { animalId?: string; farmId?: string; diseaseId?: string; vetId?: string; limit: number; offset: number }) {
    return ok(await this.repo.listTreatments(input));
  }

  // ── Lab Test ──

  async recordLabTest(input: RecordLabTestInput) {
    const labTest = await this.repo.createLabTest({
      animalId: input.animalId,
      farmId: input.farmId,
      diseaseId: input.diseaseId,
      testType: input.testType,
      testMethod: input.testMethod ?? undefined,
      result: input.result,
      resultNumeric: input.resultNumeric?.toString() ?? undefined,
      resultUnit: input.resultUnit ?? undefined,
      interpretation: input.interpretation ?? undefined,
      labName: input.labName ?? undefined,
      labSampleId: input.labSampleId ?? undefined,
      sampleDate: (input.sampleDate instanceof Date ? input.sampleDate : new Date(input.sampleDate)).toISOString().split("T")[0]!,
      resultDate: (input.resultDate instanceof Date ? input.resultDate : new Date(input.resultDate)).toISOString().split("T")[0]!,
      certificateRef: input.certificateRef ?? undefined,
      createdBy: input.createdBy,
    });
    if (!labTest) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(labTest);
  }

  async getLabTest(id: string) {
    const labTest = await this.repo.findLabTestById(id);
    if (!labTest) return err(new HealthError(HEALTH_ERRORS.LAB_TEST_NOT_FOUND, { labTestId: id }));
    return ok(labTest);
  }

  async listLabTests(input: { animalId?: string; farmId?: string; diseaseId?: string; testType?: string; result?: string; limit: number; offset: number }) {
    return ok(await this.repo.listLabTests(input));
  }

  // ── Vaccine-Disease Links ──

  async linkVaccineDisease(input: LinkVaccineDiseaseInput) {
    // Check if link already exists
    const existing = await this.repo.findVaccineDiseaseLink(input.vaccineId, input.diseaseId);
    if (existing) return err(new HealthError(HEALTH_ERRORS.VACCINE_DISEASE_CONFLICT, { vaccineId: input.vaccineId, diseaseId: input.diseaseId }));

    const link = await this.repo.linkVaccineToDisease({ vaccineId: input.vaccineId, diseaseId: input.diseaseId, createdBy: input.createdBy });
    if (!link) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(link);
  }

  async unlinkVaccineDisease(vaccineId: string, diseaseId: string) {
    const link = await this.repo.findVaccineDiseaseLink(vaccineId, diseaseId);
    if (!link) return err(new HealthError(HEALTH_ERRORS.VACCINE_DISEASE_NOT_FOUND, { vaccineId, diseaseId }));

    await this.repo.unlinkVaccineFromDisease(vaccineId, diseaseId);
    return ok({ deleted: true });
  }

  async getVaccineDiseases(vaccineId: string) {
    const links = await this.repo.findVaccineDiseases(vaccineId);
    return ok(links);
  }
}
