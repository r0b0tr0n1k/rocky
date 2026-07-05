/**
 * Risk Analysis Service
 *
 * @description Business logic for CPC annual risk analysis — selects 10% of farms
 * for on-spot inspection using weighted random selection.
 */

import { ok, err, type Result } from "neverthrow";
import type { DatabaseProvider } from "@rocky/database";
import { farms as farmsTable, animals as animalsTable, inspections as inspectionsTable, riskAnalyses as riskAnalysesTable } from "@rocky/database";
import { eq, and, sql, desc, } from "drizzle-orm";
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
  constructor(private readonly dbp: DatabaseProvider) {}

  /**
   * Run the risk analysis — selects a percentage of farms for inspection.
   * Creates the risk_analyses record and returns the selected farm IDs.
   */
  async runAnalysis(
    input: RunAnalysisInput,
  ): Promise<Result<{ analysisId: string; selectedFarmCount: number; totalFarmCount: number }, InspectionError>> {
    try {
      const percentage = input.selectionPercentage ?? 10;

      // 1. Count total active farms
      const [totalResult] = await this.dbp.client
        .select({ count: sql<number>`count(*)::int` })
        .from(farmsTable)
        .where(eq(farmsTable.isActive, true));
      const totalFarms = totalResult?.count ?? 0;
      if (totalFarms === 0)
        return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "No active farms found" }));

      // 2. Calculate how many to select
      const targetCount = Math.max(1, Math.round((totalFarms * percentage) / 100));

      // 3. Fetch all active farms with risk factors — animal count, past inspections, type
      const farmsWithRiskFactors = await this.dbp.client
        .select({
          id: farmsTable.id,
          type: farmsTable.type,
          animalCount: sql<number>`COALESCE(count(DISTINCT ${animalsTable.id}), 0)`,
          pastInspections: sql<number>`COALESCE(count(DISTINCT CASE WHEN ${inspectionsTable.status} = 'completed' THEN ${inspectionsTable.id} END), 0)`,
        })
        .from(farmsTable)
        .leftJoin(animalsTable, eq(animalsTable.currentFarmId, farmsTable.id))
        .leftJoin(inspectionsTable, eq(inspectionsTable.farmId, farmsTable.id))
        .where(eq(farmsTable.isActive, true))
        .groupBy(farmsTable.id)
        .having(sql`count(${animalsTable.id}) > 0`);

      // 4. Weighted random selection
      const maxAnimalCount = Math.max(...farmsWithRiskFactors.map(f => f.animalCount), 1);
      const maxPastInspections = Math.max(...farmsWithRiskFactors.map(f => f.pastInspections), 1);

      const candidates = farmsWithRiskFactors.map(farm => {
        const sizeScore = farm.animalCount / maxAnimalCount;
        const speciesScore = farm.type !== "FARM" ? 1 : 0;
        const historyScore = farm.pastInspections / maxPastInspections;
        const score = 1.0
          + DEFAULT_WEIGHTS.farmSizeWeight * sizeScore
          + DEFAULT_WEIGHTS.historyWeight * historyScore
          + DEFAULT_WEIGHTS.speciesWeight * speciesScore
          + DEFAULT_WEIGHTS.regionWeight * Math.random();
        return { id: farm.id, score };
      });

      let totalScore = candidates.reduce((s, f) => s + f.score, 0);
      const selectedIds: string[] = [];

      for (let i = 0; i < targetCount && candidates.length > 0; i++) {
        let needle = Math.random() * totalScore;
        for (let j = 0; j < candidates.length; j++) {
          const c = candidates[j]!;
          needle -= c.score;
          if (needle <= 0) {
            selectedIds.push(c.id);
            totalScore -= c.score;
            candidates.splice(j, 1);
            break;
          }
        }
      }

      const selectedFarmCount = selectedIds.length;

      // 4. Create the risk_analysis record
      const [analysis] = await this.dbp.client
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

      if (!analysis)
        return err(
          new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "Failed to create risk analysis record" }),
        );

      return ok({
        analysisId: analysis.id,
        selectedFarmCount,
        totalFarmCount: totalFarms,
      });
    } catch (error) {
      return err(
        new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, {
          reason: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  /** List risk analyses */
  async list(opts: { year?: number; status?: string; limit: number; offset: number }) {
    const c: ReturnType<typeof eq>[] = [];
    if (opts.year) c.push(eq(riskAnalysesTable.year, opts.year));
    if (opts.status) c.push(eq(riskAnalysesTable.status, opts.status));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.dbp.client
        .select()
        .from(riskAnalysesTable)
        .where(where)
        .orderBy(desc(riskAnalysesTable.createdAt))
        .limit(opts.limit)
        .offset(opts.offset),
      this.dbp.client.select({ count: sql<number>`count(*)::int` }).from(riskAnalysesTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  /** Get a single risk analysis */
  async getById(id: string) {
    const [row] = await this.dbp.client.select().from(riskAnalysesTable).where(eq(riskAnalysesTable.id, id)).limit(1);
    return row ?? null;
  }
}
