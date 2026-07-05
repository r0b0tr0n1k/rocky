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

const idParam = z.object({ id: z.uuid() });
const farmIdParam = z.object({ farmId: z.uuid() });
const contractIdParam = z.object({ contractId: z.uuid() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);

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

  @Query({ input: farmIdParam, output: z.array(vsAssignmentResponseSchema) })
  async getByFarm(@Input() input: { farmId: string }): Promise<VsAssignmentResponse[]> {
    return unwrap(await this.vsAssignmentService.getByFarm(input.farmId));
  }

  @Query({ input: farmIdParam, output: z.array(vsAssignmentResponseSchema) })
  async getActiveByFarm(@Input() input: { farmId: string }): Promise<VsAssignmentResponse[]> {
    return unwrap(await this.vsAssignmentService.getActiveByFarm(input.farmId));
  }

  @Query({ input: contractIdParam, output: z.array(vsAssignmentResponseSchema) })
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
