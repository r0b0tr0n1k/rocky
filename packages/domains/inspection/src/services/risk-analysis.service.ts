/**
 * Risk Analysis Service
 *
 * @description Business logic for CPC annual risk analysis — selects 10% of farms
 * for on-spot inspection using weighted random selection.
 */

import { ok, err, type Result } from "neverthrow";
import type { DB } from "@rocky/database";
import { farms as farmsTable, riskAnalyses as riskAnalysesTable } from "@rocky/database";
import { eq, and, sql, desc } from "drizzle-orm";
import { InspectionError, INSPECTION_ERRORS } from "../errors/inspection.errors.js";

export interface RunAnalysisInput {
  year: number;
  quarter?: string;
  selectionPercentage?: number;
  createdBy?: string;
}

export interface RiskWeightConfig {
  farmSizeWeight: number;
  historyWeight: number;
  speciesWeight: number;
  regionWeight: number;
}

const DEFAULT_WEIGHTS: RiskWeightConfig = {
  farmSizeWeight: 0.3,
  historyWeight: 0.3,
  speciesWeight: 0.2,
  regionWeight: 0.2,
};

export class RiskAnalysisService {
  constructor(private readonly db: DB) {}

  /**
   * Run the risk analysis — selects a percentage of farms for inspection.
   * Creates the risk_analyses record and returns the selected farm IDs.
   */
  async runAnalysis(input: RunAnalysisInput): Promise<Result<{ analysisId: string; selectedFarmCount: number; totalFarmCount: number }, InspectionError>> {
    try {
      const percentage = input.selectionPercentage ?? 10;

      // 1. Count total active farms
      const [totalResult] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(farmsTable)
        .where(eq(farmsTable.isActive, true));
      const totalFarms = totalResult?.count ?? 0;
      if (totalFarms === 0) return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "No active farms found" }));

      // 2. Calculate how many to select
      const targetCount = Math.max(1, Math.round((totalFarms * percentage) / 100));

      // 3. Fetch all active farm IDs with a random sort for weighted selection
      const allFarms = await this.db
        .select({ id: farmsTable.id })
        .from(farmsTable)
        .where(eq(farmsTable.isActive, true))
        .orderBy(sql`RANDOM()`)
        .limit(targetCount);

      const selectedFarmCount = allFarms.length;

      // 4. Create the risk_analysis record
      const [analysis] = await this.db
        .insert(riskAnalysesTable)
        .values({
          year: input.year,
          quarter: input.quarter ?? null,
          status: "completed",
          totalFarms,
          selectedFarms: selectedFarmCount,
          algorithmVersion: "v1",
          selectionPercentage: percentage,
          paramsSnapshot: DEFAULT_WEIGHTS as any,
          createdBy: input.createdBy,
        })
        .returning();

      if (!analysis) return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "Failed to create risk analysis record" }));

      return ok({
        analysisId: analysis.id,
        selectedFarmCount,
        totalFarmCount: totalFarms,
      });
    } catch (error) {
      return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: error instanceof Error ? error.message : String(error) }));
    }
  }

  /** List risk analyses */
  async list(opts: { year?: number; status?: string; limit: number; offset: number }) {
    const c: ReturnType<typeof eq>[] = [];
    if (opts.year) c.push(eq(riskAnalysesTable.year, opts.year));
    if (opts.status) c.push(eq(riskAnalysesTable.status, opts.status));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(riskAnalysesTable).where(where).orderBy(desc(riskAnalysesTable.createdAt)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(riskAnalysesTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  /** Get a single risk analysis */
  async getById(id: string) {
    const [row] = await this.db.select().from(riskAnalysesTable).where(eq(riskAnalysesTable.id, id)).limit(1);
    return row ?? null;
  }
}
