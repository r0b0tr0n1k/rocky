// ── EarTag Router — tRPC entry point ──
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Injectable, Inject } from "@nestjs/common";
import { z } from "zod";
import { Router, Query, Mutation, Input, UseMiddlewares } from "nestjs-trpc-v2";
import { createResultUnwrapper } from "@rocky/trpc";
import { EARTAG_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware } from "../trpc/middlewares/protected.middleware.js";
import { EarTagService } from "@rocky/domains-eartag";
import {
  earTagResponseSchema,
  earTagTypeResponseSchema,
  earTagListRequestSchema,
  earTagListResponseSchema,
  orderStatusTransitionSchema,
  type EarTagResponse,
  type EarTagTypeResponse,
  type EarTagListRequest,
  type EarTagListResponse,
  type OrderStatusTransition,
} from "@rocky/validators/api";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(EARTAG_TRPC_ERROR_MAP);

@Router({ alias: "earTag" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class EarTagRouter {
  constructor(
    @Inject(EarTagService) private readonly earTagService: EarTagService,
  ) {}

  // ─── Queries ───────────────────────────────────────────────────────

  @Query({ input: idParam, output: earTagResponseSchema })
  async getById(@Input() input: { id: string }): Promise<EarTagResponse> {
    return unwrap(await this.earTagService.getById(input.id));
  }

  @Query({ input: earTagListRequestSchema, output: earTagListResponseSchema })
  async list(@Input() input: EarTagListRequest): Promise<EarTagListResponse> {
    const result = await this.earTagService.list(input);
    return unwrap(result);
  }

  @Query({
    input: z.object({ stateCode: z.string().length(3), tagNumber: z.string() }),
    output: earTagResponseSchema,
  })
  async findByNumber(
    @Input() input: { stateCode: string; tagNumber: string },
  ): Promise<EarTagResponse> {
    return unwrap(await this.earTagService.findByTag(input.stateCode, input.tagNumber));
  }

  @Query({ input: idParam, output: earTagTypeResponseSchema })
  async getType(@Input() input: { id: string }): Promise<EarTagTypeResponse> {
    return unwrap(await this.earTagService.getTypeById(input.id));
  }

  @Query({ input: z.looseObject({}), output: z.array(earTagTypeResponseSchema) })
  async listTypes(): Promise<EarTagTypeResponse[]> {
    return unwrap(await this.earTagService.listTypes());
  }

  // ─── Mutations ─────────────────────────────────────────────────────

  @Mutation({ input: orderStatusTransitionSchema, output: earTagResponseSchema })
  async transitionStatus(
    @Input() input: OrderStatusTransition,
  ): Promise<EarTagResponse> {
    const result = await this.earTagService.transitionOrderStatus(
      input.orderId,
      input.newStatus,
    );
    return unwrap(result);
  }
}
