// --- Correction Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { CorrectionService } from "@rocky/domains-correction";
import type { AppContext } from "@rocky/trpc/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  correctionListRequestSchema,
  correctionListResponseSchema,
  correctionResponseSchema,
  type CreateCorrectionRequest,
  createCorrectionRequestSchema,
  type EscalateCorrectionRequest,
  escalateCorrectionRequestSchema,
  type ResolveCorrectionRequest,
  resolveCorrectionRequestSchema,
  type ReviewCorrectionRequest,
  reviewCorrectionRequestSchema,
} from "@rocky/validators/api/index.js";
import { CORRECTION_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(CORRECTION_TRPC_ERROR_MAP);

@Router({ alias: "correction" })
@RegisterPolicy("correction")
@Policy({ authenticated: true })
@Injectable()
export class CorrectionRouter {
  constructor(@Inject(CorrectionService) private readonly correctionService: CorrectionService) { }

  @Query({ input: idParam, output: correctionResponseSchema })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.correctionService.getById(input.id));
  }

  @Query({ input: correctionListRequestSchema, output: correctionListResponseSchema })
  async list(@Input() input: z.infer<typeof correctionListRequestSchema>) {
    return unwrap(await this.correctionService.list(input));
  }

  @Mutation({ input: createCorrectionRequestSchema, output: correctionResponseSchema })
  async create(@Input() input: CreateCorrectionRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.correctionService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: reviewCorrectionRequestSchema, output: correctionResponseSchema })
  async review(@Input() input: ReviewCorrectionRequest) {
    return unwrap(await this.correctionService.review(input.id));
  }

  @Mutation({ input: resolveCorrectionRequestSchema, output: correctionResponseSchema })
  async resolve(@Input() input: ResolveCorrectionRequest, @Ctx() ctx: AppContext) {
    return unwrap(
      await this.correctionService.resolve(input.id, {
        resolvedBy: ctx.execution!.principal.id,
        resolutionNotes: input.resolutionNotes,
      }),
    );
  }

  @Mutation({ input: escalateCorrectionRequestSchema, output: correctionResponseSchema })
  async escalate(@Input() input: EscalateCorrectionRequest) {
    return unwrap(
      await this.correctionService.escalate(input.id, {
        escalatedTo: input.escalatedTo,
        reason: input.reason,
      }),
    );
  }

  @Mutation({ input: idParam, output: correctionResponseSchema })
  async reject(@Input() input: { id: string }) {
    return unwrap(await this.correctionService.reject(input.id));
  }
}
