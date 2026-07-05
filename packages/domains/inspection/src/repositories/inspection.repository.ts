/**
 * Inspection Repository
 *
 * @description DB access layer for inspection domain — CRUD for inspections table.
 */

import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { inspections as inspectionsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { INSPECTION_STATUS } from "@rocky/database/constants";

export class InspectionRepository extends BaseRepository {
  constructor(db: DB) {
    super(db);
  }

  // ── Read ──

  async findById(id: string) {
    const [row] = await this.db.select().from(inspectionsTable).where(eq(inspectionsTable.id, id)).limit(1);
    return row ?? null;
  }

  async findByFarm(farmId: string, opts?: { status?: string; limit?: number; offset?: number }) {
    const c: SQL<unknown>[] = [eq(inspectionsTable.farmId, farmId)];
    if (opts?.status) c.push(eq(inspectionsTable.status, opts.status));
    const query = this.db
      .select()
      .from(inspectionsTable)
      .where(and(...c))
      .orderBy(desc(inspectionsTable.createdAt));
    if (opts?.limit) query.limit(opts.limit);
    if (opts?.offset) query.offset(opts.offset);
    return query;
  }

  async list(opts: { status?: string; farmId?: string; inspectorId?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.status) c.push(eq(inspectionsTable.status, opts.status));
    if (opts.farmId) c.push(eq(inspectionsTable.farmId, opts.farmId));
    if (opts.inspectorId) c.push(eq(inspectionsTable.inspectorId, opts.inspectorId));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(inspectionsTable).where(where).orderBy(desc(inspectionsTable.createdAt)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(inspectionsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  /** Check if a farm already has an active (non-cancelled) inspection in a given period */
  async hasActiveInspection(farmId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: inspectionsTable.id })
      .from(inspectionsTable)
      .where(
        and(
          eq(inspectionsTable.farmId, farmId),
          eq(inspectionsTable.isActive, true),
          sql`${inspectionsTable.status} != ${INSPECTION_STATUS.CANCELLED}`,
        ),
      )
      .limit(1);
    return !!row;
  }

  // ── Write ──

  async create(data: typeof inspectionsTable.$inferInsert) {
    const [row] = await this.db.insert(inspectionsTable).values(data).returning();
    return row ?? null;
  }

  async update(id: string, data: Partial<typeof inspectionsTable.$inferInsert>) {
    const [row] = await this.db
      .update(inspectionsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(inspectionsTable.id, id))
      .returning();
    return row ?? null;
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status } as any);
  }

  /** Flag farm for inspection — creates a scheduled inspection triggered by notifiable disease alert */
  async flagFarmForInspection(data: {
    farmId: string;
    inspectorId?: string | null;
    riskScore?: string | null;
    riskCriteria?: string | null;
    notes?: string | null;
    createdBy?: string | null;
  }) {
    const inspection = await this.create({
      farmId: data.farmId,
      inspectorId: data.inspectorId ?? "00000000-0000-0000-0000-000000000000",
      status: INSPECTION_STATUS.SCHEDULED,
      selectedByRiskAnalysis: false,
      discrepanciesFound: false,
      formPrinted: false,
      formReturned: false,
      keeperSigned: false,
      storedAtVi: false,
      riskScore: data.riskScore ?? undefined,
      riskCriteria: data.riskCriteria ?? undefined,
      notes: data.notes ?? undefined,
      createdBy: data.createdBy ?? undefined,
    } as any);
    return inspection;
  }
}
