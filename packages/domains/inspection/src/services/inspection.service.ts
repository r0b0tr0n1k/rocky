/**
 * Inspection Service
 *
 * @description Business logic for inspections — risk analysis, on-spot control lifecycle, integration with notifiable disease alerts.
 */

import { ok, err, } from "neverthrow";
import type { InspectionRepository } from "../repositories/inspection.repository.js";
import { InspectionError, INSPECTION_ERRORS } from "../errors/inspection.errors.js";
import { INSPECTION_STATUS } from "@rocky/database/constants";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { ArchiveService } from "@rocky/domains-archive";
import type { RiskAnalysisService, RunAnalysisInput } from "./risk-analysis.service.js";

export type { InspectionError, InspectionErrorCode } from "../errors/inspection.errors.js";

// ── Input types ──

export interface CreateInspectionInput {
  farmId: string;
  inspectorId: string;
  scheduledDate?: Date | string | null;
  riskScore?: string | null;
  riskCriteria?: string | null;
  selectedByRiskAnalysis?: boolean;
  createdBy?: string;
}

export interface CompleteInspectionInput {
  id: string;
  inspectionDate: Date | string;
  result?: string | null;
  notes?: string | null;
  discrepanciesFound?: boolean;
  keeperSigned?: boolean;
  signedAt?: Date | null;
  formReturned?: boolean;
}

export interface FlagFarmForInspectionInput {
  farmId: string;
  riskScore?: string | null;
  riskCriteria?: string | null;
  notes?: string | null;
  triggeredBy?: string;
}

export interface GenerateFormInput {
  inspectionId: string;
  language?: string;
}

export class InspectionService {
  constructor(
    private readonly repo: InspectionRepository,
    private readonly animalRepo?: AnimalRepository,
    private readonly archiveService?: ArchiveService,
    private readonly riskAnalysisService?: RiskAnalysisService,
  ) {}

  // ── CRUD ──

  async getById(id: string) {
    const inspection = await this.repo.findById(id);
    if (!inspection) return err(new InspectionError(INSPECTION_ERRORS.NOT_FOUND, { inspectionId: id }));
    return ok(inspection);
  }

  async list(input: { status?: string; farmId?: string; inspectorId?: string; limit: number; offset: number }) {
    return ok(await this.repo.list(input));
  }

  async create(input: CreateInspectionInput) {
    // Check farm not already inspected in this period
    const hasActive = await this.repo.hasActiveInspection(input.farmId);
    if (hasActive) return err(new InspectionError(INSPECTION_ERRORS.FARM_ALREADY_INSPECTED, { farmId: input.farmId }));

    const inspection = await this.repo.create({
      farmId: input.farmId,
      inspectorId: input.inspectorId,
      status: INSPECTION_STATUS.SCHEDULED,
      scheduledDate: input.scheduledDate
        ? (input.scheduledDate instanceof Date ? input.scheduledDate : new Date(input.scheduledDate)).toISOString().split("T")[0]
        : null,
      riskScore: input.riskScore ?? null,
      riskCriteria: input.riskCriteria ?? null,
      selectedByRiskAnalysis: input.selectedByRiskAnalysis ?? false,
      createdBy: input.createdBy,
      discrepanciesFound: false,
      formPrinted: false,
      formReturned: false,
      keeperSigned: false,
      storedAtVi: false,
    } as any);
    if (!inspection) return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT));
    return ok(inspection);
  }

  // ── Status Transitions ──

  async schedule(id: string, scheduledDate: Date | string) {
    const inspection = await this.repo.findById(id);
    if (!inspection) return err(new InspectionError(INSPECTION_ERRORS.NOT_FOUND, { inspectionId: id }));
    if (inspection.status !== INSPECTION_STATUS.SCHEDULED) {
      return err(new InspectionError(INSPECTION_ERRORS.INVALID_STATUS_TRANSITION, {
        from: inspection.status,
        to: INSPECTION_STATUS.SCHEDULED,
      }));
    }
    const updated = await this.repo.update(id, {
      scheduledDate: (scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate)).toISOString().split("T")[0]!,
      status: INSPECTION_STATUS.SCHEDULED,
    } as any);
    if (!updated) return err(new InspectionError(INSPECTION_ERRORS.NOT_FOUND, { inspectionId: id }));
    return ok(updated);
  }

  async complete(input: CompleteInspectionInput) {
    const inspection = await this.repo.findById(input.id);
    if (!inspection) return err(new InspectionError(INSPECTION_ERRORS.NOT_FOUND, { inspectionId: input.id }));

    const updated = await this.repo.update(input.id, {
      status: INSPECTION_STATUS.COMPLETED,
      inspectionDate: (input.inspectionDate instanceof Date ? input.inspectionDate : new Date(input.inspectionDate)).toISOString().split("T")[0]!,
      result: input.result ?? null,
      notes: input.notes ?? null,
      discrepanciesFound: input.discrepanciesFound ?? false,
      keeperSigned: input.keeperSigned ?? false,
      signedAt: input.signedAt ? (input.signedAt instanceof Date ? input.signedAt : new Date(input.signedAt)) : null,
      formReturned: input.formReturned ?? false,
    } as any);
    if (!updated) return err(new InspectionError(INSPECTION_ERRORS.NOT_FOUND, { inspectionId: input.id }));

    // Fire-and-forget: archive the inspection form (3-year retention)
    if (this.archiveService) {
      await this.archiveService.archiveInspectionForm({
        inspectionId: input.id,
        farmId: inspection.farmId,
        createdBy: inspection.createdBy ?? undefined,
      });
    }

    return ok(updated);
  }

  // ── Notifiable Disease Integration ──

  /**
   * Flag a farm for inspection due to a notifiable disease alert.
   * Called by HealthService when a notifiable disease is recorded.
   */
  async flagFarmForInspection(input: FlagFarmForInspectionInput) {
    const hasActive = await this.repo.hasActiveInspection(input.farmId);
    // If farm already has an active inspection, update it with the alert info
    if (hasActive) {
      const existingInspections = await this.repo.findByFarm(input.farmId, { status: INSPECTION_STATUS.SCHEDULED, limit: 1 });
      const existing = existingInspections[0];
      if (existing) {
        const updated = await this.repo.update(existing.id, {
          riskScore: input.riskScore ?? existing.riskScore,
          riskCriteria: input.riskCriteria
            ? [existing.riskCriteria, input.riskCriteria].filter(Boolean).join("; ")
            : existing.riskCriteria,
          notes: input.notes ? [existing.notes, input.notes].filter(Boolean).join("\n") : existing.notes,
        } as any);
        return ok(updated);
      }
    }

    // No active inspection — create a new one
    const inspection = await this.repo.flagFarmForInspection({
      farmId: input.farmId,
      riskScore: input.riskScore ?? undefined,
      riskCriteria: input.riskCriteria ?? undefined,
      notes: input.notes ?? undefined,
      createdBy: input.triggeredBy,
    });
    if (!inspection) return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT));
    return ok(inspection);
  }

  // ── Form Generation ──

  /**
   * Generate inspection form data — queries farm's animals, populates checkedAnimals,
   * sets formPrinted=true. Returns the form data structure matching models/inspection-form.yaml.
   */
  async generateInspectionForm(input: GenerateFormInput) {
    const inspection = await this.repo.findById(input.inspectionId);
    if (!inspection) return err(new InspectionError(INSPECTION_ERRORS.NOT_FOUND, { inspectionId: input.inspectionId }));

    if (!this.animalRepo) return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "AnimalRepository not available" }));

    // Query all currently registered animals on the farm
    const { data: animals } = await this.animalRepo.listFiltered({
      farmId: inspection.farmId,
      limit: 1000,
      offset: 0,
    });

    // Map animals to CheckedAnimal format (from models/inspection-form.yaml Section F)
    const checkedAnimals = animals.map((animal) => ({
      animalId: animal.id,
      earTagNumber: animal.earTagNumber,
      stateCode: animal.stateCode,
      sex: animal.sex,
      breed: animal.breed,
      birthDate: animal.birthDate,
      motherId: animal.motherId,
      currentStatus: animal.status,
      tagPresent: null,
      tagCorrect: null,
      animalPresent: null,
      discrepancyNote: null,
    }));

    // Update inspection with checkedAnimals and mark form as printed
    const updated = await this.repo.update(input.inspectionId, {
      checkedAnimals: checkedAnimals as any,
      formPrinted: true,
    } as any);
    if (!updated) return err(new InspectionError(INSPECTION_ERRORS.NOT_FOUND, { inspectionId: input.inspectionId }));

    return ok({
      formId: inspection.id,
      formVersion: "1.0",
      generatedAt: new Date(),
      language: input.language ?? "MK",
      farm: {
        farmId: inspection.farmId,
        farmIdNumber: "",
        farmName: null,
        owner: { subjectId: null, shortName: null, personalId: null },
        keeper: { subjectId: null, shortName: null },
        address: { street: null, city: null, zipCode: null, commune: null, state: null },
      },
      inspector: {
        inspectorId: inspection.inspectorId,
        shortName: "",
        vsName: null,
      },
      riskAnalysis: {
        selectedByRiskAnalysis: inspection.selectedByRiskAnalysis,
        riskScore: inspection.riskScore,
        riskCriteria: inspection.riskCriteria,
        analysisPeriod: null,
      },
      scheduledDate: inspection.scheduledDate,
      inspectionDate: inspection.inspectionDate,
      animals: checkedAnimals,
      result: {
        overallResult: inspection.result,
        discrepanciesFound: inspection.discrepanciesFound,
        notes: inspection.notes,
      },
      signature: {
        keeperSigned: inspection.keeperSigned,
        signedAt: inspection.signedAt,
      },
      lifecycle: {
        formPrinted: true,
        formReturned: inspection.formReturned,
        storedAtVi: inspection.storedAtVi,
        retentionExpiry: inspection.retentionExpiry,
      },
    });
  }

  // ── Risk Analysis delegation ──

  async listRiskAnalyses(input: { year?: number; status?: string; limit: number; offset: number }) {
    if (!this.riskAnalysisService) {
      return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "RiskAnalysisService not configured" }));
    }
    return ok(await this.riskAnalysisService.list(input));
  }

  async runRiskAnalysis(input: RunAnalysisInput) {
    if (!this.riskAnalysisService) {
      return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "RiskAnalysisService not configured" }));
    }
    return this.riskAnalysisService.runAnalysis(input);
  }
}
