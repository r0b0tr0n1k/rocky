
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
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

export interface AuditListFilter {
  userId?: string;
  resource?: string;
  action?: string;
  source?: string;
  success?: boolean;
  q?: string;
  from?: Date;
  to?: Date;
}

export class AuditRepository extends BaseRepository {

  async insert(data: AuditLogInsert) {
    const [row] = await this.client.insert(auditLogTable).values(data).returning();
    return row ?? null;
  }

  async list(filter: AuditListFilter, limit: number, offset: number) {
    const conditions: SQL[] = [];

    if (filter.userId) conditions.push(eq(auditLogTable.userId, filter.userId));
    if (filter.resource) conditions.push(eq(auditLogTable.resource, filter.resource));
    if (filter.action) conditions.push(eq(auditLogTable.action, filter.action));
    if (filter.source) conditions.push(eq(auditLogTable.source, filter.source));
    if (filter.success !== undefined) conditions.push(eq(auditLogTable.success, filter.success));
    if (filter.q) {
      conditions.push(
        or(
          ilike(auditLogTable.resource, `%${filter.q}%`),
          ilike(auditLogTable.resourceId, `%${filter.q}%`),
          ilike(auditLogTable.errorMessage, `%${filter.q}%`),
        )!,
      );
    }
    if (filter.from) conditions.push(gte(auditLogTable.createdAt, filter.from));
    if (filter.to) conditions.push(lte(auditLogTable.createdAt, filter.to));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(auditLogTable)
        .where(where)
        .orderBy(desc(auditLogTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.client
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogTable)
        .where(where),
    ]);

    return { data, total: totalResult[0]?.count ?? 0 };
  }
}
