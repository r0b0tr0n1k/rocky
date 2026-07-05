// --- Inspection Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { InspectionService } from "@rocky/domains-inspection";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CompleteInspectionRequest,
  type CreateInspectionRequest,
  completeInspectionRequestSchema,
  createInspectionRequestSchema,
  inspectionListRequestSchema,
  type PrintInspectionFormRequest,
  printInspectionFormRequestSchema,
  type ScheduleInspectionRequest,
  scheduleInspectionRequestSchema,
} from "@rocky/validators/api/index.js";
import { INSPECTION_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(INSPECTION_TRPC_ERROR_MAP);

@Router({ alias: "inspection" })
@RegisterPolicy("inspection")
@Policy({ authenticated: true })
@Injectable()
export class InspectionRouter {
  constructor(@Inject(InspectionService) private readonly inspectionService: InspectionService) {}

  // ── CRUD ──

  @Query({ input: idParam })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.inspectionService.getById(input.id));
  }

  @Query({ input: inspectionListRequestSchema })
  async list(@Input() input: z.infer<typeof inspectionListRequestSchema>) {
    return unwrap(await this.inspectionService.list(input));
  }

  @Mutation({ input: createInspectionRequestSchema })
  async create(@Input() input: CreateInspectionRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.inspectionService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  // ── Lifecycle ──

  @Mutation({ input: scheduleInspectionRequestSchema })
  async schedule(@Input() input: ScheduleInspectionRequest) {
    return unwrap(await this.inspectionService.schedule(input.id, input.scheduledDate));
  }

  @Mutation({ input: completeInspectionRequestSchema })
  async complete(@Input() input: CompleteInspectionRequest) {
    return unwrap(await this.inspectionService.complete(input));
  }

  // ── Form Generation ──

  @Mutation({ input: printInspectionFormRequestSchema })
  async printForm(@Input() input: PrintInspectionFormRequest) {
    return unwrap(
      await this.inspectionService.generateInspectionForm({
        inspectionId: input.id,
        language: input.language,
      }),
    );
  }

  // ── Risk Analysis (permission-gated) ──

  @Query({
    input: z.object({
      year: z.int().optional(),
      status: z.string().optional(),
      limit: z.int().min(1).max(100).default(20),
      offset: z.int().min(0).default(0),
    }),
  })
  @Policy({ action: "analysis:read" })
  async listRiskAnalyses(@Input() input: { year?: number; status?: string; limit: number; offset: number }) {
    return unwrap(await this.inspectionService.listRiskAnalyses(input));
  }

  @Mutation({
    input: z.object({
      year: z.int(),
      quarter: z.string().optional(),
      selectionPercentage: z.int().min(1).max(100).optional(),
    }),
  })
  @Policy({ action: "analysis:run" })
  async runRiskAnalysis(
    @Input() input: { year: number; quarter?: string; selectionPercentage?: number },
    @Ctx() ctx: AppContext,
  ) {
    return unwrap(await this.inspectionService.runRiskAnalysis({ ...input, createdBy: ctx.execution?.principal.id }));
  }
}
