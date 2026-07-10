// --- Animal Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { AnimalService } from "@rocky/domains-animal";
import type { AppContext } from "@rocky/trpc/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type AnimalListRequest,
  type AnimalListResponse,
  type AnimalResponse,
  animalListRequestSchema,
  animalListResponseSchema,
  animalResponseSchema,
  type CreateAnimalRequest,
  createAnimalRequestSchema,
  type FindAnimalByTagRequest,
  findAnimalByTagRequestSchema,
  type UpdateAnimalRequest,
  updateAnimalRequestSchema,
} from "@rocky/validators/api/index.js";
import { ANIMAL_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(ANIMAL_TRPC_ERROR_MAP);

@Router({ alias: "animal" })
@RegisterPolicy("animal")
@Policy({ authenticated: true })
@Injectable()
export class AnimalRouter {
  constructor(@Inject(AnimalService) private readonly animalService: AnimalService) {}

  @Query({ input: idParam, output: animalResponseSchema })
  async getById(@Input() input: { id: string }): Promise<AnimalResponse> {
    return unwrap(await this.animalService.getById(input.id));
  }

  @Query({ input: findAnimalByTagRequestSchema, output: animalResponseSchema })
  async findByTag(@Input() input: FindAnimalByTagRequest): Promise<AnimalResponse> {
    return unwrap(await this.animalService.findByTag(input.earTag, input.stateCode));
  }

  @Query({ input: animalListRequestSchema, output: animalListResponseSchema })
  async list(@Input() input: AnimalListRequest): Promise<AnimalListResponse> {
    return unwrap(await this.animalService.list(input));
  }

  @Mutation({ input: createAnimalRequestSchema, output: animalResponseSchema })
  async create(@Input() input: CreateAnimalRequest, @Ctx() ctx: AppContext): Promise<AnimalResponse> {
    return unwrap(await this.animalService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: updateAnimalRequestSchema, output: animalResponseSchema })
  async update(@Input() input: UpdateAnimalRequest & { id: string }): Promise<AnimalResponse> {
    return unwrap(await this.animalService.update(input.id, input));
  }
}

// ── Bridge 2b: thin router return (service success type) vs declared `output:` ──
// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof animalResponseSchema>,
  Awaited<ReturnType<AnimalRouter["getById"]>>
>;
type _verify_findByTagOutput = SubtypeGuillotine<
  z.output<typeof animalResponseSchema>,
  Awaited<ReturnType<AnimalRouter["findByTag"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof animalListResponseSchema>,
  Awaited<ReturnType<AnimalRouter["list"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof animalResponseSchema>,
  Awaited<ReturnType<AnimalRouter["create"]>>
>;
type _verify_updateOutput = SubtypeGuillotine<
  z.output<typeof animalResponseSchema>,
  Awaited<ReturnType<AnimalRouter["update"]>>
>;

export type _AnimalGuillotines = ActivateGuillotines<
  [_verify_getByIdOutput, _verify_findByTagOutput, _verify_listOutput,
   _verify_createOutput, _verify_updateOutput]
>;
