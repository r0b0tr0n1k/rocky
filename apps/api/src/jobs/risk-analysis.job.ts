/**
 * Risk Analysis Job
 *
 * @description Annual cron job that triggers the CPC risk analysis - selects 10% of farms
 * for on-spot inspection using weighted random selection.
 *
 * Runs at 00:00 UTC on January 1st annually via @nestjs/schedule.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { RiskAnalysisService } from "@rocky/domains-inspection";

@Injectable()
export class RiskAnalysisJob {
  private readonly logger = new Logger(RiskAnalysisJob.name);

  constructor(private readonly riskAnalysisService: RiskAnalysisService) {}

  /**
   * Annual risk analysis - selects 10% of farms for inspection.
   * Runs at midnight on January 1st each year.
   */
  @Cron("0 0 1 1 *")
  async runAnnualAnalysis() {
    const year = new Date().getFullYear();
    this.logger.log(`Starting annual risk analysis for ${year}...`);

    const result = await this.riskAnalysisService.runAnalysis({
      year,
      selectionPercentage: 10,
      createdBy: "system",
    });

    if (result.isErr()) {
      this.logger.error("Risk analysis failed", result.error);
      return;
    }

    const { analysisId, selectedFarmCount, totalFarmCount } = result.value;
    this.logger.log(
      `Risk analysis ${analysisId} complete: ${selectedFarmCount}/${totalFarmCount} farms selected for inspection.`,
    );
  }
}
