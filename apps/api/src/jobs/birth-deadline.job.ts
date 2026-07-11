/**
 * Birth Deadline Job
 *
 * @description Daily cron that enforces birth-notification tagging deadlines (TRACES / AHL 2016/429).
 * Any PENDING notification past its taggingDeadline is transitioned to OVERDUE and a
 * birth_notification.overdue outbox event is published. The farm lock itself is enforced
 * derivatively in MovementService (no outgoing movement while OVERDUE births exist).
 *
 * Runs daily at 02:00 UTC via @nestjs/schedule.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import type { AnimalService } from "@rocky/domains-animal";

@Injectable()
export class BirthDeadlineJob {
  private readonly logger = new Logger(BirthDeadlineJob.name);

  constructor(private readonly animalService: AnimalService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runEnforcement() {
    this.logger.log("Starting birth-notification deadline enforcement...");

    const result = await this.animalService.enforceBirthDeadlines();
    if (result.isErr()) {
      this.logger.error("Birth deadline enforcement failed", result.error);
      return;
    }

    this.logger.log(
      `Birth deadline enforcement complete: ${result.value.overdueCount} notifications marked OVERDUE.`,
    );
  }
}
