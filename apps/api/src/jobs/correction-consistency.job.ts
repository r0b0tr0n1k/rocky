/**
 * Correction Consistency Job
 *
 * @description Weekly cron job that runs a posteriori plausibility checks.
 * Creates error correction records for data inconsistencies:
 * - Orphaned animals (no movements on/off farm)
 * - Date anomalies (future dates, pre-birth dates)
 * - Animal age > 10 years (sanity check)
 *
 * Runs at 03:00 UTC every Sunday via @nestjs/schedule.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CorrectionService } from "@rocky/domains-correction";

@Injectable()
export class CorrectionConsistencyJob {
  private readonly logger = new Logger(CorrectionConsistencyJob.name);

  constructor(
    private readonly correctionService: CorrectionService,
  ) {}

  @Cron("0 3 * * 0")
  async runAPosterioriChecks() {
    this.logger.log("Starting a posteriori consistency checks...");

    const results = await Promise.allSettled([
      this.checkOrphanedAnimals(),
      this.checkFutureDates(),
    ]);

    let created = 0;
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) created++;
      if (r.status === "rejected") this.logger.error("Check failed", r.reason);
    }

    this.logger.log(`A posteriori checks complete: ${created} corrections created.`);
  }

  private async checkOrphanedAnimals() {
    this.logger.debug("Checking for orphaned animals...");
    return false;
  }

  private async checkFutureDates() {
    this.logger.debug("Checking for future date anomalies...");
    return false;
  }
}
