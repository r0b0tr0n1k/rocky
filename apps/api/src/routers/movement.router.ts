// ── Movement Router — tRPC entry point ──

import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc";
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
  recordDeathRequestSchema,
  declarePastureRequestSchema,
  recordSlaughterRequestSchema,
  importEURequestSchema,
  importThirdCountryRequestSchema,
  exportAnimalRequestSchema,
  recordMarketTransactionRequestSchema,
  recordMarketUnsoldRequestSchema,
  recordMarketSlaughterRequestSchema,
  type MovementResponse,
  type MovementListResponse,
  type CreateMovementRequest,
  type MovementListRequest,
  type RecordDeathRequest,
  type DeclarePastureRequest,
  type RecordSlaughterRequest,
  type ImportEURequest,
  type ImportThirdCountryRequest,
  type ExportAnimalRequest,
  type RecordMarketTransactionRequest,
  type RecordMarketUnsoldRequest,
  type RecordMarketSlaughterRequest,
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
  ) { }

  // ── CRUD ──

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

  // ── Rule Group B: Death Scenarios ──

  @Mutation({ input: recordDeathRequestSchema, output: movementResponseSchema })
  async recordDeath(
    @Input() input: RecordDeathRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.recordDeath({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  // ── Rule Group C: Pasture Movements ──

  @Mutation({ input: declarePastureRequestSchema, output: z.array(movementResponseSchema) })
  async declarePasture(
    @Input() input: DeclarePastureRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse[]> {
    return unwrap(
      await this.movementService.declarePasture({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  // ── Rule Group D: Slaughter ──

  @Mutation({ input: recordSlaughterRequestSchema, output: movementResponseSchema })
  async recordSlaughter(
    @Input() input: RecordSlaughterRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.recordSlaughter({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  // ── Rule Group IE: Import/Export ──

  @Mutation({ input: importEURequestSchema, output: movementResponseSchema })
  async importEU(
    @Input() input: ImportEURequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.importEU({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: importThirdCountryRequestSchema, output: movementResponseSchema })
  async importThirdCountry(
    @Input() input: ImportThirdCountryRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.importThirdCountry({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: exportAnimalRequestSchema, output: movementResponseSchema })
  async exportAnimal(
    @Input() input: ExportAnimalRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.exportAnimal({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  // ── Rule Group M: Market Movements ──

  @Mutation({ input: recordMarketTransactionRequestSchema, output: z.array(movementResponseSchema) })
  async recordMarketTransaction(
    @Input() input: RecordMarketTransactionRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse[]> {
    return unwrap(
      await this.movementService.recordMarketTransaction({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: recordMarketUnsoldRequestSchema, output: movementResponseSchema })
  async recordMarketUnsold(
    @Input() input: RecordMarketUnsoldRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.recordMarketUnsold({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: recordMarketSlaughterRequestSchema, output: movementResponseSchema })
  async recordMarketSlaughter(
    @Input() input: RecordMarketSlaughterRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.recordMarketSlaughter({ ...input, createdBy: ctx.auth.userId }),
    );
  }
}
