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

const idParam = z.object({ id: z.uuid() });
const subjectParam = z.object({ subjectId: z.uuid() });
const regionParam = z.object({ region: z.string() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);

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

  @Query({ input: subjectParam, output: z.array(vsContractResponseSchema) })
  async getBySubject(@Input() input: { subjectId: string }): Promise<VsContractResponse[]> {
    return unwrap(await this.vsContractService.getBySubject(input.subjectId));
  }

  @Query({ input: regionParam, output: z.array(vsContractResponseSchema) })
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
