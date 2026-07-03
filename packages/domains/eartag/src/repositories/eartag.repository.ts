/**
 * EarTag Repository
 *
 * @description DB access layer for ear tags, orders, and types.
 *   Shovels, not announcers — no events, no business logic.
 */

import { eq, and, ilike, or, desc, asc, sql, type SQL } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { earTags, earTagOrders, earTagTypes } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { SORT_BY_EARTAG, SORT_ORDER } from "@rocky/database/constants";

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
  constructor(db: DB) {
    super(db);
  }

  // ─── Tags ────────────────────────────────────────────────────────

  async findById(id: string) {
    const [row] = await this.db.select().from(earTags).where(eq(earTags.id, id)).limit(1);
    return row ?? null;
  }

  async findByTag(stateCode: string, tagNumber: string) {
    const [row] = await this.db
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
      this.db.select().from(earTags).where(where).orderBy(orderBy).limit(filter.limit).offset(filter.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(earTags).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  // ─── Orders ──────────────────────────────────────────────────────

  async findOrderById(id: string) {
    const [row] = await this.db.select().from(earTagOrders).where(eq(earTagOrders.id, id)).limit(1);
    return row ?? null;
  }

  async listOrders(filter: EarTagOrderFilter) {
    const conditions: SQL<unknown>[] = [];
    if (filter.status) conditions.push(eq(earTagOrders.status, filter.status));
    if (filter.organizationId) conditions.push(eq(earTagOrders.organizationId, filter.organizationId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(earTagOrders)
        .where(where)
        .orderBy(desc(earTagOrders.orderDate))
        .limit(filter.limit ?? 20)
        .offset(filter.offset ?? 0),
      this.db.select({ count: sql<number>`count(*)::int` }).from(earTagOrders).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async updateOrderStatus(orderId: string, status: string) {
    const [row] = await this.db
      .update(earTagOrders)
      .set({ status })
      .where(eq(earTagOrders.id, orderId))
      .returning();
    return row ?? null;
  }

  // ─── Types ───────────────────────────────────────────────────────

  async findTypeById(id: string) {
    const [row] = await this.db.select().from(earTagTypes).where(eq(earTagTypes.id, id)).limit(1);
    return row ?? null;
  }

  async allTypes() {
    return this.db.select().from(earTagTypes);
  }
}
