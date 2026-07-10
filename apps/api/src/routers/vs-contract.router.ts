import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { VsContractService } from "@rocky/domains-farm";
import type { AppContext } from "@rocky/trpc/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateVsContractRequest,
  createVsContractRequestSchema,
  type UpdateVsContractStatusRequest,
  updateVsContractStatusRequestSchema,
  type VsContractResponse,
  vsContractResponseSchema,
} from "@rocky/validators/api/index.js";
import { FARM_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const subjectParam = z.object({ subjectId: z.uuid() });
const regionParam = z.object({ region: z.string() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const vsContractArraySchema = z.array(vsContractResponseSchema);
@Router({ alias: "vsContract" })
@RegisterPolicy("vsContract")
@Policy({ authenticated: true })
@Injectable()
export class VsContractRouter {
  constructor(
    @Inject(VsContractService)
    private readonly vsContractService: VsContractService,
  ) {}

  @Query({ input: idParam, output: vsContractResponseSchema })
  async getById(@Input() input: { id: string }): Promise<VsContractResponse> {
    return unwrap(await this.vsContractService.getById(input.id));
  }

  @Query({ input: subjectParam, output: vsContractArraySchema })
  async getBySubject(@Input() input: { subjectId: string }): Promise<VsContractResponse[]> {
    return unwrap(await this.vsContractService.getBySubject(input.subjectId));
  }

  @Query({ input: regionParam, output: vsContractArraySchema })
  async getByRegion(@Input() input: { region: string }): Promise<VsContractResponse[]> {
    return unwrap(await this.vsContractService.getByRegion(input.region));
  }

  @Mutation({ input: createVsContractRequestSchema, output: vsContractResponseSchema })
  async create(@Input() input: CreateVsContractRequest, @Ctx() ctx: AppContext): Promise<VsContractResponse> {
    return unwrap(await this.vsContractService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({
    input: z.strictObject({ id: z.uuid(), data: updateVsContractStatusRequestSchema }),
    output: vsContractResponseSchema,
  })
  async updateStatus(@Input() input: { id: string; data: UpdateVsContractStatusRequest }): Promise<VsContractResponse> {
    return unwrap(await this.vsContractService.updateStatus(input.id, input.data));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof vsContractResponseSchema>,
  Awaited<ReturnType<VsContractRouter["getById"]>>
>;
type _verify_getBySubjectOutput = SubtypeGuillotine<
  z.output<typeof vsContractArraySchema>,
  Awaited<ReturnType<VsContractRouter["getBySubject"]>>
>;
type _verify_getByRegionOutput = SubtypeGuillotine<
  z.output<typeof vsContractArraySchema>,
  Awaited<ReturnType<VsContractRouter["getByRegion"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof vsContractResponseSchema>,
  Awaited<ReturnType<VsContractRouter["create"]>>
>;
type _verify_updateStatusOutput = SubtypeGuillotine<
  z.output<typeof vsContractResponseSchema>,
  Awaited<ReturnType<VsContractRouter["updateStatus"]>>
>;

export type _VsContractGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_getBySubjectOutput,
  _verify_getByRegionOutput,
  _verify_createOutput,
  _verify_updateStatusOutput
]>;
