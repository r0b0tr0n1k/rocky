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
  treatmentListRequestSchema,
  type UnlinkVaccineDiseaseRequest,
  unlinkVaccineDiseaseRequestSchema,
  vaccinationListRequestSchema,
  vaccineListRequestSchema,
  diseaseResponseSchema,
  diseaseListResponseSchema,
  vaccineResponseSchema,
  vaccineListResponseSchema,
  vaccineBatchResponseSchema,
  vaccineBatchListResponseSchema,
  vaccinationResponseSchema,
  vaccinationListResponseSchema,
  treatmentResponseSchema,
  treatmentListResponseSchema,
  labTestResponseSchema,
  labTestListResponseSchema,
  vaccineDiseaseResponseSchema,
  vaccineDiseaseListResponseSchema,
  vaccineDiseaseUnlinkResponseSchema,
} from "@rocky/validators/api/index.js";
import { HEALTH_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(HEALTH_TRPC_ERROR_MAP);

@Router({ alias: "health" })
@RegisterPolicy("health")
@Policy({ authenticated: true })
@Injectable()
export class HealthRouter {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) { }

  // -- Disease --

  @Query({ input: idParam, output: diseaseResponseSchema })
  async getDisease(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getDisease(input.id));
  }

  @Query({ input: diseaseListRequestSchema, output: diseaseListResponseSchema })
  async listDiseases(@Input() input: z.infer<typeof diseaseListRequestSchema>) {
    return unwrap(await this.healthService.listDiseases(input));
  }

  @Mutation({ input: createDiseaseRequestSchema, output: diseaseResponseSchema })
  async createDisease(@Input() input: CreateDiseaseRequest) {
    return unwrap(await this.healthService.createDisease(input));
  }

  // -- Vaccine --

  @Query({ input: idParam, output: vaccineResponseSchema })
  async getVaccine(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getVaccine(input.id));
  }

  @Query({ input: vaccineListRequestSchema, output: vaccineListResponseSchema })
  async listVaccines(@Input() input: z.infer<typeof vaccineListRequestSchema>) {
    return unwrap(await this.healthService.listVaccines(input));
  }

  @Mutation({ input: createVaccineRequestSchema, output: vaccineResponseSchema })
  async createVaccine(@Input() input: CreateVaccineRequest) {
    return unwrap(await this.healthService.createVaccine(input));
  }

  // -- Vaccine Batch --

  @Mutation({ input: createVaccineBatchRequestSchema, output: vaccineBatchResponseSchema })
  async createVaccineBatch(@Input() input: CreateVaccineBatchRequest) {
    return unwrap(await this.healthService.createVaccineBatch(input));
  }

  // -- Vaccination (vet-authorized) --

  @Query({ input: idParam, output: vaccinationResponseSchema })
  async getVaccination(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getVaccination(input.id));
  }

  @Query({ input: vaccinationListRequestSchema, output: vaccinationListResponseSchema })
  async listVaccinations(@Input() input: z.infer<typeof vaccinationListRequestSchema>) {
    return unwrap(await this.healthService.listVaccinations(input));
  }

  @Mutation({ input: recordVaccinationRequestSchema, output: vaccinationResponseSchema })
  async recordVaccination(@Input() input: RecordVaccinationRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.recordVaccination({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  // -- Treatment (vet-authorized) --

  @Query({ input: idParam, output: treatmentResponseSchema })
  async getTreatment(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getTreatment(input.id));
  }

  @Query({ input: treatmentListRequestSchema, output: treatmentListResponseSchema })
  async listTreatments(@Input() input: z.infer<typeof treatmentListRequestSchema>) {
    return unwrap(await this.healthService.listTreatments(input));
  }

  @Mutation({ input: recordTreatmentRequestSchema, output: treatmentResponseSchema })
  async recordTreatment(@Input() input: RecordTreatmentRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.recordTreatment({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  // -- Vaccine Batch Listing --

  @Query({
    input: z.strictObject({
      vaccineId: z.uuid().optional(),
      limit: z.int().min(1).max(100).default(20),
      offset: z.int().min(0).default(0),
    }),
    output: vaccineBatchListResponseSchema,
  })
  async listBatches(@Input() input: { vaccineId?: string; limit: number; offset: number }) {
    return unwrap(await this.healthService.listBatches(input));
  }

  // -- Lab Test --

  @Query({ input: idParam, output: labTestResponseSchema })
  async getLabTest(@Input() input: { id: string }) {
    return unwrap(await this.healthService.getLabTest(input.id));
  }

  @Query({ input: labTestListRequestSchema, output: labTestListResponseSchema })
  async listLabTests(@Input() input: z.infer<typeof labTestListRequestSchema>) {
    return unwrap(await this.healthService.listLabTests(input));
  }

  @Mutation({ input: recordLabTestRequestSchema, output: labTestResponseSchema })
  async recordLabTest(@Input() input: RecordLabTestRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.recordLabTest({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  // -- Vaccine-Disease Links --

  @Query({ input: z.strictObject({ vaccineId: z.uuid() }), output: vaccineDiseaseListResponseSchema })
  async getVaccineDiseases(@Input() input: { vaccineId: string }) {
    return unwrap(await this.healthService.getVaccineDiseases(input.vaccineId));
  }

  @Mutation({ input: linkVaccineDiseaseRequestSchema, output: vaccineDiseaseResponseSchema })
  async linkVaccineDisease(@Input() input: LinkVaccineDiseaseRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.healthService.linkVaccineDisease({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  @Mutation({ input: unlinkVaccineDiseaseRequestSchema, output: vaccineDiseaseUnlinkResponseSchema })
  async unlinkVaccineDisease(@Input() input: UnlinkVaccineDiseaseRequest) {
    return unwrap(await this.healthService.unlinkVaccineDisease(input.vaccineId, input.diseaseId));
  }

}

// ── Bridge 2b: thin router return (service success type) vs declared `output:` ──
type _verify_getDiseaseOutput = SubtypeGuillotine<z.output<typeof diseaseResponseSchema>, Awaited<ReturnType<HealthRouter["getDisease"]>>>;
type _verify_listDiseasesOutput = SubtypeGuillotine<z.output<typeof diseaseListResponseSchema>, Awaited<ReturnType<HealthRouter["listDiseases"]>>>;
type _verify_createDiseaseOutput = SubtypeGuillotine<z.output<typeof diseaseResponseSchema>, Awaited<ReturnType<HealthRouter["createDisease"]>>>;
type _verify_getVaccineOutput = SubtypeGuillotine<z.output<typeof vaccineResponseSchema>, Awaited<ReturnType<HealthRouter["getVaccine"]>>>;
type _verify_listVaccinesOutput = SubtypeGuillotine<z.output<typeof vaccineListResponseSchema>, Awaited<ReturnType<HealthRouter["listVaccines"]>>>;
type _verify_createVaccineOutput = SubtypeGuillotine<z.output<typeof vaccineResponseSchema>, Awaited<ReturnType<HealthRouter["createVaccine"]>>>;
type _verify_createVaccineBatchOutput = SubtypeGuillotine<z.output<typeof vaccineBatchResponseSchema>, Awaited<ReturnType<HealthRouter["createVaccineBatch"]>>>;
type _verify_getVaccinationOutput = SubtypeGuillotine<z.output<typeof vaccinationResponseSchema>, Awaited<ReturnType<HealthRouter["getVaccination"]>>>;
type _verify_listVaccinationsOutput = SubtypeGuillotine<z.output<typeof vaccinationListResponseSchema>, Awaited<ReturnType<HealthRouter["listVaccinations"]>>>;
type _verify_recordVaccinationOutput = SubtypeGuillotine<z.output<typeof vaccinationResponseSchema>, Awaited<ReturnType<HealthRouter["recordVaccination"]>>>;
type _verify_getTreatmentOutput = SubtypeGuillotine<z.output<typeof treatmentResponseSchema>, Awaited<ReturnType<HealthRouter["getTreatment"]>>>;
type _verify_listTreatmentsOutput = SubtypeGuillotine<z.output<typeof treatmentListResponseSchema>, Awaited<ReturnType<HealthRouter["listTreatments"]>>>;
type _verify_recordTreatmentOutput = SubtypeGuillotine<z.output<typeof treatmentResponseSchema>, Awaited<ReturnType<HealthRouter["recordTreatment"]>>>;
type _verify_listBatchesOutput = SubtypeGuillotine<z.output<typeof vaccineBatchListResponseSchema>, Awaited<ReturnType<HealthRouter["listBatches"]>>>;
type _verify_getLabTestOutput = SubtypeGuillotine<z.output<typeof labTestResponseSchema>, Awaited<ReturnType<HealthRouter["getLabTest"]>>>;
type _verify_listLabTestsOutput = SubtypeGuillotine<z.output<typeof labTestListResponseSchema>, Awaited<ReturnType<HealthRouter["listLabTests"]>>>;
type _verify_recordLabTestOutput = SubtypeGuillotine<z.output<typeof labTestResponseSchema>, Awaited<ReturnType<HealthRouter["recordLabTest"]>>>;
type _verify_getVaccineDiseasesOutput = SubtypeGuillotine<z.output<typeof vaccineDiseaseListResponseSchema>, Awaited<ReturnType<HealthRouter["getVaccineDiseases"]>>>;
type _verify_linkVaccineDiseaseOutput = SubtypeGuillotine<z.output<typeof vaccineDiseaseResponseSchema>, Awaited<ReturnType<HealthRouter["linkVaccineDisease"]>>>;
type _verify_unlinkVaccineDiseaseOutput = SubtypeGuillotine<z.output<typeof vaccineDiseaseUnlinkResponseSchema>, Awaited<ReturnType<HealthRouter["unlinkVaccineDisease"]>>>;

export type _HealthGuillotines = ActivateGuillotines<[
  _verify_getDiseaseOutput, _verify_listDiseasesOutput, _verify_createDiseaseOutput, _verify_getVaccineOutput,
  _verify_listVaccinesOutput, _verify_createVaccineOutput, _verify_createVaccineBatchOutput,
  _verify_getVaccinationOutput, _verify_listVaccinationsOutput, _verify_recordVaccinationOutput,
  _verify_getTreatmentOutput, _verify_listTreatmentsOutput, _verify_recordTreatmentOutput,
  _verify_listBatchesOutput, _verify_getLabTestOutput, _verify_listLabTestsOutput,
  _verify_recordLabTestOutput, _verify_getVaccineDiseasesOutput, _verify_linkVaccineDiseaseOutput,
  _verify_unlinkVaccineDiseaseOutput
]>;
