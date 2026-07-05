
import { auditLog as auditLogTable } from "@rocky/database";
import type { AUDIT_ACTION, EVENT_SOURCE } from "@rocky/database/constants";
import { BaseRepository } from "@rocky/domains-shared";

export interface AuditLogInsert {
  action: (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
  resource: string;
  resourceId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  userId?: string;
  sessionId?: string;
  source: (typeof EVENT_SOURCE)[keyof typeof EVENT_SOURCE];
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export class AuditRepository extends BaseRepository {

  async insert(data: AuditLogInsert) {
    const [row] = await this.client.insert(auditLogTable).values(data).returning();
    return row ?? null;
  }
}
