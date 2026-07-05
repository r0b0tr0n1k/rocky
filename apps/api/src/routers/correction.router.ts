// --- Correction Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { CorrectionService } from "@rocky/domains-correction";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  correctionListRequestSchema,
  createCorrectionRequestSchema,
  escalateCorrectionRequestSchema,
  resolveCorrectionRequestSchema,
  reviewCorrectionRequestSchema,
  type CreateCorrectionRequest,
  type EscalateCorrectionRequest,
  type ResolveCorrectionRequest,
  type ReviewCorrectionRequest,
} from "@rocky/validators/api";
import { CORRECTION_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(CORRECTION_TRPC_ERROR_MAP);

@Router({ alias: "correction" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class CorrectionRouter {
  constructor(
    @Inject(CorrectionService) private readonly correctionService: CorrectionService,
  ) { }

  @Query({ input: idParam })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.correctionService.getById(input.id));
  }

  @Query({ input: correctionListRequestSchema })
  async list(@Input() input: z.infer<typeof correctionListRequestSchema>) {
    return unwrap(await this.correctionService.list(input));
  }

  @Mutation({ input: createCorrectionRequestSchema })
  async create(
    @Input() input: CreateCorrectionRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.correctionService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: reviewCorrectionRequestSchema })
  async review(@Input() input: ReviewCorrectionRequest) {
    return unwrap(await this.correctionService.review(input.id));
  }

  @Mutation({ input: resolveCorrectionRequestSchema })
  async resolve(
    @Input() input: ResolveCorrectionRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.correctionService.resolve(input.id, {
        resolvedBy: ctx.auth.userId,
        resolutionNotes: input.resolutionNotes,
      }),
    );
  }

  @Mutation({ input: escalateCorrectionRequestSchema })
  async escalate(@Input() input: EscalateCorrectionRequest) {
    return unwrap(
      await this.correctionService.escalate(input.id, {
        escalatedTo: input.escalatedTo,
        reason: input.reason,
      }),
    );
  }

  @Mutation({ input: idParam })
  async reject(@Input() input: { id: string }) {
    return unwrap(await this.correctionService.reject(input.id));
  }
}
