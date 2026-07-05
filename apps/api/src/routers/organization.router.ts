// --- Organization Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { OrganizationService } from "@rocky/domains-organization";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  createOrganizationRequestSchema,
  organizationResponseSchema,
  organizationSummarySchema,
  type CreateOrganizationRequest,
  type OrganizationResponse,
  type OrganizationSummary,
} from "@rocky/validators/api";
import { ORG_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";

const idParam = z.object({ id: z.uuid() });
const orgTypeParam = z.object({ orgType: z.string() });
const unwrap = createResultUnwrapper(ORG_TRPC_ERROR_MAP);

@Router({ alias: "organization" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class OrganizationRouter {
  constructor(
    @Inject(OrganizationService) private readonly orgService: OrganizationService,
  ) { }

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
  async create(
    @Input() input: CreateOrganizationRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<OrganizationResponse> {
    return unwrap(
      await this.orgService.create(input),
    );
  }
}
