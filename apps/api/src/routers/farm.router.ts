// --- Farm Router - tRPC entry point (Phase 3 migration) ---
//
// Migration path:

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { FarmService } from "@rocky/domains-farm";
import type { AppContext } from "@rocky/trpc/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateFarmRequest,
  createFarmRequestSchema,
  type FarmListRequest,
  type FarmListResponse,
  type FarmResponse,
  farmListRequestSchema,
  farmListResponseSchema,
  farmResponseSchema,
  type UpdateFarmRequest,
  updateFarmRequestSchema,
} from "@rocky/validators/api/index.js";
import { FARM_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);

@Router({ alias: "farm" })
@RegisterPolicy("farm")
@Policy({ authenticated: true })
@Injectable()
export class FarmRouter {
  constructor(@Inject(FarmService) private readonly farmService: FarmService) {}

  @Query({ input: idParam, output: farmResponseSchema })
  async getById(@Input() input: { id: string }): Promise<FarmResponse> {
    return unwrap(await this.farmService.getById(input.id));
  }

  @Query({ input: farmListRequestSchema, output: farmListResponseSchema })
  async list(@Input() input: FarmListRequest): Promise<FarmListResponse> {
    return unwrap(await this.farmService.list(input));
  }

  @Mutation({ input: createFarmRequestSchema, output: farmResponseSchema })
  async create(@Input() input: CreateFarmRequest): Promise<FarmResponse> {
    return unwrap(await this.farmService.create(input));
  }

  @Mutation({ input: z.object({ id: z.uuid() }).extend(updateFarmRequestSchema.shape), output: farmResponseSchema })
  async update(@Input() input: { id: string } & UpdateFarmRequest, @Ctx() ctx: AppContext): Promise<FarmResponse> {
    const { id, ...data } = input;
    return unwrap(await this.farmService.update(id, data, ctx.execution?.principal.id));
  }
}
