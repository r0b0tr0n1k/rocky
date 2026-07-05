// --- Health Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { HealthService } from "@rocky/domains-health";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateDiseaseRequest,
  createDiseaseRequestSchema,
  type CreateVaccineBatchRequest,
  createVaccineBatchRequestSchema,
  type CreateVaccineRequest,
  createVaccineRequestSchema,
  diseaseListRequestSchema,
  labTestListRequestSchema,
  type LinkVaccineDiseaseRequest,
  linkVaccineDiseaseRequestSchema,
  type RecordLabTestRequest,
  recordLabTestRequestSchema,
  type RecordTreatmentRequest,
  recordTreatmentRequestSchema,
  type RecordVaccinationRequest,
  recordVaccinationRequestSchema,
  type SyncDownloadResponse,
  syncDownloadResponseSchema,
  type SyncUploadRequest,
  syncUploadRequestSchema,
  type SyncUploadResponse,
  syncUploadResponseSchema,
  treatmentListRequestSchema,
  type UnlinkVaccineDiseaseRequest,
  unlinkVaccineDiseaseRequestSchema,
  vaccinationListRequestSchema,
  vaccineListRequestSchema,
} from "@rocky/validators/api/index.js";
import { HEALTH_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(HEALTH_TRPC_ERROR_MAP);

@Router({ alias: "health" })
@RegisterPolicy("health")
@Policy({ authenticated: true })
@Injectable()
export class HealthRouter {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) { }

  // ── Disease ──

  @Query({ input: idParam })
  async getDisease(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getDisease(input.id));
  }

  @Query({ input: diseaseListRequestSchema })
  async listDiseases(@Input() input: z.infer<typeof diseaseListRequestSchema>) {
    return unwrap(await this.healthService.listDiseases(input));
  }

  @Mutation({ input: createDiseaseRequestSchema })
  async createDisease(@Input() input: CreateDiseaseRequest) {
    return unwrap(await this.healthService.createDisease(input));
  }

  // ── Vaccine ──

  @Query({ input: idParam })
  async getVaccine(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getVaccine(input.id));
  }

  @Query({ input: vaccineListRequestSchema })
  async listVaccines(@Input() input: z.infer<typeof vaccineListRequestSchema>) {
    return unwrap(await this.healthService.listVaccines(input));
  }

  @Mutation({ input: createVaccineRequestSchema })
  async createVaccine(@Input() input: CreateVaccineRequest) {
    return unwrap(await this.healthService.createVaccine(input));
  }

  // ── Vaccine Batch ──

  @Mutation({ input: createVaccineBatchRequestSchema })
  async createVaccineBatch(@Input() input: CreateVaccineBatchRequest) {
    return unwrap(await this.healthService.createVaccineBatch(input));
  }

  // ── Vaccination (vet-authorized) ──

  @Query({ input: idParam })
  async getVaccination(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getVaccination(input.id));
  }

  @Query({ input: vaccinationListRequestSchema })
  async listVaccinations(@Input() input: z.infer<typeof vaccinationListRequestSchema>) {
    return unwrap(await this.healthService.listVaccinations(input));
  }

  @Mutation({ input: recordVaccinationRequestSchema })
  async recordVaccination(@Input() input: RecordVaccinationRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.recordVaccination({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  // ── Treatment (vet-authorized) ──

  @Query({ input: idParam })
  async getTreatment(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getTreatment(input.id));
  }

  @Query({ input: treatmentListRequestSchema })
  async listTreatments(@Input() input: z.infer<typeof treatmentListRequestSchema>) {
    return unwrap(await this.healthService.listTreatments(input));
  }

  @Mutation({ input: recordTreatmentRequestSchema })
  async recordTreatment(@Input() input: RecordTreatmentRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.recordTreatment({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  // ── Vaccine Batch Listing ──

  @Query({
    input: z.strictObject({
      vaccineId: z.uuid().optional(),
      limit: z.int().min(1).max(100).default(20),
      offset: z.int().min(0).default(0),
    }),
  })
  async listBatches(@Input() input: { vaccineId?: string; limit: number; offset: number }) {
    return unwrap(await this.healthService.listBatches(input));
  }

  // ── Lab Test ──

  @Query({ input: idParam })
  async getLabTest(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getLabTest(input.id));
  }

  @Query({ input: labTestListRequestSchema })
  async listLabTests(@Input() input: z.infer<typeof labTestListRequestSchema>) {
    return unwrap(await this.healthService.listLabTests(input));
  }

  @Mutation({ input: recordLabTestRequestSchema })
  async recordLabTest(@Input() input: RecordLabTestRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.recordLabTest({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  // ── Vaccine-Disease Links ──

  @Query({ input: z.strictObject({ vaccineId: z.uuid() }) })
  async getVaccineDiseases(@Input() input: { vaccineId: string }) {
    return unwrap(await this.healthService.getVaccineDiseases(input.vaccineId));
  }

  @Mutation({ input: linkVaccineDiseaseRequestSchema })
  async linkVaccineDisease(@Input() input: LinkVaccineDiseaseRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.linkVaccineDisease({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  @Mutation({ input: unlinkVaccineDiseaseRequestSchema })
  async unlinkVaccineDisease(@Input() input: UnlinkVaccineDiseaseRequest) {
    return unwrap(await this.healthService.unlinkVaccineDisease(input.vaccineId, input.diseaseId));
  }

  // ── PDA Sync (Phase 5) ──────────────────────────────────────────

  @Query({ input: z.strictObject({}), output: syncDownloadResponseSchema })
  async syncDownload(): Promise<SyncDownloadResponse> {
    return unwrap(await this.healthService.syncDownload());
  }

  @Mutation({ input: syncUploadRequestSchema, output: syncUploadResponseSchema })
  async syncUpload(@Input() input: SyncUploadRequest, @Ctx() ctx: AppContext): Promise<SyncUploadResponse> {
    return unwrap(
      await this.healthService.syncUpload({
        records: input.records,
        createdBy: ctx.execution!.principal.id,
      }),
    );
  }
}
