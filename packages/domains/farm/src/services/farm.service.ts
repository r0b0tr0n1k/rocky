/**
 * Farm Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 */

import type { AuditService } from "@rocky/domains-audit";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type { OutboxEventPublisher } from "@rocky/execution";
import { OUTBOX_AGGREGATE_TYPE } from "@rocky/database/constants";
import type {
  AddressResponse,
  CreateFarmRequest,
  FarmListRequest,
  FarmListResponse,
  FarmResponse,
  UpdateFarmRequest,
} from "@rocky/validators/api";
import { addressResponseSchema, farmResponseSchema } from "@rocky/validators/api";
import { FARM_ERRORS, FarmError } from "../errors/farm.errors.js";
import type { FarmRepository } from "../repositories/farm.repository.js";

export class FarmService {
  constructor(
    private readonly repo: FarmRepository,
    private readonly auditService: AuditService,
    private readonly outboxPublisher?: OutboxEventPublisher,
  ) { }

  async getById(id: string): Promise<Result<FarmResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const farm = await this.repo.findById(id);
      if (!farm) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });
      return farmResponseSchema.parse(farm);
    }, toAppError)();
  }

  async getByFarmId(farmId: string): Promise<Result<FarmResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const farm = await this.repo.findByFarmId(farmId);
      if (!farm) throw new FarmError(FARM_ERRORS.NOT_FOUND, { farmId });
      return farmResponseSchema.parse(farm);
    }, toAppError)();
  }

  async list(input: FarmListRequest): Promise<Result<FarmListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listFiltered(input);
      return { data: farmResponseSchema.array().parse(data), total, limit: input.limit, offset: input.offset };
    }, toAppError)();
  }

  async create(input: CreateFarmRequest & { createdBy?: string }): Promise<Result<FarmResponse, Error>> {
    return fromAsyncThrowable(async () => {
      if (input.farmId) {
        const existing = await this.repo.findByFarmId(input.farmId);
        if (existing) throw new FarmError(FARM_ERRORS.DUPLICATE_FARM_ID, { farmId: input.farmId });
      }
      const farm = await this.repo.insert(input as typeof import("@rocky/database").farms.$inferInsert);
      return farmResponseSchema.parse(farm);
    }, toAppError)();
  }

  async update(id: string, input: UpdateFarmRequest, updatedBy?: string): Promise<Result<FarmResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const old = await this.repo.findById(id);
      if (!old) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });
      const farm = await this.repo.update(id, input as Partial<typeof import("@rocky/database").farms.$inferInsert>);
      if (!farm) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });
      await this.auditService.recordUpdate({
        resource: "farm",
        resourceId: farm.id ?? id,
        oldValue: old,
        newValue: farm,
        userId: updatedBy,
      });

      if (this.outboxPublisher && input.verificationStatus === "approved") {
        await this.outboxPublisher.publish({
          type: "approval_requested",
          aggregateType: OUTBOX_AGGREGATE_TYPE.FARM,
          aggregateId: farm.id,
          payload: {
            farmId: farm.id,
            verificationNote: input.verificationNote,
            previousStatus: old.verificationStatus,
            createdBy: updatedBy,
          },
          createdBy: updatedBy,
        });
      }

      return farmResponseSchema.parse(farm);
    }, toAppError)();
  }

  async getAddress(id: string): Promise<Result<AddressResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const addr = await this.repo.findAddressById(id);
      if (!addr) throw new FarmError(FARM_ERRORS.NOT_FOUND, { addressId: id });
      return addressResponseSchema.parse(addr);
    }, toAppError)();
  }
}
