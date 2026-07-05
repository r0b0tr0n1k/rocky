// --- Health Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { HealthService } from "@rocky/domains-health";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  createDiseaseRequestSchema,
  createVaccineBatchRequestSchema,
  createVaccineRequestSchema,
  diseaseListRequestSchema,
  recordTreatmentRequestSchema,
  recordVaccinationRequestSchema,
  treatmentListRequestSchema,
  vaccinationListRequestSchema,
  vaccineListRequestSchema,
  type CreateDiseaseRequest,
  type CreateVaccineBatchRequest,
  type CreateVaccineRequest,
  type RecordTreatmentRequest,
  type RecordVaccinationRequest,
} from "@rocky/validators/api";
import { HEALTH_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(HEALTH_TRPC_ERROR_MAP);

@Router({ alias: "health" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class HealthRouter {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService,
  ) { }

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
  async recordVaccination(
    @Input() input: RecordVaccinationRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.healthService.recordVaccination({ ...input, createdBy: ctx.auth.userId }),
    );
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
  async recordTreatment(
    @Input() input: RecordTreatmentRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.healthService.recordTreatment({ ...input, createdBy: ctx.auth.userId }),
    );
  }
}
