/**
 * Subject Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 */

import type {
  SubjectResponse,
  CreateSubjectRequest,
  BindSubjectToFarmRequest,
  FarmSubjectBindingResponse,
} from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { SubjectError, SUBJECT_ERRORS } from "../errors/subject.errors.js";
import { SubjectRepository } from "../repositories/subject.repository.js";

export class SubjectService {
  constructor(private readonly repo: SubjectRepository) {}

  async getById(id: string): Promise<Result<SubjectResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const subject = await this.repo.findById(id);
      if (!subject) throw new SubjectError(SUBJECT_ERRORS.NOT_FOUND, { id });
      return subject as unknown as SubjectResponse;
    }, toAppError)();
  }

  async search(query: string, limit = 20, offset = 0): Promise<Result<{ data: SubjectResponse[]; total: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.search(query, limit, offset);
      return { data: data as unknown as SubjectResponse[], total };
    }, toAppError)();
  }

  async create(input: CreateSubjectRequest & { createdBy?: string }): Promise<Result<SubjectResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const subject = await this.repo.insert(input);
      return subject as unknown as SubjectResponse;
    }, toAppError)();
  }

  async bindToFarm(input: BindSubjectToFarmRequest): Promise<Result<FarmSubjectBindingResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const binding = await this.repo.insertFarmBinding(input);
      return binding as unknown as FarmSubjectBindingResponse;
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
      return bindings as unknown as FarmSubjectBindingResponse[];
    }, toAppError)();
  }
}
