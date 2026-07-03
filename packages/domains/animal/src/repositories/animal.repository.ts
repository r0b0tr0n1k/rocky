/**
 * Animal Repository
 *
 * @description DB access layer for animals.
 */

import { eq, and, ilike, or, desc, asc, sql, type SQL } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { animals as animalsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { SORT_ANIMAL_BY, SORT_ORDER } from "@rocky/database/constants";

export type SortAnimalBy = (typeof SORT_ANIMAL_BY)[keyof typeof SORT_ANIMAL_BY];
export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

export interface AnimalFilter {
  farmId?: string;
  status?: string;
  sex?: string;
  breed?: string;
  search?: string;
  sortBy?: SortAnimalBy;
  sortOrder?: SortOrder;
  limit: number;
  offset: number;
}

export class AnimalRepository extends BaseRepository {
  constructor(db: DB) {
    super(db);
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(animalsTable).where(eq(animalsTable.id, id)).limit(1);
    return row ?? null;
  }

  async findByTag(earTag: string, stateCode: string) {
    const [row] = await this.db
      .select()
      .from(animalsTable)
      .where(and(eq(animalsTable.earTagNumber, earTag), eq(animalsTable.stateCode, stateCode)))
      .limit(1);
    return row ?? null;
  }

  async listFiltered(filter: AnimalFilter) {
    const c: SQL<unknown>[] = [];
    if (filter.farmId) c.push(eq(animalsTable.currentFarmId, filter.farmId));
    if (filter.status) c.push(eq(animalsTable.status, filter.status));
    if (filter.sex) c.push(eq(animalsTable.sex, filter.sex));
    if (filter.breed) c.push(eq(animalsTable.breed, filter.breed));
    if (filter.search)
      c.push(
        or(
          ilike(animalsTable.earTagNumber, `%${filter.search}%`),
          ilike(animalsTable.stateCode, `%${filter.search}%`),
        )!,
      );
    const sortCol =
      filter.sortBy === SORT_ANIMAL_BY.BIRTH_DATE
        ? animalsTable.birthDate
        : filter.sortBy === SORT_ANIMAL_BY.EAR_TAG_NUMBER
          ? animalsTable.earTagNumber
          : animalsTable.createdAt;
    const orderBy = filter.sortOrder === SORT_ORDER.ASC ? asc(sortCol) : desc(sortCol);
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(animalsTable).where(where).orderBy(orderBy).limit(filter.limit).offset(filter.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(animalsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async insert(data: typeof animalsTable.$inferInsert): Promise<typeof animalsTable.$inferSelect | null> {
    const [row] = await this.db.insert(animalsTable).values(data).returning();
    return row ?? null;
  }

  async update(
    id: string,
    data: Partial<typeof animalsTable.$inferInsert>,
  ): Promise<typeof animalsTable.$inferSelect | null> {
    const [row] = await this.db
      .update(animalsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(animalsTable.id, id))
      .returning();
    return row ?? null;
  }

  /** Used by MovementService for farm-related updates */
  async findAnimalFarm(id: string) {
    const [row] = await this.db
      .select({ id: animalsTable.id, currentFarmId: animalsTable.currentFarmId })
      .from(animalsTable)
      .where(eq(animalsTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async updateFarm(animalId: string, farmId: string) {
    await this.db
      .update(animalsTable)
      .set({ currentFarmId: farmId, updatedAt: new Date() })
      .where(eq(animalsTable.id, animalId));
  }
}
