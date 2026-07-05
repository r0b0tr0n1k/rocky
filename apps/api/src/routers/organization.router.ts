// ── Organization Router — tRPC entry point ──

import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { createResultUnwrapper } from "@rocky/trpc";
import { ORG_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { OrganizationService } from "@rocky/domains-organization";
import {
  organizationResponseSchema,
  organizationSummarySchema,
  createOrganizationRequestSchema,
  type OrganizationResponse,
  type OrganizationSummary,
  type CreateOrganizationRequest,
} from "@rocky/validators/api";

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
