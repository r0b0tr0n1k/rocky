// --- Movement Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { MovementService } from "@rocky/domains-movement";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateMovementRequest,
  createMovementRequestSchema,
  type DeclareAlpineRequest,
  type DeclarePastureRequest,
  declareAlpineRequestSchema,
  declarePastureRequestSchema,
  type ExportAnimalRequest,
  exportAnimalRequestSchema,
  type ImportEURequest,
  type ImportThirdCountryRequest,
  importEURequestSchema,
  importThirdCountryRequestSchema,
  type MovementListRequest,
  type MovementListResponse,
  type MovementResponse,
  movementListRequestSchema,
  movementListResponseSchema,
  movementResponseSchema,
  type RecordDeathRequest,
  type RecordMarketSlaughterRequest,
  type RecordMarketTransactionRequest,
  type RecordMarketUnsoldRequest,
  type RecordSlaughterRequest,
  type ReturnFromAlpineRequest,
  recordDeathRequestSchema,
  recordMarketSlaughterRequestSchema,
  recordMarketTransactionRequestSchema,
  recordMarketUnsoldRequestSchema,
  recordSlaughterRequestSchema,
  returnFromAlpineRequestSchema,
} from "@rocky/validators/api/index.js";
import { MOVEMENT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });

const unwrap = createResultUnwrapper(MOVEMENT_TRPC_ERROR_MAP);

@Router({ alias: "movement" })
@RegisterPolicy("movement")
@Policy({ authenticated: true })
@Injectable()
export class MovementRouter {
  constructor(
    @Inject(MovementService)
    private readonly movementService: MovementService,
  ) {}

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
  async create(@Input() input: CreateMovementRequest, @Ctx() ctx: AppContext): Promise<MovementResponse> {
    return unwrap(await this.movementService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  // ── Rule Group B: Death Scenarios ──

  @Mutation({ input: recordDeathRequestSchema, output: movementResponseSchema })
  async recordDeath(@Input() input: RecordDeathRequest, @Ctx() ctx: AppContext): Promise<MovementResponse> {
    return unwrap(await this.movementService.recordDeath({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  // ── Rule Group C: Pasture Movements ──

  @Mutation({ input: declarePastureRequestSchema, output: z.array(movementResponseSchema) })
  async declarePasture(@Input() input: DeclarePastureRequest, @Ctx() ctx: AppContext): Promise<MovementResponse[]> {
    return unwrap(await this.movementService.declarePasture({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: declareAlpineRequestSchema, output: z.array(movementResponseSchema) })
  async declareAlpine(@Input() input: DeclareAlpineRequest, @Ctx() ctx: AppContext): Promise<MovementResponse[]> {
    return unwrap(await this.movementService.declareAlpine({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: returnFromAlpineRequestSchema, output: movementResponseSchema })
  async returnFromAlpine(@Input() input: ReturnFromAlpineRequest, @Ctx() ctx: AppContext): Promise<MovementResponse> {
    return unwrap(await this.movementService.returnFromAlpine({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  // ── Rule Group D: Slaughter ──

  @Mutation({ input: recordSlaughterRequestSchema, output: movementResponseSchema })
  async recordSlaughter(@Input() input: RecordSlaughterRequest, @Ctx() ctx: AppContext): Promise<MovementResponse> {
    return unwrap(await this.movementService.recordSlaughter({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  // ── Rule Group IE: Import/Export ──

  @Mutation({ input: importEURequestSchema, output: movementResponseSchema })
  async importEU(@Input() input: ImportEURequest, @Ctx() ctx: AppContext): Promise<MovementResponse> {
    return unwrap(await this.movementService.importEU({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: importThirdCountryRequestSchema, output: movementResponseSchema })
  async importThirdCountry(
    @Input() input: ImportThirdCountryRequest,
    @Ctx() ctx: AppContext,
  ): Promise<MovementResponse> {
    return unwrap(await this.movementService.importThirdCountry({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: exportAnimalRequestSchema, output: movementResponseSchema })
  async exportAnimal(@Input() input: ExportAnimalRequest, @Ctx() ctx: AppContext): Promise<MovementResponse> {
    return unwrap(await this.movementService.exportAnimal({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  // ── Rule Group M: Market Movements ──

  @Mutation({ input: recordMarketTransactionRequestSchema, output: z.array(movementResponseSchema) })
  async recordMarketTransaction(
    @Input() input: RecordMarketTransactionRequest,
    @Ctx() ctx: AppContext,
  ): Promise<MovementResponse[]> {
    return unwrap(
      await this.movementService.recordMarketTransaction({ ...input, createdBy: ctx.execution?.principal.id }),
    );
  }

  @Mutation({ input: recordMarketUnsoldRequestSchema, output: movementResponseSchema })
  async recordMarketUnsold(
    @Input() input: RecordMarketUnsoldRequest,
    @Ctx() ctx: AppContext,
  ): Promise<MovementResponse> {
    return unwrap(await this.movementService.recordMarketUnsold({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: recordMarketSlaughterRequestSchema, output: movementResponseSchema })
  async recordMarketSlaughter(
    @Input() input: RecordMarketSlaughterRequest,
    @Ctx() ctx: AppContext,
  ): Promise<MovementResponse> {
    return unwrap(
      await this.movementService.recordMarketSlaughter({ ...input, createdBy: ctx.execution?.principal.id }),
    );
  }
}
