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
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const orgTypeParam = z.object({ orgType: z.string() });
const unwrap = createResultUnwrapper(ORG_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const organizationArraySchema = z.array(organizationSummarySchema);
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

  @Query({ output: organizationArraySchema })
  async list(): Promise<OrganizationSummary[]> {
    return unwrap(await this.orgService.list());
  }

  @Query({ input: orgTypeParam, output: organizationArraySchema })
  async listByType(@Input() input: { orgType: string }): Promise<OrganizationSummary[]> {
    return unwrap(await this.orgService.listByType(input.orgType));
  }

  @Mutation({ input: createOrganizationRequestSchema, output: organizationResponseSchema })
  async create(@Input() input: CreateOrganizationRequest, @Ctx() _ctx: AppContext): Promise<OrganizationResponse> {
    return unwrap(await this.orgService.create(input));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof organizationResponseSchema>,
  Awaited<ReturnType<OrganizationRouter["getById"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof organizationArraySchema>,
  Awaited<ReturnType<OrganizationRouter["list"]>>
>;
type _verify_listByTypeOutput = SubtypeGuillotine<
  z.output<typeof organizationArraySchema>,
  Awaited<ReturnType<OrganizationRouter["listByType"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof organizationResponseSchema>,
  Awaited<ReturnType<OrganizationRouter["create"]>>
>;

export type _OrganizationGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_listOutput,
  _verify_listByTypeOutput,
  _verify_createOutput
]>;
