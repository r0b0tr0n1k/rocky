// --- Farm Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { FarmService } from "@rocky/domains-farm";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  addressResponseSchema,
  createFarmRequestSchema,
  farmListRequestSchema,
  farmListResponseSchema,
  farmResponseSchema,
  updateFarmRequestSchema,
  type AddressResponse,
  type CreateFarmRequest,
  type FarmListRequest,
  type FarmListResponse,
  type FarmResponse,
  type UpdateFarmRequest,
} from "@rocky/validators/api";
import { FARM_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";

const idParam = z.object({ id: z.uuid() });
const farmIdParam = z.object({ farmId: z.string() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);

@Router({ alias: "farm" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class FarmRouter {
  constructor(
    @Inject(FarmService) private readonly farmService: FarmService,
  ) { }

  @Query({ input: idParam, output: farmResponseSchema })
  async getById(@Input() input: { id: string }): Promise<FarmResponse> {
    return unwrap(await this.farmService.getById(input.id));
  }

  @Query({ input: farmIdParam, output: farmResponseSchema })
  async getByFarmId(@Input() input: { farmId: string }): Promise<FarmResponse> {
    return unwrap(await this.farmService.getByFarmId(input.farmId));
  }

  @Query({ input: farmListRequestSchema, output: farmListResponseSchema })
  async list(@Input() input: FarmListRequest): Promise<FarmListResponse> {
    return unwrap(await this.farmService.list(input));
  }

  @Mutation({ input: createFarmRequestSchema, output: farmResponseSchema })
  async create(
    @Input() input: CreateFarmRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<FarmResponse> {
    return unwrap(
      await this.farmService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: z.object({ id: z.uuid() }).merge(updateFarmRequestSchema), output: farmResponseSchema })
  async update(
    @Input() input: { id: string } & UpdateFarmRequest,
  ): Promise<FarmResponse> {
    const { id, ...data } = input;
    return unwrap(await this.farmService.update(id, data));
  }

  @Query({ input: idParam, output: addressResponseSchema })
  async getAddress(@Input() input: { id: string }): Promise<AddressResponse> {
    return unwrap(await this.farmService.getAddress(input.id));
  }
}
