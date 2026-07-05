// ── Subject Router — tRPC entry point ──

import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { createResultUnwrapper } from "@rocky/trpc";
import { SUBJECT_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { SubjectService } from "@rocky/domains-subject";
import {
  subjectResponseSchema,
  subjectSummarySchema,
  createSubjectRequestSchema,
  bindSubjectToFarmRequestSchema,
  unbindSubjectFromFarmRequestSchema,
  farmSubjectBindingResponseSchema,
  type SubjectResponse,
  type CreateSubjectRequest,
  type BindSubjectToFarmRequest,
  type FarmSubjectBindingResponse,
} from "@rocky/validators/api";

const idParam = z.object({ id: z.uuid() });
const searchParam = z.object({ q: z.string().min(1), limit: z.int().min(1).max(100).default(20), offset: z.int().min(0).default(0) });

const unwrap = createResultUnwrapper(SUBJECT_TRPC_ERROR_MAP);

@Router({ alias: "subject" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class SubjectRouter {
  constructor(
    @Inject(SubjectService)
    private readonly subjectService: SubjectService,
  ) { }

  @Query({ input: idParam, output: subjectResponseSchema })
  async getById(@Input() input: { id: string }): Promise<SubjectResponse> {
    return unwrap(await this.subjectService.getById(input.id));
  }

  @Query({ input: searchParam, output: z.object({ data: z.array(subjectSummarySchema), total: z.number() }) })
  async search(@Input() input: { q: string; limit: number; offset: number }): Promise<{ data: import("@rocky/validators/api").SubjectSummary[]; total: number }> {
    return unwrap(await this.subjectService.search(input.q, input.limit, input.offset));
  }

  @Mutation({ input: createSubjectRequestSchema, output: subjectResponseSchema })
  async create(
    @Input() input: CreateSubjectRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<SubjectResponse> {
    return unwrap(
      await this.subjectService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: bindSubjectToFarmRequestSchema, output: farmSubjectBindingResponseSchema })
  async bindToFarm(@Input() input: BindSubjectToFarmRequest): Promise<FarmSubjectBindingResponse> {
    return unwrap(await this.subjectService.bindToFarm(input));
  }

  @Mutation({ input: unbindSubjectFromFarmRequestSchema, output: z.object({ deleted: z.boolean() }) })
  async unbindFromFarm(@Input() input: { bindingId: string }): Promise<{ deleted: boolean }> {
    return unwrap(await this.subjectService.unbindFromFarm(input.bindingId));
  }
}
