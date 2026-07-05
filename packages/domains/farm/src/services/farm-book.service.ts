import { FARM_BOOK_STATUS } from "@rocky/database/constants";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type { CreateFarmBookRequest, FarmBookResponse, UpdateFarmBookStatusRequest } from "@rocky/validators/api";
import { farmBookResponseSchema } from "@rocky/validators/api";
import { FARM_ERRORS, FarmError } from "../errors/farm.errors.js";
import type { FarmBookRepository } from "../repositories/farm-book.repository.js";

const STATUS_ORDER: Record<string, number> = {
  [FARM_BOOK_STATUS.PENDING]: 0,
  [FARM_BOOK_STATUS.ASSEMBLED]: 1,
  [FARM_BOOK_STATUS.PRINTED]: 2,
  [FARM_BOOK_STATUS.SHIPPED_TO_VS]: 3,
  [FARM_BOOK_STATUS.DELIVERED]: 4,
  [FARM_BOOK_STATUS.CANCELLED]: 5,
};

export class FarmBookService {
  constructor(private readonly repo: FarmBookRepository) { }

  async getById(id: string): Promise<Result<FarmBookResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const fb = await this.repo.findById(id);
      if (!fb) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });
      return farmBookResponseSchema.parse(fb);
    }, toAppError)();
  }

  async getByFarmId(farmId: string): Promise<Result<FarmBookResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const list = await this.repo.findByFarmId(farmId);
      return farmBookResponseSchema.array().parse(list);
    }, toAppError)();
  }

  async create(input: CreateFarmBookRequest & { createdBy?: string }): Promise<Result<FarmBookResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const fb = await this.repo.insert({
        farmId: input.farmId,
        status: FARM_BOOK_STATUS.ASSEMBLED,
        assembledAt: new Date(),
        assembledBy: input.createdBy,
        createdBy: input.createdBy,
      });
      if (!fb) throw new FarmError(FARM_ERRORS.INVALID_INPUT);
      return farmBookResponseSchema.parse(fb);
    }, toAppError)();
  }

  async updateStatus(
    id: string,
    input: UpdateFarmBookStatusRequest,
    updatedBy?: string,
  ): Promise<Result<FarmBookResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findById(id);
      if (!existing) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });

      const currentOrder = STATUS_ORDER[existing.status] ?? -1;
      const nextOrder = STATUS_ORDER[input.status] ?? -1;
      if (nextOrder < currentOrder && input.status !== FARM_BOOK_STATUS.CANCELLED) {
        throw new FarmError(FARM_ERRORS.INVALID_INPUT, {
          message: `Cannot transition from ${existing.status} to ${input.status}`,
        });
      }

      const fb = await this.repo.updateStatus(id, input, updatedBy);
      if (!fb) throw new FarmError(FARM_ERRORS.INVALID_INPUT);
      return farmBookResponseSchema.parse(fb);
    }, toAppError)();
  }
}
