/**
 * Organization Domain Service
 */

import type { OrganizationResponse, OrganizationSummary, CreateOrganizationRequest } from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { OrgError, ORG_ERRORS } from "../errors/organization.errors.js";
import { OrganizationRepository } from "../repositories/organization.repository.js";

export class OrganizationService {
  constructor(private readonly repo: OrganizationRepository) {}

  async getById(id: string): Promise<Result<OrganizationResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const org = await this.repo.findById(id);
      if (!org) throw new OrgError(ORG_ERRORS.NOT_FOUND, { id });
      return org as unknown as OrganizationResponse;
    }, toAppError)();
  }

  async list(): Promise<Result<OrganizationSummary[], Error>> {
    return fromAsyncThrowable(async () => {
      return (await this.repo.findAll()) as unknown as OrganizationSummary[];
    }, toAppError)();
  }

  async listByType(orgType: string): Promise<Result<OrganizationSummary[], Error>> {
    return fromAsyncThrowable(async () => {
      return (await this.repo.findByType(orgType)) as unknown as OrganizationSummary[];
    }, toAppError)();
  }

  async create(input: CreateOrganizationRequest & { createdBy?: string }): Promise<Result<OrganizationResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const org = await this.repo.insert(input);
      return org as unknown as OrganizationResponse;
    }, toAppError)();
  }
}
