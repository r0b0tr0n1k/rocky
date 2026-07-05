// --- Organization Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { OrganizationService } from "@rocky/domains-organization/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateOrganizationRequest,
  createOrganizationRequestSchema,
  type OrganizationResponse,
  type OrganizationSummary,
  organizationResponseSchema,
  organizationSummarySchema,
} from "@rocky/validators/api/index.js";
import { ORG_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const orgTypeParam = z.object({ orgType: z.string() });
const unwrap = createResultUnwrapper(ORG_TRPC_ERROR_MAP);

@Router({ alias: "organization" })
@RegisterPolicy("organization")
@Policy({ authenticated: true })
@Injectable()
export class OrganizationRouter {
  constructor(@Inject(OrganizationService) private readonly orgService: OrganizationService) {}

  @Query({ input: idParam, output: organizationResponseSchema })
  async getById(@Input() input: { id: string }): Promise<OrganizationResponse> {
    return unwrap(await this.orgService.getById(input.id));
  }

  @Query({ output: z.array(organizationSummarySchema) })
  async list(): Promise<OrganizationSummary[]> {
    return unwrap(await this.orgService.list());
  }

  @Query({ input: orgTypeParam, output: z.array(organizationSummarySchema) })
  async listByType(@Input() input: { orgType: string }): Promise<OrganizationSummary[]> {
    return unwrap(await this.orgService.listByType(input.orgType));
  }

  @Mutation({ input: createOrganizationRequestSchema, output: organizationResponseSchema })
  async create(@Input() input: CreateOrganizationRequest, @Ctx() _ctx: AppContext): Promise<OrganizationResponse> {
    return unwrap(await this.orgService.create(input));
  }
}
