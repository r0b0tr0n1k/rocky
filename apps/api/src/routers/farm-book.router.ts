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
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const farmIdParam = z.object({ farmId: z.uuid() });

const unwrap = createResultUnwrapper(FARM_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const farmBookArraySchema = z.array(farmBookResponseSchema);
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

  @Query({ input: farmIdParam, output: farmBookArraySchema })
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

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof farmBookResponseSchema>,
  Awaited<ReturnType<FarmBookRouter["getById"]>>
>;
type _verify_getByFarmIdOutput = SubtypeGuillotine<
  z.output<typeof farmBookArraySchema>,
  Awaited<ReturnType<FarmBookRouter["getByFarmId"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof farmBookResponseSchema>,
  Awaited<ReturnType<FarmBookRouter["create"]>>
>;
type _verify_updateStatusOutput = SubtypeGuillotine<
  z.output<typeof farmBookResponseSchema>,
  Awaited<ReturnType<FarmBookRouter["updateStatus"]>>
>;

export type _FarmBookGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_getByFarmIdOutput,
  _verify_createOutput,
  _verify_updateStatusOutput
]>;
