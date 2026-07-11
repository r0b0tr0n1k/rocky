/**
 * Risk Analysis Service
 *
 * @description Business logic for CPC annual risk analysis — selects 10% of farms
 * for on-spot inspection using weighted random selection.
 */

import { ok, err, type Result } from "neverthrow";
import type { DatabaseProvider } from "@rocky/database";
import { SystemService } from "@rocky/domains-system";
import { farms as farmsTable, animals as animalsTable, inspections as inspectionsTable, riskAnalyses as riskAnalysesTable, riskAnalysisResults as riskAnalysisResultsTable } from "@rocky/database";
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


export class RiskAnalysisService {
  constructor(private readonly dbp: DatabaseProvider, private readonly system: SystemService) {}

  /**
   * Run the risk analysis — selects a percentage of farms for inspection.
   * Creates the risk_analyses record and returns the selected farm IDs.
   */
  async runAnalysis(
    input: RunAnalysisInput,
  ): Promise<Result<{ analysisId: string; selectedFarmCount: number; totalFarmCount: number }, InspectionError>> {
    try {
      const ruleSet = await this.system.getRuleSet();
      if (ruleSet.isErr()) return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "RuleSet unavailable", detail: ruleSet.error.message }));
      const weights = ruleSet.value.weights;
      const percentage = input.selectionPercentage ?? weights.selectionPercentage;

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
              const regionScore = Math.random();
              const score = 1.0
                + weights.farmSize * sizeScore
                + weights.history * historyScore
                + weights.species * speciesScore
                + weights.region * regionScore;
              return { id: farm.id, animalCount: farm.animalCount, pastInspections: farm.pastInspections, type: farm.type, sizeScore, speciesScore, historyScore, regionScore, score };
            });
            // Immutable copy for persistence (the selection loop below mutates `candidates`)
            const allCandidates = candidates.map((c) => ({ ...c }));

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
          paramsSnapshot: weights,
          createdBy: input.createdBy,
        })
        .returning();

      if (!analysis)
        return err(
          new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "Failed to create risk analysis record" }),
        );

            // Persist per-farm results (WO-021) — the bureaucratic alibi for OCR 2017/625 audits.
            // risk_factors_snapshot freezes the exact variables + RuleSet weights at analysis time.
            await this.dbp.client
              .insert(riskAnalysisResultsTable)
              .values(
                allCandidates.map((c) => ({
                  analysisId: analysis.id,
                  farmId: c.id,
                  score: c.score.toFixed(6),
                  selected: selectedIds.includes(c.id),
                  riskFactorsSnapshot: {
                    animalCount: c.animalCount,
                    pastInspections: c.pastInspections,
                    farmType: c.type,
                    farmSizeWeight: weights.farmSize,
                    historyWeight: weights.history,
                    speciesWeight: weights.species,
                    regionWeight: weights.region,
                    sizeScore: Number(c.sizeScore.toFixed(4)),
                    speciesScore: Number(c.speciesScore.toFixed(4)),
                    historyScore: Number(c.historyScore.toFixed(4)),
                    regionScore: Number(c.regionScore.toFixed(4)),
                    selectionPercentage: percentage,
                  },
                })),
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
