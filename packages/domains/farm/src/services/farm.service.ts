/**
 * Farm Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 */

import type {
  FarmResponse,
  FarmSummary,
  FarmListResponse,
  CreateFarmRequest,
  FarmListRequest,
  AddressResponse,
} from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { FarmError, FARM_ERRORS } from "../errors/farm.errors.js";
import type { FarmRepository } from "../repositories/farm.repository.js";

export class FarmService {
  constructor(private readonly repo: FarmRepository) {}

  async getById(id: string): Promise<Result<FarmResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const farm = await this.repo.findById(id);
      if (!farm) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });
      return farm as unknown as FarmResponse;
    }, toAppError)();
  }

  async getByFarmId(farmId: string): Promise<Result<FarmResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const farm = await this.repo.findByFarmId(farmId);
      if (!farm) throw new FarmError(FARM_ERRORS.NOT_FOUND, { farmId });
      return farm as unknown as FarmResponse;
    }, toAppError)();
  }

  async list(input: FarmListRequest): Promise<Result<FarmListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listFiltered(input);
      return { data: data as unknown as FarmSummary[], total, limit: input.limit, offset: input.offset };
    }, toAppError)();
  }

  async create(input: CreateFarmRequest & { createdBy?: string }): Promise<Result<FarmResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const farm = await this.repo.insert(input as typeof import("@rocky/database").farms.$inferInsert);
      return farm as unknown as FarmResponse;
    }, toAppError)();
  }

  async getAddress(id: string): Promise<Result<AddressResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const addr = await this.repo.findAddressById(id);
      if (!addr) throw new FarmError(FARM_ERRORS.NOT_FOUND, { addressId: id });
      return addr as unknown as AddressResponse;
    }, toAppError)();
  }
}
