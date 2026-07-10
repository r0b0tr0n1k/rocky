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
  inspectionListResponseSchema,
  inspectionResponseSchema,
  riskAnalysisListResponseSchema,
  riskAnalysisRunResponseSchema,
  type PrintInspectionFormRequest,
  printInspectionFormRequestSchema,
  type ScheduleInspectionRequest,
  scheduleInspectionRequestSchema,
} from "@rocky/validators/api/index.js";
import { INSPECTION_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(INSPECTION_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const printFormSchema = z.any();
@Router({ alias: "inspection" })
@RegisterPolicy("inspection")
@Policy({ authenticated: true })
@Injectable()
export class InspectionRouter {
  constructor(@Inject(InspectionService) private readonly inspectionService: InspectionService) {}

  // -- CRUD --

  @Query({ input: idParam, output: inspectionResponseSchema })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.inspectionService.getById(input.id));
  }

  @Query({ input: inspectionListRequestSchema, output: inspectionListResponseSchema })
  async list(@Input() input: z.infer<typeof inspectionListRequestSchema>) {
    return unwrap(await this.inspectionService.list(input));
  }

  @Mutation({ input: createInspectionRequestSchema, output: inspectionResponseSchema })
  async create(@Input() input: CreateInspectionRequest, @Ctx() _ctx: AppContext) {
    return unwrap(await this.inspectionService.create({ ...input }));
  }

  // -- Lifecycle --

  @Mutation({ input: scheduleInspectionRequestSchema, output: inspectionResponseSchema })
  async schedule(@Input() input: ScheduleInspectionRequest) {
    return unwrap(await this.inspectionService.schedule(input.id, input.scheduledDate));
  }

  @Mutation({ input: completeInspectionRequestSchema, output: inspectionResponseSchema })
  async complete(@Input() input: CompleteInspectionRequest) {
    return unwrap(await this.inspectionService.complete(input));
  }

  // -- Form Generation --

  @Mutation({ input: printInspectionFormRequestSchema, output: printFormSchema })
  async printForm(@Input() input: PrintInspectionFormRequest) {
    return unwrap(
      await this.inspectionService.generateInspectionForm({
        inspectionId: input.id,
        language: input.language,
      }),
    );
  }

  // -- Risk Analysis (permission-gated) --

  @Query({
    input: z.object({
      year: z.int().optional(),
      status: z.string().optional(),
      limit: z.int().min(1).max(100).default(20),
      offset: z.int().min(0).default(0),
    }),
    output: riskAnalysisListResponseSchema,
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
    output: riskAnalysisRunResponseSchema,
  })
  @Policy({ action: "analysis:run" })
  async runRiskAnalysis(
    @Input() input: { year: number; quarter?: string; selectionPercentage?: number },
    @Ctx() ctx: AppContext,
  ) {
    return unwrap(await this.inspectionService.runRiskAnalysis({ ...input, createdBy: ctx.execution?.principal.id }));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof inspectionResponseSchema>,
  Awaited<ReturnType<InspectionRouter["getById"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof inspectionListResponseSchema>,
  Awaited<ReturnType<InspectionRouter["list"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof inspectionResponseSchema>,
  Awaited<ReturnType<InspectionRouter["create"]>>
>;
type _verify_scheduleOutput = SubtypeGuillotine<
  z.output<typeof inspectionResponseSchema>,
  Awaited<ReturnType<InspectionRouter["schedule"]>>
>;
type _verify_completeOutput = SubtypeGuillotine<
  z.output<typeof inspectionResponseSchema>,
  Awaited<ReturnType<InspectionRouter["complete"]>>
>;
type _verify_printFormOutput = SubtypeGuillotine<
  Awaited<ReturnType<InspectionRouter["printForm"]>>,
  z.output<typeof printFormSchema>
>;
type _verify_listRiskAnalysesOutput = SubtypeGuillotine<
  z.output<typeof riskAnalysisListResponseSchema>,
  Awaited<ReturnType<InspectionRouter["listRiskAnalyses"]>>
>;
type _verify_runRiskAnalysisOutput = SubtypeGuillotine<
  z.output<typeof riskAnalysisRunResponseSchema>,
  Awaited<ReturnType<InspectionRouter["runRiskAnalysis"]>>
>;

export type _InspectionGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_listOutput,
  _verify_createOutput,
  _verify_scheduleOutput,
  _verify_completeOutput,
  _verify_printFormOutput,
  _verify_listRiskAnalysesOutput,
  _verify_runRiskAnalysisOutput
]>;
