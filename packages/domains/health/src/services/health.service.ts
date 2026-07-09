/**
 * Health Service
 *
 * @description Business logic for health domain — vaccination, treatment, disease management, lab tests, vaccine-disease links.
 * Validates vet authorization on farm before recording health events.
 */

import { ok, err, fromAsyncThrowable, toAppError, type Result } from "@rocky/domains-shared";
import type { SubjectRepository } from "@rocky/domains-subject";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { HealthRepository } from "../repositories/health.repository.js";
import { HealthError, HEALTH_ERRORS } from "../errors/health.errors.js";
import { ANIMAL_STATUS, SUBJECT_ROLE } from "@rocky/database/constants";
import {
  diseaseResponseSchema,
  vaccineResponseSchema,
  vaccineBatchResponseSchema,
  vaccinationResponseSchema,
  treatmentResponseSchema,
  labTestResponseSchema,
  vaccineDiseaseResponseSchema,
} from "@rocky/validators/api";

export type { HealthError, HealthErrorCode } from "../errors/health.errors.js";

const MIN_VACCINATION_AGE_DAYS = 30;

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

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
    private readonly animalRepo: AnimalRepository,
    private readonly outboxPublisher?: import("@rocky/execution").OutboxEventPublisher,
    private readonly correctionService?: import("@rocky/domains-correction").CorrectionService,
  ) {}

  // ── Disease CRUD ──

  async getDisease(id: string) {
    const disease = await this.repo.findDiseaseById(id);
    if (!disease) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { diseaseId: id }));
    return ok(diseaseResponseSchema.parse(disease));
  }

  async listDiseases(input: { search?: string; notifiable?: boolean; limit: number; offset: number }) {
    const { data, total } = await this.repo.listDiseases(input);
    return ok({ data: data.map((d: unknown) => diseaseResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset });
  }

  async createDisease(input: CreateDiseaseInput) {
    const disease = await this.repo.createDisease({ name: input.name, notifiable: input.notifiable ?? false, description: input.description });
    if (!disease) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(diseaseResponseSchema.parse(disease));
  }

  // ── Vaccine CRUD ──

  async getVaccine(id: string) {
    const vaccine = await this.repo.findVaccineById(id);
    if (!vaccine) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { vaccineId: id }));
    return ok(vaccineResponseSchema.parse(vaccine));
  }

  async listVaccines(input: { search?: string; type?: string; limit: number; offset: number }) {
    const { data, total } = await this.repo.listVaccines(input);
    return ok({ data: data.map((d: unknown) => vaccineResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset });
  }

  async createVaccine(input: CreateVaccineInput) {
    const vaccine = await this.repo.createVaccine({ name: input.name, manufacturer: input.manufacturer, type: input.type });
    if (!vaccine) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(vaccineResponseSchema.parse(vaccine));
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
    return ok(vaccineBatchResponseSchema.parse(batch));
  }

  async listBatches(input: { vaccineId?: string; limit: number; offset: number }) {
    const { data, total } = await this.repo.listBatches(input);
    return ok({ data: data.map((d: unknown) => vaccineBatchResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset });
  }

  // ── Vaccination (with vet authorization) ──

  async recordVaccination(input: RecordVaccinationInput) {
    // 1. Vet authorization — is this vet assigned to this farm?
    const binding = await this.subjectRepo.findSubjectBinding(input.farmId, input.vetId, SUBJECT_ROLE.VETERINARIAN);
    if (!binding) return err(new HealthError(HEALTH_ERRORS.FORBIDDEN, { vetId: input.vetId, farmId: input.farmId }));

    // 2. Animal validation — alive + age check (Rules 7, 2)
    const animal = await this.animalRepo.findById(input.animalId);
    if (!animal) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { animalId: input.animalId }));
    if (animal.status !== ANIMAL_STATUS.ALIVE) return err(new HealthError(HEALTH_ERRORS.ANIMAL_NOT_ALIVE, { animalId: input.animalId }));
    const adminDate = typeof input.adminDate === "string" ? new Date(input.adminDate) : input.adminDate;
    const animalBirthDate = new Date(animal.birthDate);
    const ageDays = daysBetween(animalBirthDate, adminDate);
    if (ageDays < MIN_VACCINATION_AGE_DAYS) return err(new HealthError(HEALTH_ERRORS.ANIMAL_TOO_YOUNG, { animalId: input.animalId, ageDays, minDays: MIN_VACCINATION_AGE_DAYS }));

    // 3. Batch validity — expiry + stock
    const batchRow = await this.repo.findBatchById(input.batchId);
    if (!batchRow) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { batchId: input.batchId }));
    if (new Date(batchRow.expiryDate) < adminDate) return err(new HealthError(HEALTH_ERRORS.VACCINE_EXPIRED, { batchId: input.batchId }));
    if (batchRow.quantityRemaining <= 0) return err(new HealthError(HEALTH_ERRORS.BATCH_DEPLETED, { batchId: input.batchId }));

    // 4. Create vaccination record
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

    // 5. Decrement batch quantity
    await this.repo.decrementBatchQuantity(input.batchId);

    return ok(vaccinationResponseSchema.parse(vaccination));
  }

  async getVaccination(id: string) {
    const vaccination = await this.repo.findVaccinationById(id);
    if (!vaccination) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { vaccinationId: id }));
    return ok(vaccinationResponseSchema.parse(vaccination));
  }

  async listVaccinations(input: { animalId?: string; farmId?: string; vaccineId?: string; vetId?: string; limit: number; offset: number }) {
    const { data, total } = await this.repo.listVaccinations(input);
    return ok({ data: data.map((d: unknown) => vaccinationResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset });
  }

  // ── Treatment (with vet authorization) ──

  async recordTreatment(input: RecordTreatmentInput) {
    // 1. Vet authorization
    const binding = await this.subjectRepo.findSubjectBinding(input.farmId, input.vetId, SUBJECT_ROLE.VETERINARIAN);
    if (!binding) return err(new HealthError(HEALTH_ERRORS.FORBIDDEN, { vetId: input.vetId, farmId: input.farmId }));

    // 2. Animal alive check (Rule 7)
    const animal = await this.animalRepo.findById(input.animalId);
    if (!animal) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { animalId: input.animalId }));
    if (animal.status !== ANIMAL_STATUS.ALIVE) return err(new HealthError(HEALTH_ERRORS.ANIMAL_NOT_ALIVE, { animalId: input.animalId }));

    // 3. Check if disease is notifiable (for alert triggering)
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

    // 4. If notifiable disease, emit event to outbox for async inspection flagging
    if (isNotifiable && this.outboxPublisher) {
      await this.outboxPublisher.publish({
        type: "notifiable_disease.detected",
        aggregateType: "treatment",
        aggregateId: treatment.id,
        payload: {
          diseaseId: input.diseaseId,
          diseaseName,
          farmId: input.farmId,
          animalId: input.animalId,
          vetId: input.vetId,
          createdBy: input.createdBy,
        },
        createdBy: input.createdBy,
      });
      // Note: Event is emitted in the same transaction as the treatment.
      // If the transaction rolls back, the event is never emitted.
      // The OutboxProcessorJob will dispatch asynchronously.
    }

    return ok(treatmentResponseSchema.parse(treatment));
  }

  async getTreatment(id: string) {
    const treatment = await this.repo.findTreatmentById(id);
    if (!treatment) return err(new HealthError(HEALTH_ERRORS.NOT_FOUND, { treatmentId: id }));
    return ok(treatmentResponseSchema.parse(treatment));
  }

  async listTreatments(input: { animalId?: string; farmId?: string; diseaseId?: string; vetId?: string; limit: number; offset: number }) {
    const { data, total } = await this.repo.listTreatments(input);
    return ok({ data: data.map((d: unknown) => treatmentResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset });
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
    return ok(labTestResponseSchema.parse(labTest));
  }

  async getLabTest(id: string) {
    const labTest = await this.repo.findLabTestById(id);
    if (!labTest) return err(new HealthError(HEALTH_ERRORS.LAB_TEST_NOT_FOUND, { labTestId: id }));
    return ok(labTestResponseSchema.parse(labTest));
  }

  async listLabTests(input: { animalId?: string; farmId?: string; diseaseId?: string; testType?: string; result?: string; limit: number; offset: number }) {
    const { data, total } = await this.repo.listLabTests(input);
    return ok({ data: data.map((d: unknown) => labTestResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset });
  }

  // ── Vaccine-Disease Links ──

  async linkVaccineDisease(input: LinkVaccineDiseaseInput) {
    // Check if link already exists
    const existing = await this.repo.findVaccineDiseaseLink(input.vaccineId, input.diseaseId);
    if (existing) return err(new HealthError(HEALTH_ERRORS.VACCINE_DISEASE_CONFLICT, { vaccineId: input.vaccineId, diseaseId: input.diseaseId }));

    const link = await this.repo.linkVaccineToDisease({ vaccineId: input.vaccineId, diseaseId: input.diseaseId, createdBy: input.createdBy });
    if (!link) return err(new HealthError(HEALTH_ERRORS.INVALID_INPUT));
    return ok(vaccineDiseaseResponseSchema.parse(link));
  }

  async unlinkVaccineDisease(vaccineId: string, diseaseId: string) {
    const link = await this.repo.findVaccineDiseaseLink(vaccineId, diseaseId);
    if (!link) return err(new HealthError(HEALTH_ERRORS.VACCINE_DISEASE_NOT_FOUND, { vaccineId, diseaseId }));

    await this.repo.unlinkVaccineFromDisease(vaccineId, diseaseId);
    return ok({ deleted: true });
  }

  async getVaccineDiseases(vaccineId: string) {
    const links = await this.repo.findVaccineDiseases(vaccineId);
    return ok(links.map((l: unknown) => vaccineDiseaseResponseSchema.parse(l)));
  }

  // ── PDA Sync (Phase 5) ────────────────────────────────────────

  /**
   * Download all master data for PDA offline use.
   */
  async syncDownload(): Promise<Result<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diseases: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vaccines: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batches: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vaccineDiseases: any[];
    syncedAt: Date;
  }, Error>> {
    return fromAsyncThrowable(async () => {
      const [diseases, vaccines, batches, vaccineDiseases] = await Promise.all([
        this.repo.listAllDiseases(),
        this.repo.listAllVaccines(),
        this.repo.listAllBatches(),
        this.repo.listAllVaccineDiseases(),
      ]);
      return {
        diseases,
        vaccines,
        batches,
        vaccineDiseases,
        syncedAt: new Date(),
      };
    }, toAppError)();
  }

  /**
   * Upload batched records created offline on the PDA.
   * Processes each record sequentially, returning per-record results.
   */
  async syncUpload(input: {
    records: Array<{
      idempotencyKey: string;
      type: "vaccination" | "treatment" | "labTest";
      data: Record<string, unknown>;
    }>;
    createdBy: string;
  }): Promise<Result<{
    results: Array<{ idempotencyKey: string; success: boolean; recordId: string | null; error: string | null }>;
    processed: number;
    failed: number;
  }, Error>> {
    const results: Array<{
      idempotencyKey: string;
      success: boolean;
      recordId: string | null;
      error: string | null;
    }> = [];

    for (const record of input.records) {
      try {
        let result: Result<{ id: string }, Error>;
        switch (record.type) {
          case "vaccination":
            result = await this.recordVaccination(record.data as never);
            break;
          case "treatment":
            result = await this.recordTreatment(record.data as never);
            break;
          case "labTest":
            result = await this.recordLabTest(record.data as never);
            break;
          default:
            const unknownError = `Unknown type: ${record.type}`;
            results.push({ idempotencyKey: record.idempotencyKey, success: false, recordId: null, error: unknownError });
            await this.createSyncErrorCorrection(record, unknownError, input.createdBy);
            continue;
        }

        if (result.isOk()) {
          results.push({ idempotencyKey: record.idempotencyKey, success: true, recordId: result.value.id, error: null });
        } else {
          const errorMsg = result.error.message;
          results.push({ idempotencyKey: record.idempotencyKey, success: false, recordId: null, error: errorMsg });
          await this.createSyncErrorCorrection(record, errorMsg, input.createdBy);
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        results.push({ idempotencyKey: record.idempotencyKey, success: false, recordId: null, error: errorMsg });
        await this.createSyncErrorCorrection(record, errorMsg, input.createdBy);
      }
    }

    return ok({
      results,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });
  }

  /** Create error correction for failed sync record */
  private async createSyncErrorCorrection(
    record: { idempotencyKey: string; type: string; data: Record<string, unknown> },
    errorMessage: string,
    createdBy: string,
  ): Promise<void> {
    if (!this.correctionService) return;

    try {
      await this.correctionService.create({
        detectionSource: "field",
        errorType: `sync_upload_${record.type}_failed`,
        errorDescription: `PDA sync failed: ${errorMessage}`,
        originalData: {
          idempotencyKey: record.idempotencyKey,
          type: record.type,
          data: record.data,
        },
        caseType: "TECHNICIAN_RESOLVABLE",
        createdBy,
      });
    } catch (e) {
      // Log but don't fail the sync — correction creation is secondary
      console.error(`Failed to create sync error correction for ${record.idempotencyKey}:`, e);
    }
  }
}
