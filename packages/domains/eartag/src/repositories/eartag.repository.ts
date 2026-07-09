/**
 * EarTag Repository
 *
 * @description DB access layer for ear tags, orders, and types.
 *   Shovels, not announcers — no events, no business logic.
 */

import {
  animals,
  earTagAllocations,
  earTagOrders,
  earTags,
  earTagTakeovers,
  earTagTypes,
  farms,
} from "@rocky/database";
import {
  ANIMAL_STATUS,
  EAR_TAG_ORDER_STATUS,
  EAR_TAG_STATUS,
  SEX,
  SORT_BY_EARTAG,
  SORT_ORDER
} from "@rocky/database/constants";
import { BaseRepository } from "@rocky/domains-shared";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, type SQL, sql } from "drizzle-orm";

export type SortByEartag = (typeof SORT_BY_EARTAG)[keyof typeof SORT_BY_EARTAG];
export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

// ── Filter types ────────────────────────────────────────────────────

export interface EarTagFilter {
  status?: string;
  typeId?: string;
  stateCode?: string;
  orderId?: string;
  allocationId?: string;
  animalId?: string;
  search?: string;
  sortBy?: SortByEartag;
  sortOrder?: SortOrder;
  limit: number;
  offset: number;
}

export interface EarTagOrderFilter {
  status?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
}

// ── Repository ──────────────────────────────────────────────────────

export class EarTagRepository extends BaseRepository {

  // ─── Tags ────────────────────────────────────────────────────────

  async findById(id: string) {
    const [row] = await this.client.select().from(earTags).where(eq(earTags.id, id)).limit(1);
    return row ?? null;
  }

  async findByTag(stateCode: string, tagNumber: string) {
    const [row] = await this.client
      .select()
      .from(earTags)
      .where(and(eq(earTags.stateCode, stateCode), eq(earTags.tagNumber, tagNumber)))
      .limit(1);
    return row ?? null;
  }

  async listFiltered(filter: EarTagFilter) {
    const conditions: SQL<unknown>[] = [];
    if (filter.status) conditions.push(eq(earTags.status, filter.status));
    if (filter.typeId) conditions.push(eq(earTags.typeId, filter.typeId));
    if (filter.stateCode) conditions.push(eq(earTags.stateCode, filter.stateCode));
    if (filter.orderId) conditions.push(eq(earTags.orderId, filter.orderId));
    if (filter.allocationId) conditions.push(eq(earTags.allocationId, filter.allocationId));
    if (filter.animalId) conditions.push(eq(earTags.animalId, filter.animalId));
    if (filter.search) {
      conditions.push(
        or(ilike(earTags.tagNumber, `%${filter.search}%`), ilike(earTags.stateCode, `%${filter.search}%`))!,
      );
    }

    const sortCol =
      filter.sortBy === SORT_BY_EARTAG.APPLIED_DATE
        ? earTags.appliedDate
        : filter.sortBy === SORT_BY_EARTAG.MANUFACTURE_DATE
          ? earTags.manufactureDate
          : earTags.createdAt;
    const orderBy = filter.sortOrder === SORT_ORDER.ASC ? asc(sortCol) : desc(sortCol);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client.select().from(earTags).where(where).orderBy(orderBy).limit(filter.limit).offset(filter.offset),
      this.client.select({ count: sql<number>`count(*)::int` }).from(earTags).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  // ─── Orders ──────────────────────────────────────────────────────

  async findOrderById(id: string) {
    const [row] = await this.client.select().from(earTagOrders).where(eq(earTagOrders.id, id)).limit(1);
    return row ?? null;
  }

  async listOrders(filter: EarTagOrderFilter) {
    const conditions: SQL<unknown>[] = [];
    if (filter.status) conditions.push(eq(earTagOrders.status, filter.status));
    if (filter.organizationId) conditions.push(eq(earTagOrders.organizationId, filter.organizationId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(earTagOrders)
        .where(where)
        .orderBy(desc(earTagOrders.orderDate))
        .limit(filter.limit ?? 20)
        .offset(filter.offset ?? 0),
      this.client.select({ count: sql<number>`count(*)::int` }).from(earTagOrders).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async updateOrderStatus(orderId: string, status: string) {
    const [row] = await this.client
      .update(earTagOrders)
      .set({ status })
      .where(eq(earTagOrders.id, orderId))
      .returning();
    return row ?? null;
  }

  async createOrder(input: {
    organizationId: string;
    supplierOrganizationId: string;
    supplierName: string;
    totalQuantity: number;
    description?: string;
    status: string;
  }) {
    const now = new Date();
    const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    const [row] = await this.client
      .insert(earTagOrders)
      .values({
        orderNumber,
        organizationId: input.organizationId,
        supplierOrganizationId: input.supplierOrganizationId,
        supplierName: input.supplierName,
        totalQuantity: input.totalQuantity,
        items: JSON.stringify({ description: input.description ?? null }),
        status: input.status,
        orderDate: now.toISOString().split("T")[0]!,
      })
      .returning();
    return row ?? null;
  }

  async findFarmById(id: string) {
    const [row] = await this.client.select().from(farms).where(eq(farms.id, id)).limit(1);
    return row ?? null;
  }

  async findAnimalById(id: string) {
    const [row] = await this.client
      .select({ id: animals.id, status: animals.status, currentFarmId: animals.currentFarmId })
      .from(animals)
      .where(eq(animals.id, id))
      .limit(1);
    return row ?? null;
  }

  async countFemaleAnimalsOnFarm(farmId: string): Promise<number> {
    const [row] = await this.client
      .select({ count: sql<number>`count(*)::int` })
      .from(animals)
      .where(
        and(
          eq(animals.currentFarmId, farmId),
          eq(animals.sex, SEX.FEMALE as string),
          eq(animals.status, ANIMAL_STATUS.ALIVE as string),
          eq(animals.isActive, true),
        ),
      );
    return row?.count ?? 0;
  }

  async countRemainingEarTagsOnFarm(farmId: string): Promise<number> {
    const [row] = await this.client
      .select({ count: sql<number>`count(*)::int` })
      .from(earTags)
      .innerJoin(earTagAllocations, eq(earTags.allocationId, earTagAllocations.id))
      .where(and(eq(earTagAllocations.farmId, farmId), eq(earTags.status, EAR_TAG_STATUS.AVAILABLE as string)));
    return row?.count ?? 0;
  }

  async countOrdersInYear(organizationId: string, year: number): Promise<number> {
    const start = new Date(year, 0, 1).toISOString();
    const end = new Date(year + 1, 0, 1).toISOString();
    const [row] = await this.client
      .select({ count: sql<number>`count(*)::int` })
      .from(earTagOrders)
      .where(
        and(
          eq(earTagOrders.organizationId, organizationId),
          gte(earTagOrders.orderDate, start),
          lte(earTagOrders.orderDate, end),
          sql`${earTagOrders.status} != ${EAR_TAG_ORDER_STATUS.CANCELLED}`,
        ),
      );
    return row?.count ?? 0;
  }

  async lastOrderByOrganization(organizationId: string) {
    const [row] = await this.client
      .select()
      .from(earTagOrders)
      .where(
        and(
          eq(earTagOrders.organizationId, organizationId),
          sql`${earTagOrders.status} != ${EAR_TAG_ORDER_STATUS.CANCELLED}`,
        ),
      )
      .orderBy(desc(earTagOrders.orderDate))
      .limit(1);
    return row ?? null;
  }

  async findRecentDuplicateOrder(input: {
    organizationId: string;
    supplierOrganizationId: string;
    withinHours?: number;
  }) {
    const hours = input.withinHours ?? 24;
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    const [row] = await this.client
      .select()
      .from(earTagOrders)
      .where(
        and(
          eq(earTagOrders.organizationId, input.organizationId),
          eq(earTagOrders.supplierOrganizationId, input.supplierOrganizationId),
          gte(earTagOrders.createdAt, cutoff),
        ),
      )
      .orderBy(desc(earTagOrders.createdAt))
      .limit(1);
    return row ?? null;
  }

  async updateOrderQuantity(orderId: string, additionalQuantity: number) {
    const [row] = await this.client
      .update(earTagOrders)
      .set({ totalQuantity: sql`${earTagOrders.totalQuantity} + ${additionalQuantity}` })
      .where(eq(earTagOrders.id, orderId))
      .returning();
    return row ?? null;
  }

  async findAvailableEarTags(limit: number) {
    return this.client
      .select()
      .from(earTags)
      .where(eq(earTags.status, EAR_TAG_STATUS.AVAILABLE as string))
      .orderBy(asc(earTags.tagNumber))
      .limit(limit);
  }

  async assignTagsToOrder(tagIds: string[], orderId: string) {
    await this.client
      .update(earTags)
      .set({ orderId, status: EAR_TAG_STATUS.ORDERED as string })
      .where(inArray(earTags.id, tagIds));
  }

  async removeTagFromOrder(earTagId: string) {
    await this.client
      .update(earTags)
      .set({ orderId: null, status: EAR_TAG_STATUS.AVAILABLE as string })
      .where(eq(earTags.id, earTagId));
  }

  /** Real assigned tags for an order (set by collectOrderTags → assignTagsToOrder). WO-001: takeover file emits these, never synthetic numbers. */
  async findEarTagsByOrderId(orderId: string): Promise<Array<{ tagNumber: string }>> {
    return this.client
      .select({ tagNumber: earTags.tagNumber })
      .from(earTags)
      .where(eq(earTags.orderId, orderId))
      .orderBy(asc(earTags.tagNumber));
  }

  // ─── Types ───────────────────────────────────────────────────────

  async findTypeById(id: string) {
    const [row] = await this.client.select().from(earTagTypes).where(eq(earTagTypes.id, id)).limit(1);
    return row ?? null;
  }

  async allTypes() {
    return this.client.select().from(earTagTypes);
  }

  // ─── Supplier Contingents (B.1) ─────────────────────────────────

  async createContingentAllocation(input: {
    farmId: string;
    typeId: string;
    tagRangeStart: string;
    tagRangeEnd: string;
    quantity: number;
    contingentType: string;
    allocationNumber: string;
    allocationDate: string;
    notes?: string;
  }) {
    const [row] = await this.client
      .insert(earTagAllocations)
      .values({
        farmId: input.farmId,
        typeId: input.typeId,
        tagRangeStart: input.tagRangeStart,
        tagRangeEnd: input.tagRangeEnd,
        quantity: input.quantity,
        contingentType: input.contingentType,
        allocationNumber: input.allocationNumber,
        allocationDate: input.allocationDate,
        notes: input.notes,
      })
      .returning();
    return row ?? null;
  }

  async findContingentAllocationByRange(tagRangeStart: string, tagRangeEnd: string) {
    const [row] = await this.client
      .select()
      .from(earTagAllocations)
      .where(
        and(
          sql`${earTagAllocations.tagRangeStart} <= ${tagRangeEnd}`,
          sql`${earTagAllocations.tagRangeEnd} >= ${tagRangeStart}`,
          sql`${earTagAllocations.contingentType} IS NOT NULL`,
        ),
      )
      .limit(1);
    return row ?? null;
  }

  // ─── Takeover Files (B.2) ───────────────────────────────────────

  async findTakeoverById(id: string) {
    const [row] = await this.client.select().from(earTagTakeovers).where(eq(earTagTakeovers.id, id)).limit(1);
    return row ?? null;
  }

  async updateTakeoverFile(takeoverId: string, exportedFileName: string, fileContent: string) {
    const [row] = await this.client
      .update(earTagTakeovers)
      .set({ exportedFileName, fileContent })
      .where(eq(earTagTakeovers.id, takeoverId))
      .returning();
    return row ?? null;
  }
}
