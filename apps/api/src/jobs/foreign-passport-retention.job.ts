import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DatabaseProvider } from "@rocky/database";
import { importExportRecords } from "@rocky/database/schema/an/import-export-records.js";
import { and, eq, lte } from "drizzle-orm";
import { OutboxEventPublisher } from "@rocky/execution";
import { EVENT_TYPE_IDS } from "@rocky/domains-notification/index.js";

@Injectable()
export class ForeignPassportRetentionJob {
  private readonly logger = new Logger(ForeignPassportRetentionJob.name);

  constructor(
    private readonly dbp: DatabaseProvider,
    private readonly outboxPublisher: OutboxEventPublisher,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkExpiredPassports() {
    this.logger.log("Scanning for expired foreign passport retentions...");

    const expiredRecords = await this.dbp.client
      .select()
      .from(importExportRecords)
      .where(
        and(
          eq(importExportRecords.foreignPassportStored, true),
          lte(
            importExportRecords.foreignPassportStorageExpiry,
            new Date().toISOString().split("T")[0]!,
          ),
        ),
      );

    if (expiredRecords.length === 0) {
      this.logger.log("No expired foreign passport retentions found.");
      return;
    }

    for (const record of expiredRecords) {
      await this.outboxPublisher.publish({
        type: EVENT_TYPE_IDS.FOREIGN_PASSPORT_EXPIRING,
        aggregateType: "import_export_record",
        aggregateId: record.id,
        payload: {
          passportNumber: record.foreignPassportNumber,
          animalId: record.animalId,
          storageExpiry: record.foreignPassportStorageExpiry,
        },
      });
    }

    this.logger.log(`Published ${expiredRecords.length} passport expiration events.`);
  }
}
