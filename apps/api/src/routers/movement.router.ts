// ── Movement Router — tRPC entry point ──

import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc-v2";
import { z } from "zod";
import { createResultUnwrapper } from "@rocky/trpc";
import { MOVEMENT_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { MovementService } from "@rocky/domains-movement";
import {
  movementResponseSchema,
  movementListResponseSchema,
  createMovementRequestSchema,
  movementListRequestSchema,
  type MovementResponse,
  type MovementListResponse,
  type CreateMovementRequest,
  type MovementListRequest,
} from "@rocky/validators/api";

const idParam = z.object({ id: z.uuid() });

const unwrap = createResultUnwrapper(MOVEMENT_TRPC_ERROR_MAP);

@Router({ alias: "movement" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class MovementRouter {
  constructor(
    @Inject(MovementService)
    private readonly movementService: MovementService,
  ) {}

  @Query({ input: idParam, output: movementResponseSchema })
  async getById(@Input() input: { id: string }): Promise<MovementResponse> {
    return unwrap(await this.movementService.getById(input.id));
  }

  @Query({ input: movementListRequestSchema, output: movementListResponseSchema })
  async list(@Input() input: MovementListRequest): Promise<MovementListResponse> {
    return unwrap(await this.movementService.listByAnimal(input));
  }

  @Mutation({ input: createMovementRequestSchema, output: movementResponseSchema })
  async create(
    @Input() input: CreateMovementRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }
}
