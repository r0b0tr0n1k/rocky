/**
 * Retention Enforcement Job
 *
 * @description Daily cron job that enforces 3-year retention for archived documents.
 * Queries archive_documents WHERE retentionExpiry < NOW() AND destroyedAt IS NULL,
 * marks them as destroyed (deactivates the record).
 *
 * Runs at 02:00 UTC daily via @nestjs/schedule.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ArchiveService } from "@rocky/domains-archive";

@Injectable()
export class RetentionJob {
  private readonly logger = new Logger(RetentionJob.name);

  constructor(
    private readonly archiveService: ArchiveService,
  ) {}

  /**
   * Daily retention enforcement - marks expired documents as destroyed.
   * Non-destructive by default: only processes documents that have exceeded
   * their retention period and haven't been destroyed yet.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async enforceRetention() {
    this.logger.log("Starting retention enforcement scan...");

    const expiredResult = await this.archiveService.findExpiredRetention(100);
    if (expiredResult.isErr()) {
      this.logger.error("Failed to query expired retention", expiredResult.error);
      return;
    }

    const expired = expiredResult.value;
    if (expired.length === 0) {
      this.logger.debug("No expired documents found.");
      return;
    }

    this.logger.warn(`Found ${expired.length} expired documents. Processing...`);

    let destroyed = 0;
    let failed = 0;

    for (const doc of expired) {
      const result = await this.archiveService.markDestroyed(doc.id);
      if (result.isOk()) {
        destroyed++;
        this.logger.debug(`Destroyed document ${doc.id} (${doc.documentType}, retention expired ${doc.retentionExpiry})`);
      } else {
        failed++;
        this.logger.error(`Failed to destroy document ${doc.id}`, result.error);
      }
    }

    this.logger.log(`Retention enforcement complete: ${destroyed} destroyed, ${failed} failed.`);
  }
}
