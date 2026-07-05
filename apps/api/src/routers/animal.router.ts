// --- Animal Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { AnimalService } from "@rocky/domains-animal";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  animalListRequestSchema,
  animalListResponseSchema,
  animalResponseSchema,
  createAnimalRequestSchema,
  findAnimalByTagRequestSchema,
  updateAnimalRequestSchema,
  type AnimalListRequest,
  type AnimalListResponse,
  type AnimalResponse,
  type CreateAnimalRequest,
  type FindAnimalByTagRequest,
  type UpdateAnimalRequest,
} from "@rocky/validators/api";
import { ANIMAL_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(ANIMAL_TRPC_ERROR_MAP);

@Router({ alias: "animal" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class AnimalRouter {
  constructor(
    @Inject(AnimalService) private readonly animalService: AnimalService,
  ) { }

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
  async create(
    @Input() input: CreateAnimalRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<AnimalResponse> {
    return unwrap(
      await this.animalService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: updateAnimalRequestSchema, output: animalResponseSchema })
  async update(
    @Input() input: UpdateAnimalRequest & { id: string },
  ): Promise<AnimalResponse> {
    return unwrap(await this.animalService.update(input.id, input));
  }
}
