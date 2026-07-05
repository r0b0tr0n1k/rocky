import type {
  VsContractResponse,
  CreateVsContractRequest,
  UpdateVsContractStatusRequest,
} from "@rocky/validators/api";
import { vsContractResponseSchema } from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { VS_CONTRACT_STATUS } from "@rocky/database/constants";
import { FarmError, FARM_ERRORS } from "../errors/farm.errors.js";
import type { VsContractRepository } from "../repositories/vs-contract.repository.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  [VS_CONTRACT_STATUS.DRAFT]: [VS_CONTRACT_STATUS.ACTIVE, VS_CONTRACT_STATUS.TERMINATED],
  [VS_CONTRACT_STATUS.ACTIVE]: [VS_CONTRACT_STATUS.SUSPENDED, VS_CONTRACT_STATUS.TERMINATED, VS_CONTRACT_STATUS.EXPIRED],
  [VS_CONTRACT_STATUS.SUSPENDED]: [VS_CONTRACT_STATUS.ACTIVE, VS_CONTRACT_STATUS.TERMINATED],
  [VS_CONTRACT_STATUS.TERMINATED]: [],
  [VS_CONTRACT_STATUS.EXPIRED]: [],
};

export class VsContractService {
  constructor(private readonly repo: VsContractRepository) {}

  async getById(id: string): Promise<Result<VsContractResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const contract = await this.repo.findById(id);
      if (!contract) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });
      return vsContractResponseSchema.parse(contract);
    }, toAppError)();
  }

  async getBySubject(subjectId: string): Promise<Result<VsContractResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const list = await this.repo.findBySubject(subjectId);
      return vsContractResponseSchema.array().parse(list);
    }, toAppError)();
  }

  async getByRegion(region: string): Promise<Result<VsContractResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const list = await this.repo.findByRegion(region);
      return vsContractResponseSchema.array().parse(list);
    }, toAppError)();
  }

  async create(input: CreateVsContractRequest & { createdBy?: string }): Promise<Result<VsContractResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const contract = await this.repo.insert({
        subjectId: input.subjectId,
        contractNumber: input.contractNumber,
        region: input.region,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
        createdBy: input.createdBy,
      });
      if (!contract) throw new FarmError(FARM_ERRORS.INVALID_INPUT);
      return vsContractResponseSchema.parse(contract);
    }, toAppError)();
  }

  async updateStatus(
    id: string,
    input: UpdateVsContractStatusRequest,
  ): Promise<Result<VsContractResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findById(id);
      if (!existing) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });

      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new FarmError(FARM_ERRORS.INVALID_INPUT, {
          message: `Cannot transition from ${existing.status} to ${input.status}`,
        });
      }

      const contract = await this.repo.updateStatus(id, input.status);
      if (!contract) throw new FarmError(FARM_ERRORS.INVALID_INPUT);
      return vsContractResponseSchema.parse(contract);
    }, toAppError)();
  }
}
