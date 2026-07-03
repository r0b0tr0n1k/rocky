/**
 * Movement Domain Service
 *
 * Orchestrates: validate → guard checks → delegate to repos → return Result.
 * Cross-table logic (animal existence check + farm update) stays in service.
 */

import { movementListRequestSchema } from "@rocky/validators/api";
import type {
  MovementResponse,
  MovementSummary,
  MovementListResponse,
  CreateMovementRequest,
  MovementListRequest,
} from "@rocky/validators/api";
import type { movements as movementsTable } from "@rocky/database";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { MovementError, MOVEMENT_ERRORS } from "../errors/movement.errors.js";
import type { MovementRepository } from "../repositories/movement.repository.js";
import type { AnimalRepository } from "@rocky/domains-animal";

export class MovementService {
  constructor(
    private readonly repo: MovementRepository,
    private readonly animalRepo: AnimalRepository,
  ) {}

  async getById(id: string): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const mov = await this.repo.findById(id);
      if (!mov) throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, { id });
      return mov as unknown as MovementResponse;
    }, toAppError)();
  }

  async listByAnimal(input: MovementListRequest): Promise<Result<MovementListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = movementListRequestSchema.parse(input);
      const filter = {
        ...validated,
        fromDate: validated.fromDate?.toISOString().split("T")[0],
        toDate: validated.toDate?.toISOString().split("T")[0],
      };
      const { data, total } = await this.repo.listFiltered(filter);
      return {
        data: data as unknown as MovementSummary[],
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }, toAppError)();
  }

  async create(input: CreateMovementRequest & { createdBy?: string }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // Guard: cannot move animal to the same farm
      if (input.fromFarmId && input.toFarmId && input.fromFarmId === input.toFarmId) {
        throw new MovementError(MOVEMENT_ERRORS.SAME_FARM, {
          farmId: input.fromFarmId,
        });
      }

      // Verify animal exists
      const animal = await this.animalRepo.findAnimalFarm(input.animalId);
      if (!animal)
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });

      // Create movement record
      const mov = await this.repo.insert(input as typeof movementsTable.$inferInsert);

      // Update animal's current farm
      await this.animalRepo.updateFarm(input.animalId, input.toFarmId);

      return mov as unknown as MovementResponse;
    }, toAppError)();
  }
}
