/**
 * Audit Log Retention Enforcement Job
 *
 * @description Daily cron job that enforces the audit-log retention window
 * (WO-159 Part 3). Prunes `audit_log` rows older than the retention cutoff.
 *
 * The epidemiology law mandates a multi-year retention for livestock
 * traceability/audit data, and the animal owner's "right to be forgotten" is
 * void for this data (GDPR Art. 6(1)(c) legal obligation + the livestock
 * traceability exemption) — so no early erasure is performed; only the
 * age-based prune runs.
 *
 * The actual delete is delegated to AuditService.pruneOldRecords, which opens
 * a transaction and arms `app.audit_retention = 'on'` so the append-only
 * trigger (WO-159 Part 1) permits the delete. All rows are masked at write
 * time (WO-159 Part 2), so pruning satisfies confidentiality.
 *
 * Runs at 02:00 UTC daily via @nestjs/schedule.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import type { AuditService } from "@rocky/domains-audit";

/** Retention window in years — epidemiology-law mandate for livestock traceability/audit data. */
const AUDIT_RETENTION_YEARS = 7;

@Injectable()
export class AuditRetentionJob {
  private readonly logger = new Logger(AuditRetentionJob.name);

  constructor(private readonly auditService: AuditService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async enforceAuditRetention() {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - AUDIT_RETENTION_YEARS);

    this.logger.log(
      `Audit retention: pruning records older than ${cutoff.toISOString()} (${AUDIT_RETENTION_YEARS}y window)...`,
    );

    const result = await this.auditService.pruneOldRecords(cutoff);
    if (result.isErr()) {
      this.logger.error("Audit retention prune failed", result.error);
      return;
    }

    this.logger.log(`Audit retention: pruned ${result.value} record(s) older than ${AUDIT_RETENTION_YEARS}y.`);
  }
}
