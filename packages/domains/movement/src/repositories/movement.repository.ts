/**
 * Movement Repository
 *
 * @description DB access layer for animal movements.
 */

import { eq, and, desc, asc, sql, gte, lte, type SQL } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { movements as movementsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { SORT_BY_MOVEMENT, SORT_ORDER } from "@rocky/database/constants";

export type SortByMovement = (typeof SORT_BY_MOVEMENT)[keyof typeof SORT_BY_MOVEMENT];
export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

export interface MovementFilter {
  animalId?: string;
  fromFarmId?: string;
  toFarmId?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: SortByMovement;
  sortOrder?: SortOrder;
  limit: number;
  offset: number;
}

export class MovementRepository extends BaseRepository {
  constructor(db: DB) {
    super(db);
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(movementsTable).where(eq(movementsTable.id, id)).limit(1);
    return row ?? null;
  }

  async listFiltered(filter: MovementFilter) {
    const c: SQL<unknown>[] = [];
    if (filter.animalId) c.push(eq(movementsTable.animalId, filter.animalId));
    if (filter.fromFarmId) c.push(eq(movementsTable.fromFarmId, filter.fromFarmId));
    if (filter.toFarmId) c.push(eq(movementsTable.toFarmId, filter.toFarmId));
    if (filter.type) c.push(eq(movementsTable.type, filter.type));
    if (filter.fromDate) c.push(gte(movementsTable.movementDate, filter.fromDate));
    if (filter.toDate) c.push(lte(movementsTable.movementDate, filter.toDate));
    const sortCol =
      filter.sortBy === SORT_BY_MOVEMENT.MOVEMENT_DATE ? movementsTable.movementDate : movementsTable.createdAt;
    const orderBy = filter.sortOrder === SORT_ORDER.ASC ? asc(sortCol) : desc(sortCol);
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(movementsTable).where(where).orderBy(orderBy).limit(filter.limit).offset(filter.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(movementsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async insert(data: typeof movementsTable.$inferInsert): Promise<typeof movementsTable.$inferSelect | null> {
    const [row] = await this.db.insert(movementsTable).values(data).returning();
    return row ?? null;
  }
}
