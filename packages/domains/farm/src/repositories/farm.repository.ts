/**
 * Farm Repository
 *
 * @description DB access layer for farms and addresses.
 * Uses DatabaseProvider → transactional connection inside pipeline.
 */

import { eq, and, ilike, or, desc, asc, sql, type SQL } from "drizzle-orm";
import { farms as farmsTable, addresses as addressesTable, animals, inspections } from "@rocky/database";

export type FarmRow = typeof farmsTable.$inferInsert;
import { BaseRepository } from "@rocky/domains-shared";

export interface FarmFilter {
  type?: string;
  verificationStatus?: string;
  search?: string;
  sortBy?: "name" | "farmId" | "createdAt";
  sortOrder?: "asc" | "desc";
  limit: number;
  offset: number;
}

export class FarmRepository extends BaseRepository {
  async findById(id: string) {
    const [row] = await this.client.select().from(farmsTable).where(eq(farmsTable.id, id)).limit(1);
    return row ?? null;
  }

  async findByFarmId(farmId: string) {
    const [row] = await this.client.select().from(farmsTable).where(eq(farmsTable.farmId, farmId)).limit(1);
    return row ?? null;
  }

  async listFiltered(filter: FarmFilter) {
    const c: SQL<unknown>[] = [];
    if (filter.type) c.push(eq(farmsTable.type, filter.type));
    if (filter.verificationStatus) c.push(eq(farmsTable.verificationStatus, filter.verificationStatus));
    if (filter.search)
      c.push(or(ilike(farmsTable.name, `%${filter.search}%`), ilike(farmsTable.farmId, `%${filter.search}%`))!);
    const sortCol =
      filter.sortBy === "name"
        ? farmsTable.name
        : filter.sortBy === "farmId"
          ? farmsTable.farmId
          : farmsTable.createdAt;
    const orderBy = filter.sortOrder === "asc" ? asc(sortCol) : desc(sortCol);
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.client.select().from(farmsTable).where(where).orderBy(orderBy).limit(filter.limit).offset(filter.offset),
      this.client.select({ count: sql<number>`count(*)::int` }).from(farmsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async insert(data: typeof farmsTable.$inferInsert): Promise<typeof farmsTable.$inferSelect | null> {
    const [row] = await this.client.insert(farmsTable).values(data).returning();
    return row ?? null;
  }

  async update(
    id: string,
    data: Partial<typeof farmsTable.$inferInsert>,
  ): Promise<typeof farmsTable.$inferSelect | null> {
    const [row] = await this.client
      .update(farmsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(farmsTable.id, id))
      .returning();
    return row ?? null;
  }

  async findAddressById(id: string) {
    const [row] = await this.client.select().from(addressesTable).where(eq(addressesTable.id, id)).limit(1);
    return row ?? null;
  }

  async countActiveFarms(): Promise<number> {
    const [{ count }] = await this.client
      .select({ count: sql<number>`count(*)` })
      .from(farmsTable)
      .where(eq(farmsTable.isActive, true));
    return Number(count);
  }

  async getFarmsWithRiskFactors(): Promise<
    Array<{ id: string; type: string; animalCount: number; pastInspections: number }>
  > {
    return this.client
      .select({
        id: farmsTable.id,
        type: farmsTable.type,
        animalCount: sql<number>`COALESCE(count(DISTINCT ${animals.id}), 0)`,
        pastInspections: sql<number>`count(DISTINCT CASE WHEN ${inspections.status} = 'completed' THEN ${inspections.id} END)`,
      })
      .from(farmsTable)
      .leftJoin(animals, eq(animals.currentFarmId, farmsTable.id))
      .leftJoin(inspections, eq(inspections.farmId, farmsTable.id))
      .where(eq(farmsTable.isActive, true))
      .groupBy(farmsTable.id)
      .having(sql`count(${animals.id}) > 0`);
  }
}
