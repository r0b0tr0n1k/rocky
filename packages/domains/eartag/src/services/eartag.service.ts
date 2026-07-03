/**
 * EarTag Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 * No direct DB access — all queries go through EarTagRepository.
 */

import type {
  EarTagResponse,
  EarTagSummary,
  EarTagTypeResponse,
  EarTagListRequest,
  EarTagListResponse,
} from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError, NotFoundError } from "@rocky/domains-shared";
import { EarTagError, EARTAG_ERRORS } from "../errors/eartag.errors.js";
import type { EarTagRepository } from "../repositories/eartag.repository.js";

export class EarTagService {
  constructor(private readonly repo: EarTagRepository) {}

  async getById(id: string): Promise<Result<EarTagResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const tag = await this.repo.findById(id);
      if (!tag) throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, { type: "earTag", id });
      return tag as unknown as EarTagResponse;
    }, toAppError)();
  }

  async list(input: EarTagListRequest): Promise<Result<EarTagListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listFiltered(input);
      return {
        data: data as unknown as EarTagSummary[],
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }, toAppError)();
  }

  async findByTag(stateCode: string, tagNumber: string): Promise<Result<EarTagResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const tag = await this.repo.findByTag(stateCode, tagNumber);
      if (!tag) throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, { type: "earTag", stateCode, tagNumber });
      return tag as unknown as EarTagResponse;
    }, toAppError)();
  }

  async getOrderById(id: string): Promise<Result<EarTagResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.findOrderById(id);
      if (!order) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { id });
      return order as unknown as EarTagResponse;
    }, toAppError)();
  }

  async listOrders(input: {
    status?: string;
    organizationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Result<{ data: EarTagResponse[]; total: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listOrders(input);
      return { data: data as unknown as EarTagResponse[], total };
    }, toAppError)();
  }

  async getTypeById(id: string): Promise<Result<EarTagTypeResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const type = await this.repo.findTypeById(id);
      if (!type) throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, { type: "earTagType", id });
      return type as unknown as EarTagTypeResponse;
    }, toAppError)();
  }

  async listTypes(): Promise<Result<EarTagTypeResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const types = await this.repo.allTypes();
      return types as unknown as EarTagTypeResponse[];
    }, toAppError)();
  }

  async transitionOrderStatus(orderId: string, newStatus: string): Promise<Result<EarTagResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.updateOrderStatus(orderId, newStatus);
      if (!order) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });
      return order as unknown as EarTagResponse;
    }, toAppError)();
  }
}
