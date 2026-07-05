// --- Inspection Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { InspectionService } from "@rocky/domains-inspection";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  completeInspectionRequestSchema,
  createInspectionRequestSchema,
  inspectionListRequestSchema,
  printInspectionFormRequestSchema,
  scheduleInspectionRequestSchema,
  type CompleteInspectionRequest,
  type CreateInspectionRequest,
  type PrintInspectionFormRequest,
  type ScheduleInspectionRequest,
} from "@rocky/validators/api";
import { INSPECTION_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { createPermissionGuard } from "../trpc/middlewares/permission.guard.js";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(INSPECTION_TRPC_ERROR_MAP);

@Router({ alias: "inspection" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class InspectionRouter {
  constructor(
    @Inject(InspectionService) private readonly inspectionService: InspectionService,
  ) { }

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
  async create(
    @Input() input: CreateInspectionRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.inspectionService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  // ── Lifecycle ──

  @Mutation({ input: scheduleInspectionRequestSchema })
  async schedule(
    @Input() input: ScheduleInspectionRequest,
  ) {
    return unwrap(
      await this.inspectionService.schedule(input.id, input.scheduledDate),
    );
  }

  @Mutation({ input: completeInspectionRequestSchema })
  async complete(
    @Input() input: CompleteInspectionRequest,
  ) {
    return unwrap(await this.inspectionService.complete(input));
  }

  // ── Form Generation ──

  @Mutation({ input: printInspectionFormRequestSchema })
  async printForm(
    @Input() input: PrintInspectionFormRequest,
  ) {
    return unwrap(
      await this.inspectionService.generateInspectionForm({
        inspectionId: input.id,
        language: input.language,
      }),
    );
  }

  // ── Risk Analysis (permission-gated) ──

  @Query({ input: z.object({ year: z.int().optional(), status: z.string().optional(), limit: z.int().min(1).max(100).default(20), offset: z.int().min(0).default(0) }) })
  @UseMiddlewares(createPermissionGuard("analysis:read"))
  async listRiskAnalyses(@Input() input: { year?: number; status?: string; limit: number; offset: number }) {
    return unwrap(await this.inspectionService.listRiskAnalyses(input));
  }

  @Mutation({ input: z.object({ year: z.int(), quarter: z.string().optional(), selectionPercentage: z.int().min(1).max(100).optional() }) })
  @UseMiddlewares(createPermissionGuard("analysis:run"))
  async runRiskAnalysis(
    @Input() input: { year: number; quarter?: string; selectionPercentage?: number },
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.inspectionService.runRiskAnalysis({ ...input, createdBy: ctx.auth.userId }),
    );
  }
}
