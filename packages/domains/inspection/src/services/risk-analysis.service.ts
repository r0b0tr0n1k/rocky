/**
 * Risk Analysis Service
 *
 * @description Business logic for CPC annual risk analysis — selects 10% of farms
 * for on-spot inspection using weighted random selection.
 */

import { ok, err, type Result } from "neverthrow";
import type { SystemService } from "@rocky/domains-system";
import type { FarmRepository } from "@rocky/domains-farm";
import type { RiskAnalysisRepository } from "../repositories/risk-analysis.repository.js";
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
  constructor(
    private readonly riskRepo: RiskAnalysisRepository,
    private readonly farmRepo: FarmRepository,
    private readonly system: SystemService,
  ) {}

  /**
   * Run the risk analysis — selects a percentage of farms for inspection.
   * Creates the risk_analyses record and returns the selected farm IDs.
   */
  async runAnalysis(
    input: RunAnalysisInput,
  ): Promise<Result<{ analysisId: string; selectedFarmCount: number; totalFarmCount: number }, InspectionError>> {
    try {
      const ruleSet = await this.system.getRuleSet();
      if (ruleSet.isErr())
        return err(
          new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, {
            reason: "RuleSet unavailable",
            detail: ruleSet.error.message,
          }),
        );
      const weights = ruleSet.value.weights;
      const percentage = input.selectionPercentage ?? weights.selectionPercentage;

      // 1. Count total active farms
      const totalFarms = await this.farmRepo.countActiveFarms();
      if (totalFarms === 0)
        return err(new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "No active farms found" }));

      // 2. Calculate how many to select
      const targetCount = Math.max(1, Math.round((totalFarms * percentage) / 100));

      // 3. Fetch all active farms with risk factors — animal count, past inspections, type
      const farmsWithRiskFactors = await this.farmRepo.getFarmsWithRiskFactors();

      // 4. Weighted random selection
      const maxAnimalCount = Math.max(...farmsWithRiskFactors.map((f) => f.animalCount), 1);
      const maxPastInspections = Math.max(...farmsWithRiskFactors.map((f) => f.pastInspections), 1);

      const candidates = farmsWithRiskFactors.map((farm) => {
        const sizeScore = farm.animalCount / maxAnimalCount;
        const speciesScore = farm.type !== "FARM" ? 1 : 0;
        const historyScore = farm.pastInspections / maxPastInspections;
        const regionScore = Math.random();
        const score =
          1.0 +
          weights.farmSize * sizeScore +
          weights.history * historyScore +
          weights.species * speciesScore +
          weights.region * regionScore;
        return {
          id: farm.id,
          animalCount: farm.animalCount,
          pastInspections: farm.pastInspections,
          type: farm.type,
          sizeScore,
          speciesScore,
          historyScore,
          regionScore,
          score,
        };
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
      const [analysis] = await this.riskRepo.createRiskAnalysis({
        year: input.year,
        quarter: input.quarter ?? null,
        status: "completed",
        totalFarms,
        selectedFarms: selectedFarmCount,
        algorithmVersion: "v1",
        selectionPercentage: percentage,
        paramsSnapshot: weights,
        createdBy: input.createdBy,
      });

      if (!analysis)
        return err(
          new InspectionError(INSPECTION_ERRORS.INVALID_INPUT, { reason: "Failed to create risk analysis record" }),
        );

      // Persist per-farm results (WO-021) — the bureaucratic alibi for OCR 2017/625 audits.
      // risk_factors_snapshot freezes the exact variables + RuleSet weights at analysis time.
      await this.riskRepo.insertRiskAnalysisResults(
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
    const { data, total } = await this.riskRepo.listRiskAnalyses(opts);
    return { data, total };
  }

  /** Get a single risk analysis */
  async getById(id: string) {
    return this.riskRepo.getRiskAnalysisById(id);
  }
}
