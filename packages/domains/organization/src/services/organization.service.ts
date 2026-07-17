/**
 * Organization Domain Service
 */

import type {
  OrganizationResponse,
  OrganizationSummary,
  CreateOrganizationRequest,
} from "@rocky/validators/api";
import { organizationResponseSchema, organizationSummarySchema } from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { OrgError, ORG_ERRORS } from "../errors/organization.errors.js";
import type { OrganizationRepository, OrganizationRow } from "../repositories/organization.repository.js";

export class OrganizationService {
  constructor(private readonly repo: OrganizationRepository) {}

  async getById(id: string): Promise<Result<OrganizationResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const org = await this.repo.findById(id);
      if (!org) throw new OrgError(ORG_ERRORS.NOT_FOUND, { id });
      return organizationResponseSchema.parse(org);
    }, toAppError)();
  }

  async list(): Promise<Result<OrganizationSummary[], Error>> {
    return fromAsyncThrowable(async () => {
      return organizationSummarySchema.array().parse(await this.repo.findAll());
    }, toAppError)();
  }

  async listByType(orgType: string): Promise<Result<OrganizationSummary[], Error>> {
    return fromAsyncThrowable(async () => {
      return organizationSummarySchema.array().parse(await this.repo.findByType(orgType));
    }, toAppError)();
  }

  async create(input: CreateOrganizationRequest): Promise<Result<OrganizationResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const org = await this.repo.insert(input as OrganizationRow);
      if (!org) throw new OrgError(ORG_ERRORS.INVALID_INPUT, {});
      return organizationResponseSchema.parse(org);
    }, toAppError)();
  }
}
