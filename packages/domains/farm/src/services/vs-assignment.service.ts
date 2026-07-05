import { VS_CONTRACT_STATUS } from "@rocky/database/constants";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type { CreateVsAssignmentRequest, UpdateVsAssignmentRequest, VsAssignmentResponse } from "@rocky/validators/api";
import { vsAssignmentResponseSchema } from "@rocky/validators/api";
import { FARM_ERRORS, FarmError } from "../errors/farm.errors.js";
import type { VsAssignmentRepository } from "../repositories/vs-assignment.repository.js";
import type { VsContractRepository } from "../repositories/vs-contract.repository.js";

export class VsAssignmentService {
  constructor(
    private readonly assignmentRepo: VsAssignmentRepository,
    private readonly contractRepo: VsContractRepository,
  ) { }

  async getById(id: string): Promise<Result<VsAssignmentResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const assignment = await this.assignmentRepo.findById(id);
      if (!assignment) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });
      return vsAssignmentResponseSchema.parse(assignment);
    }, toAppError)();
  }

  async getByFarm(farmId: string): Promise<Result<VsAssignmentResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const list = await this.assignmentRepo.findByFarm(farmId);
      return vsAssignmentResponseSchema.array().parse(list);
    }, toAppError)();
  }

  async getActiveByFarm(farmId: string): Promise<Result<VsAssignmentResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const list = await this.assignmentRepo.findActiveByFarm(farmId);
      return vsAssignmentResponseSchema.array().parse(list);
    }, toAppError)();
  }

  async getByContract(contractId: string): Promise<Result<VsAssignmentResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const list = await this.assignmentRepo.findByContract(contractId);
      return vsAssignmentResponseSchema.array().parse(list);
    }, toAppError)();
  }

  async assign(
    input: CreateVsAssignmentRequest & { createdBy?: string },
  ): Promise<Result<VsAssignmentResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // Validate the contract exists and is ACTIVE
      const contract = await this.contractRepo.findById(input.contractId);
      if (!contract) throw new FarmError(FARM_ERRORS.NOT_FOUND, { contractId: input.contractId });
      if (contract.status !== VS_CONTRACT_STATUS.ACTIVE) {
        throw new FarmError(FARM_ERRORS.INVALID_INPUT, {
          message: "Contract must be ACTIVE to create assignments",
        });
      }

      // Deactivate existing primary assignment for this farm
      if (input.isPrimary !== false) {
        await this.assignmentRepo.deactivateByFarm(input.farmId);
      }

      const assignment = await this.assignmentRepo.insert({
        contractId: input.contractId,
        farmId: input.farmId,
        startDate: input.startDate,
        endDate: input.endDate,
        isPrimary: input.isPrimary,
        notes: input.notes,
        createdBy: input.createdBy,
      });
      if (!assignment) throw new FarmError(FARM_ERRORS.INVALID_INPUT);
      return vsAssignmentResponseSchema.parse(assignment);
    }, toAppError)();
  }

  async unassign(id: string, input?: UpdateVsAssignmentRequest): Promise<Result<VsAssignmentResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.assignmentRepo.findById(id);
      if (!existing) throw new FarmError(FARM_ERRORS.NOT_FOUND, { id });

      const assignment = await this.assignmentRepo.update(id, {
        isActive: false,
        endDate: input?.endDate ?? new Date(),
        notes: input?.notes ?? existing.notes,
        updatedAt: new Date(),
      } as Parameters<typeof this.assignmentRepo.update>[1]);
      if (!assignment) throw new FarmError(FARM_ERRORS.INVALID_INPUT);
      return vsAssignmentResponseSchema.parse(assignment);
    }, toAppError)();
  }
}
