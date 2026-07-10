import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { VsAssignmentService } from "@rocky/domains-farm";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateVsAssignmentRequest,
  createVsAssignmentRequestSchema,
  type UpdateVsAssignmentRequest,
  updateVsAssignmentRequestSchema,
  type VsAssignmentResponse,
  vsAssignmentResponseSchema,
} from "@rocky/validators/api/index.js";
import { FARM_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const farmIdParam = z.object({ farmId: z.uuid() });
const contractIdParam = z.object({ contractId: z.uuid() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const vsAssignmentArraySchema = z.array(vsAssignmentResponseSchema);
@Router({ alias: "vsAssignment" })
@RegisterPolicy("vsAssignment")
@Policy({ authenticated: true })
@Injectable()
export class VsAssignmentRouter {
  constructor(
    @Inject(VsAssignmentService)
    private readonly vsAssignmentService: VsAssignmentService,
  ) {}

  @Query({ input: idParam, output: vsAssignmentResponseSchema })
  async getById(@Input() input: { id: string }): Promise<VsAssignmentResponse> {
    return unwrap(await this.vsAssignmentService.getById(input.id));
  }

  @Query({ input: farmIdParam, output: vsAssignmentArraySchema })
  async getByFarm(@Input() input: { farmId: string }): Promise<VsAssignmentResponse[]> {
    return unwrap(await this.vsAssignmentService.getByFarm(input.farmId));
  }

  @Query({ input: farmIdParam, output: vsAssignmentArraySchema })
  async getActiveByFarm(@Input() input: { farmId: string }): Promise<VsAssignmentResponse[]> {
    return unwrap(await this.vsAssignmentService.getActiveByFarm(input.farmId));
  }

  @Query({ input: contractIdParam, output: vsAssignmentArraySchema })
  async getByContract(@Input() input: { contractId: string }): Promise<VsAssignmentResponse[]> {
    return unwrap(await this.vsAssignmentService.getByContract(input.contractId));
  }

  @Mutation({ input: createVsAssignmentRequestSchema, output: vsAssignmentResponseSchema })
  async assign(@Input() input: CreateVsAssignmentRequest, @Ctx() ctx: AppContext): Promise<VsAssignmentResponse> {
    return unwrap(await this.vsAssignmentService.assign({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({
    input: z.strictObject({ id: z.uuid(), data: updateVsAssignmentRequestSchema }),
    output: vsAssignmentResponseSchema,
  })
  async unassign(@Input() input: { id: string; data: UpdateVsAssignmentRequest }): Promise<VsAssignmentResponse> {
    return unwrap(await this.vsAssignmentService.unassign(input.id, input.data));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof vsAssignmentResponseSchema>,
  Awaited<ReturnType<VsAssignmentRouter["getById"]>>
>;
type _verify_getByFarmOutput = SubtypeGuillotine<
  z.output<typeof vsAssignmentArraySchema>,
  Awaited<ReturnType<VsAssignmentRouter["getByFarm"]>>
>;
type _verify_getActiveByFarmOutput = SubtypeGuillotine<
  z.output<typeof vsAssignmentArraySchema>,
  Awaited<ReturnType<VsAssignmentRouter["getActiveByFarm"]>>
>;
type _verify_getByContractOutput = SubtypeGuillotine<
  z.output<typeof vsAssignmentArraySchema>,
  Awaited<ReturnType<VsAssignmentRouter["getByContract"]>>
>;
type _verify_assignOutput = SubtypeGuillotine<
  z.output<typeof vsAssignmentResponseSchema>,
  Awaited<ReturnType<VsAssignmentRouter["assign"]>>
>;
type _verify_unassignOutput = SubtypeGuillotine<
  z.output<typeof vsAssignmentResponseSchema>,
  Awaited<ReturnType<VsAssignmentRouter["unassign"]>>
>;

export type _VsAssignmentGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_getByFarmOutput,
  _verify_getActiveByFarmOutput,
  _verify_getByContractOutput,
  _verify_assignOutput,
  _verify_unassignOutput
]>;
