// ── EarTag Router — tRPC entry point ──
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Injectable, Inject, Logger } from "@nestjs/common";
import { z } from "zod";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc";
import { createResultUnwrapper } from "@rocky/trpc";
import { EARTAG_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { createPermissionGuard } from "../trpc/middlewares/permission.guard.js";
import { EarTagService } from "@rocky/domains-eartag";
import {
  earTagResponseSchema,
  earTagTypeResponseSchema,
  earTagListRequestSchema,
  earTagListResponseSchema,
  orderStatusTransitionSchema,
  createOrderRequestSchema,
  cancelOrderRequestSchema,
  cancelOrderItemRequestSchema,
  appendToOrderRequestSchema,
  type EarTagResponse,
  type EarTagTypeResponse,
  type EarTagListRequest,
  type EarTagListResponse,
  type OrderStatusTransition,
  type CreateOrderRequest,
  type CancelOrderRequest,
  type CancelOrderItemRequest,
  type AppendToOrderRequest,
} from "@rocky/validators/api";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(EARTAG_TRPC_ERROR_MAP);

@Router({ alias: "earTag" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class EarTagRouter {
  private readonly logger = new Logger(EarTagRouter.name);

  constructor(
    @Inject(EarTagService) private readonly earTagService: EarTagService,
  ) { }

  // ─── Queries ───────────────────────────────────────────────────────

  @Query({ input: idParam, output: earTagResponseSchema })
  async getById(@Input() input: { id: string }): Promise<EarTagResponse> {
    this.logger.log("Fetching ear tag by ID", { id: input.id });
    const result = await this.earTagService.getById(input.id);
    if (result.isOk()) {
      this.logger.debug("Found ear tag", { id: input.id });
    }
    return unwrap(result);
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
    this.logger.log("Transitioning ear tag order status", {
      orderId: input.orderId,
      newStatus: input.newStatus,
    });
    const result = await this.earTagService.transitionOrderStatus(
      input.orderId,
      input.newStatus,
    );
    this.logger.log("Ear tag order status transitioned", {
      orderId: input.orderId,
      newStatus: input.newStatus,
      ok: result.isOk(),
    });
    return unwrap(result);
  }

  @Mutation({ input: createOrderRequestSchema, output: earTagResponseSchema })
  @UseMiddlewares(createPermissionGuard("eartag:order"))
  async createOrder(
    @Input() input: CreateOrderRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<EarTagResponse> {
    this.logger.log("Creating ear tag order", {
      organizationId: input.organizationId,
      quantity: input.quantity,
    });
    const result = await this.earTagService.createOrder({
      ...input,
    });
    this.logger.log("Ear tag order created", {
      organizationId: input.organizationId,
      ok: result.isOk(),
    });
    return unwrap(result);
  }

  @Mutation({ input: cancelOrderRequestSchema, output: earTagResponseSchema })
  async cancelOrder(
    @Input() input: CancelOrderRequest,
  ): Promise<EarTagResponse> {
    this.logger.log("Cancelling ear tag order", { orderId: input.orderId });
    const result = await this.earTagService.cancelOrder(input.orderId, input.reason);
    this.logger.log("Ear tag order cancelled", {
      orderId: input.orderId,
      ok: result.isOk(),
    });
    return unwrap(result);
  }

  @Mutation({ input: cancelOrderItemRequestSchema, output: earTagResponseSchema })
  async cancelOrderItem(
    @Input() input: CancelOrderItemRequest,
  ): Promise<EarTagResponse> {
    this.logger.log("Cancelling ear tag order item", {
      orderId: input.orderId,
      earTagId: input.earTagId,
    });
    const result = await this.earTagService.cancelOrderItem(input.orderId, input.earTagId);
    this.logger.log("Ear tag order item cancelled", {
      orderId: input.orderId,
      earTagId: input.earTagId,
      ok: result.isOk(),
    });
    return unwrap(result);
  }

  @Mutation({ input: appendToOrderRequestSchema, output: earTagResponseSchema })
  async appendToOrder(
    @Input() input: AppendToOrderRequest,
  ): Promise<EarTagResponse> {
    this.logger.log("Appending to ear tag order", {
      orderId: input.orderId,
      additionalQuantity: input.additionalQuantity,
    });
    const result = await this.earTagService.appendToOrder(input);
    this.logger.log("Ear tag order appended", {
      orderId: input.orderId,
      ok: result.isOk(),
    });
    return unwrap(result);
  }
}
