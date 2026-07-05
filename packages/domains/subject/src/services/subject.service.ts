/**
 * Subject Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 */

import type { AuditService } from "@rocky/domains-audit";
import type {
  SubjectResponse,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  BindSubjectToFarmRequest,
  FarmSubjectBindingResponse,
} from "@rocky/validators/api";
import { subjectResponseSchema, farmSubjectBindingResponseSchema } from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { SubjectError, SUBJECT_ERRORS } from "../errors/subject.errors.js";
import type { SubjectRepository } from "../repositories/subject.repository.js";

interface FarmBookServiceLike {
  create(input: { farmId: string; createdBy?: string }): Promise<any>;
}

export class SubjectService {
  constructor(
    private readonly repo: SubjectRepository,
    private readonly auditService: AuditService,
    private readonly farmBookService?: FarmBookServiceLike,
  ) {}

  async getById(id: string): Promise<Result<SubjectResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const subject = await this.repo.findById(id);
      if (!subject) throw new SubjectError(SUBJECT_ERRORS.NOT_FOUND, { id });
      return subjectResponseSchema.parse(subject);
    }, toAppError)();
  }

  async search(query: string, limit = 20, offset = 0): Promise<Result<{ data: SubjectResponse[]; total: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.search(query, limit, offset);
      return { data: subjectResponseSchema.array().parse(data), total };
    }, toAppError)();
  }

  async create(input: CreateSubjectRequest & { createdBy?: string }): Promise<Result<SubjectResponse, Error>> {
    return fromAsyncThrowable(async () => {
      if (input.personalId) {
        const existing = await this.repo.findByPersonalId(input.personalId);
        if (existing) throw new SubjectError(SUBJECT_ERRORS.DUPLICATE_PERSONAL_ID, { personalId: input.personalId });
      }
      const subject = await this.repo.insert(input);
      return subjectResponseSchema.parse(subject);
    }, toAppError)();
  }

  async update(id: string, input: UpdateSubjectRequest, updatedBy?: string): Promise<Result<SubjectResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findById(id);
      if (!existing) throw new SubjectError(SUBJECT_ERRORS.NOT_FOUND, { id });
      const subject = await this.repo.update(id, input);
      if (!subject) throw new SubjectError(SUBJECT_ERRORS.INVALID_INPUT);
      await this.auditService.recordUpdate({
        resource: "subject",
        resourceId: subject.id,
        oldValue: existing,
        newValue: subject,
        userId: updatedBy,
      });
      // Trigger farm book reprint for keeper info changes (Instance 3 Rule 4)
      if (this.farmBookService) {
        const bindings = await this.repo.findSubjectFarms(id);
        for (const b of bindings) {
          this.farmBookService.create({ farmId: b.farmId, createdBy: updatedBy }).catch(() => {});
        }
      }
      return subjectResponseSchema.parse(subject);
    }, toAppError)();
  }

  async bindToFarm(input: BindSubjectToFarmRequest): Promise<Result<FarmSubjectBindingResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const binding = await this.repo.insertFarmBinding(input);
      return farmSubjectBindingResponseSchema.parse(binding);
    }, toAppError)();
  }

  async unbindFromFarm(bindingId: string): Promise<Result<{ deleted: boolean }, Error>> {
    return fromAsyncThrowable(async () => {
      const binding = await this.repo.deleteFarmBinding(bindingId);
      if (!binding) throw new SubjectError(SUBJECT_ERRORS.BINDING_NOT_FOUND, { bindingId });
      return { deleted: true };
    }, toAppError)();
  }

  async getFarmBindings(farmId: string): Promise<Result<FarmSubjectBindingResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const bindings = await this.repo.findFarmBindings(farmId);
      return farmSubjectBindingResponseSchema.array().parse(bindings);
    }, toAppError)();
  }
}
