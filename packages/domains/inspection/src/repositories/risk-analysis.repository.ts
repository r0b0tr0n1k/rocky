/**
 * Risk Analysis Repository
 *
 * @description DB access layer for the risk_analyses / risk_analysis_results tables.
 * Read-only join aggregates (active farms, farm risk factors) live in FarmRepository.
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { riskAnalyses, riskAnalysisResults } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class RiskAnalysisRepository extends BaseRepository {
  async createRiskAnalysis(values: typeof riskAnalyses.$inferInsert) {
    const rows = await this.client.insert(riskAnalyses).values(values).returning();
    return rows[0] ?? null;
  }

  async insertRiskAnalysisResults(rows: (typeof riskAnalysisResults.$inferInsert)[]) {
    if (rows.length) await this.client.insert(riskAnalysisResults).values(rows);
  }

  async listRiskAnalyses(opts: { year?: number; status?: string; limit: number; offset: number }) {
    const where = and(
      opts.year ? eq(riskAnalyses.year, opts.year) : undefined,
      opts.status ? eq(riskAnalyses.status, opts.status) : undefined,
    );
    const data = await this.client
      .select()
      .from(riskAnalyses)
      .where(where)
      .orderBy(desc(riskAnalyses.createdAt))
      .limit(opts.limit)
      .offset(opts.offset);
    const [{ count }] = await this.client.select({ count: sql<number>`count(*)` }).from(riskAnalyses).where(where);
    return { data, total: Number(count) };
  }

  async getRiskAnalysisById(id: string) {
    const rows = await this.client.select().from(riskAnalyses).where(eq(riskAnalyses.id, id)).limit(1);
    return rows[0] ?? null;
  }
}
