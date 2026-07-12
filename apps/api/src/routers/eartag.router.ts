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
  type UpdateOrderRequest,
  cancelOrderItemRequestSchema,
  cancelOrderRequestSchema,
  collectOrderTagsRequestSchema,
  createDuplicateOrderRequestSchema,
  createOrderRequestSchema,
  updateOrderRequestSchema,
  type EarTagListRequest,
  type EarTagListResponse,
  type EarTagOrderListResponse,
  type EarTagOrderResponse,
  type EarTagResponse,
  type EarTagTypeResponse,
  earTagListRequestSchema,
  earTagListResponseSchema,
  earTagOrderListResponseSchema,
  earTagOrderResponseSchema,
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
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(EARTAG_TRPC_ERROR_MAP);
const earTagTypeListSchema = z.array(earTagTypeResponseSchema);

@Router({ alias: "earTag" })
@RegisterPolicy("earTag")
@Policy({ authenticated: true })
@Injectable()
export class EarTagRouter {
  private readonly logger = new Logger(EarTagRouter.name);

  constructor(@Inject(EarTagService) private readonly earTagService: EarTagService) {}

  // --- Queries -------------------------------------------------------

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

  @Query({ input: z.looseObject({}), output: earTagTypeListSchema })
  async listTypes(): Promise<EarTagTypeResponse[]> {
    return unwrap(await this.earTagService.listTypes());
  }

  @Query({ input: idParam, output: earTagOrderResponseSchema })
  async getOrderById(@Input() input: { id: string }): Promise<EarTagOrderResponse> {
    const result = await this.earTagService.getOrderById(input.id);
    return unwrap(result);
  }

  @Query({ input: orderListRequestSchema, output: earTagOrderListResponseSchema })
  async listOrders(@Input() input: OrderListRequest): Promise<EarTagOrderListResponse> {
    const result = unwrap(await this.earTagService.listOrders(input));
    return { ...result, limit: input.limit ?? 20, offset: input.offset ?? 0 };
  }

  @Query({ input: generateTagNumbersRequestSchema, output: generateTagNumbersResponseSchema })
  async generateTagNumbers(@Input() input: GenerateTagNumbersRequest): Promise<GenerateTagNumbersResponse> {
    const result = await this.earTagService.generateTagNumbers(input.count, input.startFrom);
    const tags = unwrap(result);
    return { tags };
  }

  // --- Mutations -----------------------------------------------------

  @Mutation({ input: orderStatusTransitionSchema, output: earTagOrderResponseSchema })
  async transitionStatus(@Input() input: OrderStatusTransition): Promise<EarTagOrderResponse> {
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

  @Mutation({ input: collectOrderTagsRequestSchema, output: earTagOrderResponseSchema })
  async collectOrderTags(@Input() input: CollectOrderTagsRequest): Promise<EarTagOrderResponse> {
    return unwrap(await this.earTagService.collectOrderTags(input.orderId, input.supplierOrganizationId));
  }

  @Mutation({ input: createDuplicateOrderRequestSchema, output: earTagOrderResponseSchema })
  @Policy({ action: "eartag:order" })
  async createDuplicateOrder(@Input() input: CreateDuplicateOrderRequest): Promise<EarTagOrderResponse> {
    return unwrap(await this.earTagService.createDuplicateOrder(input));
  }

  @Mutation({ input: createOrderRequestSchema, output: earTagOrderResponseSchema })
  @Policy({ action: "eartag:order" })
  async createOrder(@Input() input: CreateOrderRequest, @Ctx() _ctx: AppContext): Promise<EarTagOrderResponse> {
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

  @Mutation({ input: updateOrderRequestSchema, output: earTagOrderResponseSchema })
  async updateOrder(@Input() input: UpdateOrderRequest): Promise<EarTagOrderResponse> {
    this.logger.log("Updating ear tag order", { orderId: input.orderId });
    const result = await this.earTagService.updateOrder(input);
    return unwrap(result);
  }

  @Mutation({ input: cancelOrderRequestSchema, output: earTagOrderResponseSchema })
  async cancelOrder(@Input() input: CancelOrderRequest): Promise<EarTagOrderResponse> {
    this.logger.log("Cancelling ear tag order", { orderId: input.orderId });
    const result = await this.earTagService.cancelOrder(input.orderId, input.reason);
    this.logger.log("Ear tag order cancelled", {
      orderId: input.orderId,
      ok: result.isOk(),
    });
    return unwrap(result);
  }

  @Mutation({ input: cancelOrderItemRequestSchema, output: earTagOrderResponseSchema })
  async cancelOrderItem(@Input() input: CancelOrderItemRequest): Promise<EarTagOrderResponse> {
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

  @Mutation({ input: appendToOrderRequestSchema, output: earTagOrderResponseSchema })
  async appendToOrder(@Input() input: AppendToOrderRequest): Promise<EarTagOrderResponse> {
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

  // --- B.1: Supplier Contingent --------------------------------------

  @Mutation({ input: assignSupplierContingentRequestSchema, output: earTagResponseSchema })
  @Policy({ action: "eartag:supply" })
  async assignSupplierContingent(@Input() input: AssignSupplierContingentRequest): Promise<EarTagResponse> {
    this.logger.log("Assigning supplier contingent", {
      supplierOrganizationId: input.supplierOrganizationId,
      range: `${input.tagRangeStart}-${input.tagRangeEnd}`,
    });
    return unwrap(await this.earTagService.assignSupplierContingent(input));
  }

  // --- B.2: Takeover File --------------------------------------------

  @Query({ input: getTakeoverFileRequestSchema, output: takeoverFileResponseSchema })
  async getTakeoverFile(@Input() input: GetTakeoverFileRequest): Promise<TakeoverFileResponse> {
    this.logger.log("Generating takeover file", { takeoverId: input.takeoverId });
    return unwrap(await this.earTagService.generateTakeoverFile(input));
  }
}

// ── Bridge 2b: thin router return (service success type) vs declared `output:` ──
type _verify_getByIdOutput = SubtypeGuillotine<z.output<typeof earTagResponseSchema>, Awaited<ReturnType<EarTagRouter["getById"]>>>;
type _verify_listOutput = SubtypeGuillotine<z.output<typeof earTagListResponseSchema>, Awaited<ReturnType<EarTagRouter["list"]>>>;
type _verify_findByNumberOutput = SubtypeGuillotine<z.output<typeof earTagResponseSchema>, Awaited<ReturnType<EarTagRouter["findByNumber"]>>>;
type _verify_getTypeOutput = SubtypeGuillotine<z.output<typeof earTagTypeResponseSchema>, Awaited<ReturnType<EarTagRouter["getType"]>>>;
type _verify_listTypesOutput = SubtypeGuillotine<z.output<typeof earTagTypeListSchema>, Awaited<ReturnType<EarTagRouter["listTypes"]>>>;
type _verify_getOrderByIdOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["getOrderById"]>>>;
type _verify_listOrdersOutput = SubtypeGuillotine<z.output<typeof earTagOrderListResponseSchema>, Awaited<ReturnType<EarTagRouter["listOrders"]>>>;
type _verify_generateTagNumbersOutput = SubtypeGuillotine<z.output<typeof generateTagNumbersResponseSchema>, Awaited<ReturnType<EarTagRouter["generateTagNumbers"]>>>;
type _verify_transitionStatusOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["transitionStatus"]>>>;
type _verify_collectOrderTagsOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["collectOrderTags"]>>>;
type _verify_createDuplicateOrderOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["createDuplicateOrder"]>>>;
type _verify_createOrderOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["createOrder"]>>>;
type _verify_cancelOrderOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["cancelOrder"]>>>;
type _verify_cancelOrderItemOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["cancelOrderItem"]>>>;
type _verify_appendToOrderOutput = SubtypeGuillotine<z.output<typeof earTagOrderResponseSchema>, Awaited<ReturnType<EarTagRouter["appendToOrder"]>>>;
type _verify_assignSupplierContingentOutput = SubtypeGuillotine<z.output<typeof earTagResponseSchema>, Awaited<ReturnType<EarTagRouter["assignSupplierContingent"]>>>;
type _verify_getTakeoverFileOutput = SubtypeGuillotine<z.output<typeof takeoverFileResponseSchema>, Awaited<ReturnType<EarTagRouter["getTakeoverFile"]>>>;

export type _EarTagGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput, _verify_listOutput, _verify_findByNumberOutput, _verify_getTypeOutput,
  _verify_listTypesOutput, _verify_getOrderByIdOutput, _verify_listOrdersOutput,
  _verify_generateTagNumbersOutput, _verify_transitionStatusOutput, _verify_collectOrderTagsOutput,
  _verify_createDuplicateOrderOutput, _verify_createOrderOutput, _verify_cancelOrderOutput,
  _verify_cancelOrderItemOutput, _verify_appendToOrderOutput, _verify_assignSupplierContingentOutput,
  _verify_getTakeoverFileOutput
]>;
