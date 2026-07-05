import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { FarmBookService } from "@rocky/domains-farm";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateFarmBookRequest,
  createFarmBookRequestSchema,
  type FarmBookResponse,
  farmBookResponseSchema,
  type UpdateFarmBookStatusRequest,
  updateFarmBookStatusRequestSchema,
} from "@rocky/validators/api/index.js";
import { FARM_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const farmIdParam = z.object({ farmId: z.uuid() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);

@Router({ alias: "farmBook" })
@RegisterPolicy("farmBook")
@Policy({ authenticated: true })
@Injectable()
export class FarmBookRouter {
  constructor(
    @Inject(FarmBookService)
    private readonly farmBookService: FarmBookService,
  ) {}

  @Query({ input: idParam, output: farmBookResponseSchema })
  async getById(@Input() input: { id: string }): Promise<FarmBookResponse> {
    return unwrap(await this.farmBookService.getById(input.id));
  }

  @Query({ input: farmIdParam, output: z.array(farmBookResponseSchema) })
  async getByFarmId(@Input() input: { farmId: string }): Promise<FarmBookResponse[]> {
    return unwrap(await this.farmBookService.getByFarmId(input.farmId));
  }

  @Mutation({ input: createFarmBookRequestSchema, output: farmBookResponseSchema })
  async create(@Input() input: CreateFarmBookRequest, @Ctx() ctx: AppContext): Promise<FarmBookResponse> {
    return unwrap(await this.farmBookService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({
    input: z.strictObject({ id: z.uuid(), data: updateFarmBookStatusRequestSchema }),
    output: farmBookResponseSchema,
  })
  async updateStatus(
    @Input() input: { id: string; data: UpdateFarmBookStatusRequest },
    @Ctx() ctx: AppContext,
  ): Promise<FarmBookResponse> {
    return unwrap(await this.farmBookService.updateStatus(input.id, input.data, ctx.execution?.principal.id));
  }
}
