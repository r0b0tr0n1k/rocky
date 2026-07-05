/**
 * Correction Repository
 *
 * @description DB access layer for error corrections.
 */

import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { errorCorrections as errorCorrectionsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { CORRECTION_STATUS } from "@rocky/database/constants";

export interface CorrectionFilter {
  farmId?: string;
  animalId?: string;
  status?: string;
  detectionSource?: string;
  limit: number;
  offset: number;
}

export class CorrectionRepository extends BaseRepository {
  constructor(db: DB) {
    super(db);
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(errorCorrectionsTable)
      .where(eq(errorCorrectionsTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listFiltered(filter: CorrectionFilter) {
    const c: SQL<unknown>[] = [];
    if (filter.farmId) c.push(eq(errorCorrectionsTable.farmId, filter.farmId));
    if (filter.animalId) c.push(eq(errorCorrectionsTable.animalId, filter.animalId));
    if (filter.status) c.push(eq(errorCorrectionsTable.status, filter.status));
    if (filter.detectionSource) c.push(eq(errorCorrectionsTable.detectionSource, filter.detectionSource));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(errorCorrectionsTable).where(where).orderBy(desc(errorCorrectionsTable.createdAt)).limit(filter.limit).offset(filter.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(errorCorrectionsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async create(data: typeof errorCorrectionsTable.$inferInsert) {
    const [row] = await this.db.insert(errorCorrectionsTable).values(data).returning();
    return row ?? null;
  }

  async updateStatus(id: string, status: string, extra?: { resolvedBy?: string; resolutionNotes?: string }) {
    const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
    if (extra?.resolvedBy) updateData.resolvedBy = extra.resolvedBy;
    if (status === CORRECTION_STATUS.RESOLVED) updateData.resolvedAt = new Date();
    if (extra?.resolutionNotes) updateData.resolutionNotes = extra.resolutionNotes;

    const [row] = await this.db
      .update(errorCorrectionsTable)
      .set(updateData)
      .where(eq(errorCorrectionsTable.id, id))
      .returning();
    return row ?? null;
  }

  async escalate(id: string, escalatedTo: string, reason?: string) {
    const [row] = await this.db
      .update(errorCorrectionsTable)
      .set({
        status: CORRECTION_STATUS.ESCALATED,
        escalatedTo,
        escalatedAt: new Date(),
        escalationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(errorCorrectionsTable.id, id))
      .returning();
    return row ?? null;
  }

  async findByFarm(farmId: string, opts: { limit: number; offset: number }) {
    return this.listFiltered({ farmId, ...opts });
  }
}
