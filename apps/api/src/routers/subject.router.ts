// --- Subject Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { SubjectService } from "@rocky/domains-subject";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type BindSubjectToFarmRequest,
  bindSubjectToFarmRequestSchema,
  type CreateSubjectRequest,
  createSubjectRequestSchema,
  type FarmSubjectBindingResponse,
  farmSubjectBindingResponseSchema,
  type SubjectResponse,
  subjectResponseSchema,
  subjectSummarySchema,
  type UpdateSubjectRequest,
  unbindSubjectFromFarmRequestSchema,
  updateSubjectRequestSchema,
} from "@rocky/validators/api/index.js";
import { SUBJECT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const searchParam = z.object({
  q: z.string().min(1),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

const unwrap = createResultUnwrapper(SUBJECT_TRPC_ERROR_MAP);

@Router({ alias: "subject" })
@RegisterPolicy("subject")
@Policy({ authenticated: true })
@Injectable()
export class SubjectRouter {
  constructor(
    @Inject(SubjectService)
    private readonly subjectService: SubjectService,
  ) {}

  @Query({ input: idParam, output: subjectResponseSchema })
  async getById(@Input() input: { id: string }): Promise<SubjectResponse> {
    return unwrap(await this.subjectService.getById(input.id));
  }

  @Query({ input: searchParam, output: z.object({ data: z.array(subjectSummarySchema), total: z.number() }) })
  async search(
    @Input() input: { q: string; limit: number; offset: number },
  ): Promise<{ data: import("@rocky/validators/api").SubjectSummary[]; total: number }> {
    return unwrap(await this.subjectService.search(input.q, input.limit, input.offset));
  }

  @Mutation({ input: createSubjectRequestSchema, output: subjectResponseSchema })
  async create(@Input() input: CreateSubjectRequest, @Ctx() ctx: AppContext): Promise<SubjectResponse> {
    return unwrap(await this.subjectService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({
    input: z.strictObject({ id: z.uuid(), data: updateSubjectRequestSchema }),
    output: subjectResponseSchema,
  })
  async update(
    @Input() input: { id: string; data: UpdateSubjectRequest },
    @Ctx() ctx: AppContext,
  ): Promise<SubjectResponse> {
    return unwrap(await this.subjectService.update(input.id, input.data, ctx.execution?.principal.id));
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
