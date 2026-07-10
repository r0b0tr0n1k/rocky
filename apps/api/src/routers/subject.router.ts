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
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const searchParam = z.object({
  q: z.string().min(1),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

const unwrap = createResultUnwrapper(SUBJECT_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const searchSchema = z.object({ data: z.array(subjectSummarySchema), total: z.number() });
const unbindFromFarmSchema = z.object({ deleted: z.boolean() });
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

  @Query({ input: searchParam, output: searchSchema })
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

  @Mutation({ input: unbindSubjectFromFarmRequestSchema, output: unbindFromFarmSchema })
  async unbindFromFarm(@Input() input: { bindingId: string }): Promise<{ deleted: boolean }> {
    return unwrap(await this.subjectService.unbindFromFarm(input.bindingId));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof subjectResponseSchema>,
  Awaited<ReturnType<SubjectRouter["getById"]>>
>;
type _verify_searchOutput = SubtypeGuillotine<
  z.output<typeof searchSchema>,
  Awaited<ReturnType<SubjectRouter["search"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof subjectResponseSchema>,
  Awaited<ReturnType<SubjectRouter["create"]>>
>;
type _verify_updateOutput = SubtypeGuillotine<
  z.output<typeof subjectResponseSchema>,
  Awaited<ReturnType<SubjectRouter["update"]>>
>;
type _verify_bindToFarmOutput = SubtypeGuillotine<
  z.output<typeof farmSubjectBindingResponseSchema>,
  Awaited<ReturnType<SubjectRouter["bindToFarm"]>>
>;
type _verify_unbindFromFarmOutput = SubtypeGuillotine<
  z.output<typeof unbindFromFarmSchema>,
  Awaited<ReturnType<SubjectRouter["unbindFromFarm"]>>
>;

export type _SubjectGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_searchOutput,
  _verify_createOutput,
  _verify_updateOutput,
  _verify_bindToFarmOutput,
  _verify_unbindFromFarmOutput
]>;
