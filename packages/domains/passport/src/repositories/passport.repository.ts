/**
 * Passport Repository
 *
 * @description DB access layer for cattle passports.
 */

import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { cattlePassports as cattlePassportsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class PassportRepository extends BaseRepository {
  constructor(db: DB) {
    super(db);
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(cattlePassportsTable)
      .where(eq(cattlePassportsTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByAnimalId(animalId: string) {
    const [row] = await this.db
      .select()
      .from(cattlePassportsTable)
      .where(
        and(
          eq(cattlePassportsTable.animalId, animalId),
          eq(cattlePassportsTable.isActive, true),
        ),
      )
      .orderBy(desc(cattlePassportsTable.createdAt))
      .limit(1);
    return row ?? null;
  }

  async findByFarmId(
    farmId: string,
    opts: { limit: number; offset: number; status?: string },
  ) {
    const c: SQL<unknown>[] = [eq(cattlePassportsTable.farmId, farmId), eq(cattlePassportsTable.isActive, true)];
    if (opts.status) c.push(eq(cattlePassportsTable.status, opts.status));
    const where = and(...c);
    const [data, totalResult] = await Promise.all([
      this.db.select().from(cattlePassportsTable).where(where).orderBy(desc(cattlePassportsTable.createdAt)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(cattlePassportsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async create(data: typeof cattlePassportsTable.$inferInsert) {
    const [row] = await this.db.insert(cattlePassportsTable).values(data).returning();
    return row ?? null;
  }

  async updateStatus(id: string, status: string) {
    const [row] = await this.db
      .update(cattlePassportsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(cattlePassportsTable.id, id))
      .returning();
    return row ?? null;
  }

  async seize(id: string, deathDate: string, deathCause?: string) {
    const [row] = await this.db
      .update(cattlePassportsTable)
      .set({
        status: "seized",
        seizeDate: deathDate,
        deathDate,
        deathCause: deathCause as any,
        updatedAt: new Date(),
      })
      .where(eq(cattlePassportsTable.id, id))
      .returning();
    return row ?? null;
  }

  async archive(id: string) {
    const [row] = await this.db
      .update(cattlePassportsTable)
      .set({
        status: "archived",
        archiveDate: new Date().toISOString().split("T")[0]!,
        updatedAt: new Date(),
      })
      .where(eq(cattlePassportsTable.id, id))
      .returning();
    return row ?? null;
  }

  async shipToVs(id: string) {
    const [row] = await this.db
      .update(cattlePassportsTable)
      .set({
        shippedToVs: true,
        shippedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cattlePassportsTable.id, id))
      .returning();
    return row ?? null;
  }

  async deliverToKeeper(id: string) {
    const [row] = await this.db
      .update(cattlePassportsTable)
      .set({
        deliveredToKeeper: true,
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cattlePassportsTable.id, id))
      .returning();
    return row ?? null;
  }

  async findSeized(opts: { limit: number; offset: number }) {
    const c: SQL<unknown>[] = [eq(cattlePassportsTable.status, "seized")];
    const where = and(...c);
    const [data, totalResult] = await Promise.all([
      this.db.select().from(cattlePassportsTable).where(where).orderBy(desc(cattlePassportsTable.seizeDate)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(cattlePassportsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }
}
