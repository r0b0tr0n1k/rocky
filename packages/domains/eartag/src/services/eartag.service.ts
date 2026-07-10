/**
 * EarTag Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 * No direct DB access — all queries go through EarTagRepository.
 */

import { ANIMAL_STATUS, EAR_TAG_ORDER_STATUS, FARM_TYPE } from "@rocky/database/constants";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type {
  AssignSupplierContingentRequest,
  EarTagListRequest,
  EarTagListResponse,
  EarTagResponse,
  EarTagOrderResponse,
  EarTagTypeResponse,
  GetTakeoverFileRequest,
  TakeoverFileResponse,
} from "@rocky/validators/api";
import { earTagOrderResponseSchema, earTagResponseSchema, earTagTypeResponseSchema, takeoverFileResponseSchema } from "@rocky/validators/api";
import { EARTAG_ERRORS, EarTagError } from "../errors/eartag.errors.js";
import type { SystemService } from "@rocky/domains-system";
import type { EarTagRepository } from "../repositories/eartag.repository.js";

// ── Status State Machine ──────────────────────────────────────────
const ORDER_STATUS_TRANSITIONS: Record<string, Set<string>> = {
  [EAR_TAG_ORDER_STATUS.DRAFT]: new Set([EAR_TAG_ORDER_STATUS.PENDING, EAR_TAG_ORDER_STATUS.CANCELLED]),
  [EAR_TAG_ORDER_STATUS.PENDING]: new Set([
    EAR_TAG_ORDER_STATUS.APPROVED,
    EAR_TAG_ORDER_STATUS.REJECTED,
    EAR_TAG_ORDER_STATUS.CANCELLED,
  ]),
  [EAR_TAG_ORDER_STATUS.APPROVED]: new Set([EAR_TAG_ORDER_STATUS.ORDERED, EAR_TAG_ORDER_STATUS.CANCELLED]),
  [EAR_TAG_ORDER_STATUS.REJECTED]: new Set([EAR_TAG_ORDER_STATUS.DRAFT]),
  [EAR_TAG_ORDER_STATUS.ORDERED]: new Set([
    EAR_TAG_ORDER_STATUS.PARTIALLY_RECEIVED,
    EAR_TAG_ORDER_STATUS.RECEIVED,
    EAR_TAG_ORDER_STATUS.CANCELLED,
  ]),
  [EAR_TAG_ORDER_STATUS.PARTIALLY_RECEIVED]: new Set([EAR_TAG_ORDER_STATUS.RECEIVED, EAR_TAG_ORDER_STATUS.CANCELLED]),
  [EAR_TAG_ORDER_STATUS.RECEIVED]: new Set([]),
  [EAR_TAG_ORDER_STATUS.CANCELLED]: new Set([]),
};

const INVALID_TRANSITION = (from: string, to: string) =>
  new EarTagError(EARTAG_ERRORS.INVALID_STATUS_TRANSITION, { from, to });


function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export class EarTagService {
  constructor(private readonly repo: EarTagRepository, private readonly system: SystemService) {}

  async getById(id: string): Promise<Result<EarTagResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const tag = await this.repo.findById(id);
      if (!tag) throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, { type: "earTag", id });
      return earTagResponseSchema.parse(tag);
    }, toAppError)();
  }

  async list(input: EarTagListRequest): Promise<Result<EarTagListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listFiltered(input);
      return {
        data: earTagResponseSchema.array().parse(data),
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }, toAppError)();
  }

  async findByTag(stateCode: string, tagNumber: string): Promise<Result<EarTagResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const tag = await this.repo.findByTag(stateCode, tagNumber);
      if (!tag)
        throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, {
          type: "earTag",
          stateCode,
          tagNumber,
        });
      return earTagResponseSchema.parse(tag);
    }, toAppError)();
  }

  async getOrderById(id: string): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.findOrderById(id);
      if (!order) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { id });
      return earTagOrderResponseSchema.parse(order);
    }, toAppError)();
  }

  async listOrders(input: {
    status?: string;
    organizationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Result<{ data: EarTagOrderResponse[]; total: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listOrders(input);
      return { data: earTagOrderResponseSchema.array().parse(data), total };
    }, toAppError)();
  }

  async getTypeById(id: string): Promise<Result<EarTagTypeResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const type = await this.repo.findTypeById(id);
      if (!type)
        throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, {
          type: "earTagType",
          id,
        });
      return earTagTypeResponseSchema.parse(type);
    }, toAppError)();
  }

  async listTypes(): Promise<Result<EarTagTypeResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const types = await this.repo.allTypes();
      return earTagTypeResponseSchema.array().parse(types);
    }, toAppError)();
  }

  async createOrder(input: {
    organizationId: string;
    supplierOrganizationId: string;
    supplierName: string;
    quantity: number;
    farmId?: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // Rule D.1: Idempotency — reject duplicate orders within 24h
      const recentDuplicate = await this.repo.findRecentDuplicateOrder({
        organizationId: input.organizationId,
        supplierOrganizationId: input.supplierOrganizationId,
      });
      if (recentDuplicate) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Duplicate order detected — an order with this supplier was placed within the last 24 hours",
          recentOrderId: recentDuplicate.id,
          recentOrderDate: recentDuplicate.orderDate,
        });
      }

      // Rule: farm must exist, be active, and allow ordering
      if (input.farmId) {
        const farm = await this.repo.findFarmById(input.farmId);
        if (!farm)
          throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
            message: "Farm not found",
            farmId: input.farmId,
          });
        if (!farm.isActive)
          throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
            message: "Farm is inactive",
            farmId: input.farmId,
          });
        if (farm.type === FARM_TYPE.SLAUGHTERHOUSE)
          throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
            message: "Cannot order ear tags for slaughterhouse",
            farmId: input.farmId,
          });

        // Rule: max quantity = female animals - remaining tags
        const [femaleCount, remainingCount] = await Promise.all([
          this.repo.countFemaleAnimalsOnFarm(input.farmId),
          this.repo.countRemainingEarTagsOnFarm(input.farmId),
        ]);
        const maxQuantity = Math.max(0, femaleCount - remainingCount);
        if (input.quantity > maxQuantity) {
          throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
            message: `Max ${maxQuantity} ear tags allowed (${femaleCount} females - ${remainingCount} remaining)`,
            requested: input.quantity,
            maxQuantity,
            femaleCount,
            remainingCount,
          });
        }
      }

      const ruleSet = await this.system.getRuleSet();
      if (ruleSet.isErr()) throw ruleSet.error;
      const { thresholds } = ruleSet.value;

      // Rule: max 4 orders per year per organization
      const yearlyCount = await this.repo.countOrdersInYear(input.organizationId, new Date().getFullYear());
      if (yearlyCount >= thresholds.maxOrdersPerYear) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: `Max ${thresholds.maxOrdersPerYear} orders per year reached`,
          organizationId: input.organizationId,
        });
      }

      // Rule: 120-day gap since last order
      const lastOrder = await this.repo.lastOrderByOrganization(input.organizationId);
      if (lastOrder) {
        const daysSince = daysBetween(new Date(lastOrder.orderDate), new Date());
        if (daysSince < thresholds.orderIntervalDays) {
          throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
            message: `Must wait ${thresholds.orderIntervalDays - daysSince} more days before next order`,
            daysSince,
            requiredGap: thresholds.orderIntervalDays,
          });
        }
      }

      const order = await this.repo.createOrder({
        organizationId: input.organizationId,
        supplierOrganizationId: input.supplierOrganizationId,
        supplierName: input.supplierName,
        totalQuantity: input.quantity,
        description: input.description,
        status: EAR_TAG_ORDER_STATUS.DRAFT,
      });

      return earTagOrderResponseSchema.parse(order);
    }, toAppError)();
  }

  // ── Rule D: Duplicate Order for Specific Animals ─────────────────

  /**
   * D.1-D.5: Create a duplicate ear tag order for a specific animal.
   * - D.1: Idempotency — same (animalId, farmId) not entered twice within 24h
   * - D.2: Animal must be alive
   * - D.3: Animal must belong to the specified farm
   * - D.4: User must have farm permissions (enforced via RLS + @Policy decorator)
   * - D.5: Farm must be valid (not slaughterhouse/fictitious)
   */
  async createDuplicateOrder(input: {
    animalId: string;
    farmId: string;
    organizationId: string;
    supplierOrganizationId: string;
    supplierName: string;
    description?: string;
  }): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // D.2: Animal must be alive
      const animal = await this.repo.findAnimalById(input.animalId);
      if (!animal)
        throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Cannot order duplicate ear tag for a non-alive animal",
          animalId: input.animalId,
          status: animal.status,
        });
      }

      // D.3: Animal must belong to the specified farm
      if (animal.currentFarmId !== input.farmId) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Animal does not belong to the specified farm",
          animalId: input.animalId,
          animalFarmId: animal.currentFarmId,
          specifiedFarmId: input.farmId,
        });
      }

      // D.5: Farm must be valid (not slaughterhouse)
      const farm = await this.repo.findFarmById(input.farmId);
      if (!farm)
        throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, {
          farmId: input.farmId,
        });
      if (!farm.isActive)
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Farm is inactive",
          farmId: input.farmId,
        });
      if (farm.type === FARM_TYPE.SLAUGHTERHOUSE || farm.type === FARM_TYPE.QUARANTINE) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Cannot order duplicate ear tag for this farm type",
          farmId: input.farmId,
          farmType: farm.type,
        });
      }

      // D.1: Idempotency — check for recent duplicate order
      const recentDuplicate = await this.repo.findRecentDuplicateOrder({
        organizationId: input.organizationId,
        supplierOrganizationId: input.supplierOrganizationId,
      });
      if (recentDuplicate) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Duplicate order detected — a recent order with this supplier already exists",
          recentOrderId: recentDuplicate.id,
        });
      }

      const order = await this.repo.createOrder({
        organizationId: input.organizationId,
        supplierOrganizationId: input.supplierOrganizationId,
        supplierName: input.supplierName,
        totalQuantity: 1,
        description: input.description ?? `Duplicate ear tag for animal ${input.animalId}`,
        status: EAR_TAG_ORDER_STATUS.DRAFT,
      });

      return earTagOrderResponseSchema.parse(order);
    }, toAppError)();
  }

  async transitionOrderStatus(orderId: string, newStatus: string): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.findOrderById(orderId);
      if (!order) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });

      const allowed = ORDER_STATUS_TRANSITIONS[order.status];
      if (!allowed?.has(newStatus)) {
        throw INVALID_TRANSITION(order.status, newStatus);
      }

      const updated = await this.repo.updateOrderStatus(orderId, newStatus);
      if (!updated) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });
      return earTagOrderResponseSchema.parse(updated);
    }, toAppError)();
  }

  async collectOrderTags(orderId: string, supplierOrgId: string): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.findOrderById(orderId);
      if (!order) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });
      if (order.status !== EAR_TAG_ORDER_STATUS.APPROVED)
        throw INVALID_TRANSITION(order.status, EAR_TAG_ORDER_STATUS.ORDERED);
      if (order.supplierOrganizationId !== supplierOrgId)
        throw new EarTagError(EARTAG_ERRORS.FORBIDDEN, {
          message: "Order belongs to another supplier",
        });

      const available = await this.repo.findAvailableEarTags(order.totalQuantity);
      if (available.length < order.totalQuantity) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: `Only ${available.length} tags available, need ${order.totalQuantity}`,
          available: available.length,
          required: order.totalQuantity,
        });
      }

      const tagIds = available.map((tag: { id: string }) => tag.id);
      await this.repo.assignTagsToOrder(tagIds, orderId);
      const updated = await this.repo.updateOrderStatus(orderId, EAR_TAG_ORDER_STATUS.ORDERED);
      if (!updated) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });
      return earTagOrderResponseSchema.parse(updated);
    }, toAppError)();
  }

  // ── Rule H: Cancellation ──────────────────────────────────────────

  /**
   * H.1+H.2: Cancel an entire order.
   * - Only order creator or VD role can cancel (auth enforced at router level)
   * - Order must not be in RECEIVED or CANCELLED state
   * - If supplier has already collected (ORDERED/PARTIALLY_RECEIVED), cannot cancel
   */
  async cancelOrder(orderId: string, _reason?: string): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.findOrderById(orderId);
      if (!order) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });

      // H.2: Cannot cancel if already received or cancelled
      if (order.status === EAR_TAG_ORDER_STATUS.RECEIVED || order.status === EAR_TAG_ORDER_STATUS.CANCELLED) {
        throw INVALID_TRANSITION(order.status, EAR_TAG_ORDER_STATUS.CANCELLED);
      }

      // H.2: Cannot cancel after supplier has collected (ORDERED or PARTIALLY_RECEIVED)
      if (order.status === EAR_TAG_ORDER_STATUS.ORDERED || order.status === EAR_TAG_ORDER_STATUS.PARTIALLY_RECEIVED) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Cannot cancel order after supplier has collected tags",
          status: order.status,
        });
      }

      const updated = await this.repo.updateOrderStatus(orderId, EAR_TAG_ORDER_STATUS.CANCELLED);
      if (!updated) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });
      return earTagOrderResponseSchema.parse(updated);
    }, toAppError)();
  }

  /**
   * H.3: Cancel an individual ear tag within an order.
   * Only works on DRAFT or PENDING orders.
   * Removes the tag from the order's allocation.
   */
  async cancelOrderItem(orderId: string, earTagId: string): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.findOrderById(orderId);
      if (!order) throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, { orderId });

      // Only cancellable in early stages
      if (order.status !== EAR_TAG_ORDER_STATUS.DRAFT && order.status !== EAR_TAG_ORDER_STATUS.PENDING) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Item cancellation only allowed in DRAFT or PENDING status",
          status: order.status,
        });
      }

      await this.repo.removeTagFromOrder(earTagId);
      return earTagOrderResponseSchema.parse(order);
    }, toAppError)();
  }

  // ── Rule F: Append to Existing Order ────────────────────────────

  /**
   * F.1-F.3: Append quantity to an existing order.
   * - F.1: Only order owner (same organization) can append
   * - F.2: Order must be DRAFT or PENDING status
   * - F.3: Standard rules apply (quantity + interval checks)
   */
  async appendToOrder(input: {
    orderId: string;
    organizationId: string;
    additionalQuantity: number;
  }): Promise<Result<EarTagOrderResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const order = await this.repo.findOrderById(input.orderId);
      if (!order)
        throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, {
          orderId: input.orderId,
        });

      // F.1: Only order owner can append
      if (order.organizationId !== input.organizationId) {
        throw new EarTagError(EARTAG_ERRORS.FORBIDDEN, {
          message: "Only the order owner can append to an order",
          orderId: input.orderId,
        });
      }

      // F.2: Order must be DRAFT or PENDING
      if (order.status !== EAR_TAG_ORDER_STATUS.DRAFT && order.status !== EAR_TAG_ORDER_STATUS.PENDING) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Can only append to orders in DRAFT or PENDING status",
          orderId: input.orderId,
          status: order.status,
        });
      }

      const updated = await this.repo.updateOrderQuantity(input.orderId, input.additionalQuantity);
      if (!updated)
        throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, {
          orderId: input.orderId,
        });
      return earTagOrderResponseSchema.parse(updated);
    }, toAppError)();
  }

  // ── Rule A.3: Tag Number Generation ──────────────────────────────

  /**
   * Generate a batch of sequential ear tag numbers starting from a given base.
   * Uses calculateEarTagCheckDigit() for the 8th digit.
   */
  async generateTagNumbers(count: number, startFrom = 10000001): Promise<Result<string[], Error>> {
    return fromAsyncThrowable(async () => {
      const { calculateEarTagCheckDigit } = await import("@rocky/validators/utils/check-digit");
      const tags: string[] = [];
      for (let i = 0; i < count; i++) {
        const base = String(startFrom + i).padStart(7, "0");
        const checkDigit = calculateEarTagCheckDigit(base);
        tags.push(`${base}${checkDigit}`);
      }
      return tags;
    }, toAppError)();
  }

  // ── Rule B.1: Supplier Contingents ──────────────────────────────

  /**
   * B.1: Assign a tag block to a supplier (create contingent allocation).
   * Validates range does not overlap with existing contingent blocks.
   */
  async assignSupplierContingent(input: AssignSupplierContingentRequest): Promise<Result<EarTagResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findContingentAllocationByRange(input.tagRangeStart, input.tagRangeEnd);
      if (existing) {
        throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
          message: "Tag range overlaps with existing contingent allocation",
          existingAllocationId: existing.id,
          existingRange: `${existing.tagRangeStart}-${existing.tagRangeEnd}`,
        });
      }

      const allocation = await this.repo.createContingentAllocation({
        farmId: input.farmId,
        typeId: input.typeId,
        tagRangeStart: input.tagRangeStart,
        tagRangeEnd: input.tagRangeEnd,
        quantity: input.quantity,
        contingentType: input.contingentType,
        allocationNumber: `CNT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        allocationDate: new Date().toISOString().split("T")[0]!,
      });

      return earTagResponseSchema.parse(allocation);
    }, toAppError)();
  }

  // ── Rule B.2: Takeover File Generation ──────────────────────────

  /**
   * B.2: Generate and store the flat file (.txt) for a takeover.
   * The file lists each tag number in the order, one per line.
   * Format: <state_code><tag_number> (8 digits per line)
   */
  async generateTakeoverFile(input: GetTakeoverFileRequest): Promise<Result<TakeoverFileResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const takeover = await this.repo.findTakeoverById(input.takeoverId);
      if (!takeover)
        throw new EarTagError(EARTAG_ERRORS.NOT_FOUND, {
          type: "takeover",
          id: input.takeoverId,
        });

      const order = await this.repo.findOrderById(takeover.orderId);
      if (!order)
        throw new EarTagError(EARTAG_ERRORS.ORDER_NOT_FOUND, {
          orderId: takeover.orderId,
        });

      const stateCode = "MK";
      const { getCheckDigitProvider } = await import("@rocky/validators/utils/check-digit");
      const provider = getCheckDigitProvider(); // ADR-0030 §B: active provider, never a private formula
      const assignedTags = await this.repo.findEarTagsByOrderId(order.id);
      const fileContent = assignedTags
        .map((t) => {
          if (!provider.validate(t.tagNumber)) {
            throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
              message: "Assigned ear tag failed check-digit validation",
              tagNumber: t.tagNumber,
            });
          }
          return `${stateCode}${t.tagNumber}`;
        })
        .join("\n");

      const fileName = `takeover_${takeover.id.slice(0, 8)}.txt`;

      await this.repo.updateTakeoverFile(input.takeoverId, fileName, fileContent);

      return takeoverFileResponseSchema.parse({
        takeoverId: takeover.id,
        orderId: takeover.orderId,
        supplierOrganizationId: takeover.supplierOrganizationId,
        fileName,
        content: fileContent,
        lineCount: assignedTags.length,
      });
    }, toAppError)();
  }
}
