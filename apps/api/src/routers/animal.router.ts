// ── Animal Router — tRPC entry point ──
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc-v2";
import { z } from "zod";
import { createResultUnwrapper } from "@rocky/trpc";
import { ANIMAL_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { AnimalService } from "@rocky/domains-animal";
import {
  animalResponseSchema,
  animalListResponseSchema,
  createAnimalRequestSchema,
  updateAnimalRequestSchema,
  animalListRequestSchema,
  findAnimalByTagRequestSchema,
  type AnimalResponse,
  type AnimalListResponse,
  type CreateAnimalRequest,
  type UpdateAnimalRequest,
  type AnimalListRequest,
  type FindAnimalByTagRequest,
} from "@rocky/validators/api";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(ANIMAL_TRPC_ERROR_MAP);

@Router({ alias: "animal" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class AnimalRouter {
  constructor(
    @Inject(AnimalService) private readonly animalService: AnimalService,
  ) {}

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
