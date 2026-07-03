/**
 * Animal Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 */

import type {
  AnimalResponse,
  AnimalSummary,
  AnimalListResponse,
  CreateAnimalRequest,
  UpdateAnimalRequest,
  AnimalListRequest,
} from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { STATE_CODE } from "@rocky/database/constants";
import { AnimalError, ANIMAL_ERRORS } from "../errors/animal.errors.js";
import type { AnimalRepository } from "../repositories/animal.repository.js";

export class AnimalService {
  constructor(private readonly repo: AnimalRepository) {}

  async getById(id: string): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.repo.findById(id);
      if (!animal) throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { id });
      return animal as unknown as AnimalResponse;
    }, toAppError)();
  }

  async list(input: AnimalListRequest): Promise<Result<AnimalListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listFiltered(input);
      return { data: data as unknown as AnimalSummary[], total, limit: input.limit, offset: input.offset };
    }, toAppError)();
  }

  async create(input: CreateAnimalRequest & { createdBy?: string }): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.repo.insert(input as typeof import("@rocky/database").animals.$inferInsert);
      return animal as unknown as AnimalResponse;
    }, toAppError)();
  }

  async update(id: string, input: UpdateAnimalRequest): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.repo.update(
        id,
        input as Partial<typeof import("@rocky/database").animals.$inferInsert>,
      );
      if (!animal) throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { id });
      return animal as unknown as AnimalResponse;
    }, toAppError)();
  }

  async findByTag(earTag: string, stateCode = STATE_CODE.MK): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.repo.findByTag(earTag, stateCode);
      if (!animal) throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { earTag, stateCode });
      return animal as unknown as AnimalResponse;
    }, toAppError)();
  }
}
