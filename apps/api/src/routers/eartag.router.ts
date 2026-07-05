// --- EarTag Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable, Logger } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { EarTagService } from "@rocky/domains-eartag";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type AppendToOrderRequest,
  type AssignSupplierContingentRequest,
  appendToOrderRequestSchema,
  assignSupplierContingentRequestSchema,
  type CancelOrderItemRequest,
  type CancelOrderRequest,
  type CollectOrderTagsRequest,
  type CreateDuplicateOrderRequest,
  type CreateOrderRequest,
  cancelOrderItemRequestSchema,
  cancelOrderRequestSchema,
  collectOrderTagsRequestSchema,
  createDuplicateOrderRequestSchema,
  createOrderRequestSchema,
  type EarTagListRequest,
  type EarTagListResponse,
  type EarTagResponse,
  type EarTagTypeResponse,
  earTagListRequestSchema,
  earTagListResponseSchema,
  earTagResponseSchema,
  earTagTypeResponseSchema,
  type GenerateTagNumbersRequest,
  type GenerateTagNumbersResponse,
  type GetTakeoverFileRequest,
  generateTagNumbersRequestSchema,
  generateTagNumbersResponseSchema,
  getTakeoverFileRequestSchema,
  type OrderListRequest,
  type OrderStatusTransition,
  orderListRequestSchema,
  orderStatusTransitionSchema,
  type TakeoverFileResponse,
  takeoverFileResponseSchema,
} from "@rocky/validators/api/index.js";
import { EARTAG_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(EARTAG_TRPC_ERROR_MAP);

@Router({ alias: "earTag" })
@RegisterPolicy("earTag")
@Policy({ authenticated: true })
@Injectable()
export class EarTagRouter {
  private readonly logger = new Logger(EarTagRouter.name);

  constructor(@Inject(EarTagService) private readonly earTagService: EarTagService) {}

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
  async findByNumber(@Input() input: { stateCode: string; tagNumber: string }): Promise<EarTagResponse> {
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

  @Query({ input: idParam, output: earTagResponseSchema })
  async getOrderById(@Input() input: { id: string }): Promise<EarTagResponse> {
    const result = await this.earTagService.getOrderById(input.id);
    return unwrap(result);
  }

  @Query({ input: orderListRequestSchema, output: earTagListResponseSchema })
  async listOrders(@Input() input: OrderListRequest): Promise<EarTagListResponse> {
    const result = unwrap(await this.earTagService.listOrders(input));
    return { ...result, limit: input.limit ?? 20, offset: input.offset ?? 0 };
  }

  @Query({ input: generateTagNumbersRequestSchema, output: generateTagNumbersResponseSchema })
  async generateTagNumbers(@Input() input: GenerateTagNumbersRequest): Promise<GenerateTagNumbersResponse> {
    const result = await this.earTagService.generateTagNumbers(input.count, input.startFrom);
    const tags = unwrap(result);
    return { tags };
  }

  // ─── Mutations ─────────────────────────────────────────────────────

  @Mutation({ input: orderStatusTransitionSchema, output: earTagResponseSchema })
  async transitionStatus(@Input() input: OrderStatusTransition): Promise<EarTagResponse> {
    this.logger.log("Transitioning ear tag order status", {
      orderId: input.orderId,
      newStatus: input.newStatus,
    });
    const result = await this.earTagService.transitionOrderStatus(input.orderId, input.newStatus);
    this.logger.log("Ear tag order status transitioned", {
      orderId: input.orderId,
      newStatus: input.newStatus,
      ok: result.isOk(),
    });
    return unwrap(result);
  }

  @Mutation({ input: collectOrderTagsRequestSchema, output: earTagResponseSchema })
  async collectOrderTags(@Input() input: CollectOrderTagsRequest): Promise<EarTagResponse> {
    return unwrap(await this.earTagService.collectOrderTags(input.orderId, input.supplierOrganizationId));
  }

  @Mutation({ input: createDuplicateOrderRequestSchema, output: earTagResponseSchema })
  @Policy({ action: "eartag:order" })
  async createDuplicateOrder(@Input() input: CreateDuplicateOrderRequest): Promise<EarTagResponse> {
    return unwrap(await this.earTagService.createDuplicateOrder(input));
  }

  @Mutation({ input: createOrderRequestSchema, output: earTagResponseSchema })
  @Policy({ action: "eartag:order" })
  async createOrder(@Input() input: CreateOrderRequest, @Ctx() _ctx: AppContext): Promise<EarTagResponse> {
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
  async cancelOrder(@Input() input: CancelOrderRequest): Promise<EarTagResponse> {
    this.logger.log("Cancelling ear tag order", { orderId: input.orderId });
    const result = await this.earTagService.cancelOrder(input.orderId, input.reason);
    this.logger.log("Ear tag order cancelled", {
      orderId: input.orderId,
      ok: result.isOk(),
    });
    return unwrap(result);
  }

  @Mutation({ input: cancelOrderItemRequestSchema, output: earTagResponseSchema })
  async cancelOrderItem(@Input() input: CancelOrderItemRequest): Promise<EarTagResponse> {
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
  async appendToOrder(@Input() input: AppendToOrderRequest): Promise<EarTagResponse> {
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

  // ─── B.1: Supplier Contingent ──────────────────────────────────────

  @Mutation({ input: assignSupplierContingentRequestSchema, output: earTagResponseSchema })
  @Policy({ action: "eartag:supply" })
  async assignSupplierContingent(@Input() input: AssignSupplierContingentRequest): Promise<EarTagResponse> {
    this.logger.log("Assigning supplier contingent", {
      supplierOrganizationId: input.supplierOrganizationId,
      range: `${input.tagRangeStart}-${input.tagRangeEnd}`,
    });
    return unwrap(await this.earTagService.assignSupplierContingent(input));
  }

  // ─── B.2: Takeover File ────────────────────────────────────────────

  @Query({ input: getTakeoverFileRequestSchema, output: takeoverFileResponseSchema })
  async getTakeoverFile(@Input() input: GetTakeoverFileRequest): Promise<TakeoverFileResponse> {
    this.logger.log("Generating takeover file", { takeoverId: input.takeoverId });
    return unwrap(await this.earTagService.generateTakeoverFile(input));
  }
}
