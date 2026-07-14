/**
 * Vaccine Reconciliation Job
 *
 * @description Daily cron that runs the vaccine mass-balance reconciliation (TRACES / AMR
 * anti-black-market protocol). Any batch where quantity_received != quantity_remaining +
 * administered doses is drift; an a-posteriori COMPLEX correction case is opened so a
 * Veterinary Inspector physically audits the Veterinary Station fridge.
 *
 * Runs daily at 03:00 UTC via @nestjs/schedule.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HealthService } from "@rocky/domains-health";

@Injectable()
export class VaccineReconciliationJob {
  private readonly logger = new Logger(VaccineReconciliationJob.name);

  constructor(private readonly healthService: HealthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runReconciliation() {
    this.logger.log("Starting vaccine stock reconciliation...");

    const result = await this.healthService.reconcileVaccineStock();
    if (result.isErr()) {
      this.logger.error("Vaccine reconciliation failed", result.error);
      return;
    }

    this.logger.log(
      `Vaccine reconciliation complete: ${result.value.driftedCount} drifted, ${result.value.correctionsCreated} corrections opened.`,
    );
  }
}
