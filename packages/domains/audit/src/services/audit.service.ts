import { AUDIT_ACTION, EVENT_SOURCE } from "@rocky/database/constants";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import { EXECUTION_CONTEXT_CLS_KEY, type ExecutionContext } from "@rocky/execution";
import { piiFieldsForTable } from "@rocky/validators";
import type { ClsService } from "nestjs-cls";
import type { AuditListFilter, AuditRepository } from "../repositories/audit.repository.js";

function computeChanges(
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
): Record<string, { old: unknown; new: unknown }> | null {
  if (!oldValue || !newValue) return null;
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
  for (const key of allKeys) {
    const oldV = oldValue[key];
    const newV = newValue[key];
    if (oldV !== newV) {
      changes[key] = { old: oldV, new: newV };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

const REDACTED = "<redacted>";

// camelCase entity type -> snake_case table key (e.g. "earTagOrder" -> "ear_tag_order").
// The PII registry (ADR-0061 D1) keys tables in snake_case; audit `resource`
// strings are camelCase entity types. This bridges both so masking fires for
// snake_case tables (ear_tag_orders, birth_notifications, ...) as well as the
// simple pluralised ones (subjects, farms, animals, movements, ...).
function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

// The PII registry (ADR-0061 D1) uses DB table keys, a mix of singular and plural
// names (e.g. "subjects", "farms" vs "animal", "passport") and snake_case (e.g.
// "ear_tag_orders"). Audit `resource` strings are camelCase entity types. This
// resolver tolerates the mismatch by enumerating singular/plural AND camel/snake
// variants, so masking works regardless of the naming convention a given table uses.
function resolvePiiColumns(resource: string): Set<string> {
  const singular = resource.replace(/s$/, "");
  const candidates = [
    resource,
    `${resource}s`,
    singular,
    toSnakeCase(resource),
    `${toSnakeCase(resource)}s`,
    toSnakeCase(singular),
  ];
  const columns = new Set<string>();
  for (const candidate of candidates) {
    for (const field of piiFieldsForTable(candidate)) {
      columns.add(field.column);
    }
  }
  return columns;
}

// Redact registered PII columns in a flat snapshot row (oldValue / newValue),
// preserving non-PII fields so EUDR traceability diffs (status, tag number,
// farmId, resourceId) survive. WO-159 Part 2 — ISO 27701 A.1.4.x / GDPR Art.25.
function maskRow(resource: string, row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return row;
  const pii = resolvePiiColumns(resource);
  if (pii.size === 0) return row;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = pii.has(key) ? REDACTED : value;
  }
  return out;
}

// Redact registered PII columns inside a field-level diff, keeping the field name
// (so we still record THAT a PII field changed) but never the PII value.
function maskChanges(
  resource: string,
  changes: Record<string, { old: unknown; new: unknown }> | null,
): Record<string, { old: unknown; new: unknown }> | null {
  if (!changes) return changes;
  const pii = resolvePiiColumns(resource);
  if (pii.size === 0) return changes;
  const out: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(changes)) {
    out[key] = pii.has(key) ? { old: REDACTED, new: REDACTED } : value;
  }
  return out;
}

/** Optional request context, used to override CLS-captured values (tests, non-request paths). */
interface AuditRequestContext {
  ip?: string | null;
  userAgent?: string | null;
  sessionId?: string;
}

export class AuditService {
  constructor(
    private readonly repo: AuditRepository,
    private readonly cls?: ClsService,
  ) {}

  // Resolve request context from an explicit override first, then the execution
  // context stored in CLS by the RLS stage (Remediation B — thread ip/ua/session
  // from ctx.execution without churning every service signature). Falls back to
  // undefined when no request is in flight (e.g. cron, unit tests).
  private resolveRequestContext(override?: AuditRequestContext): {
    ip: string | null | undefined;
    userAgent: string | null | undefined;
    sessionId: string | undefined;
  } {
    const ctx: ExecutionContext | undefined = this.cls
      ? (this.cls.get(EXECUTION_CONTEXT_CLS_KEY) as ExecutionContext | undefined)
      : undefined;
    return {
      ip: override?.ip ?? ctx?.request?.ip ?? undefined,
      userAgent: override?.userAgent ?? ctx?.request?.userAgent ?? undefined,
      sessionId: override?.sessionId ?? ctx?.runtime?.traceId ?? undefined,
    };
  }

  private async persist(
    action: (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION],
    params: {
      resource: string;
      resourceId: string;
      oldValue: Record<string, unknown> | null;
      newValue: Record<string, unknown> | null;
      userId?: string;
      sessionId?: string;
      source?: string;
      request?: AuditRequestContext;
    },
  ): Promise<void> {
    const req = this.resolveRequestContext(
      params.request
        ? {
            ip: params.request.ip,
            userAgent: params.request.userAgent,
            sessionId: params.sessionId,
          }
        : undefined,
    );
    const changes = computeChanges(params.oldValue, params.newValue);

    await this.repo.insert({
      action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValue: maskRow(params.resource, params.oldValue),
      newValue: maskRow(params.resource, params.newValue),
      changes: maskChanges(params.resource, changes),
      userId: params.userId,
      sessionId: req.sessionId,
      ipAddress: req.ip ?? undefined,
      userAgent: req.userAgent ?? undefined,
      source: (params.source ?? EVENT_SOURCE.API) as (typeof EVENT_SOURCE)[keyof typeof EVENT_SOURCE],
      success: true,
    });
  }

  async recordCreate(params: {
    resource: string;
    resourceId: string;
    newValue: Record<string, unknown> | null;
    userId?: string;
    sessionId?: string;
    source?: string;
    request?: AuditRequestContext;
  }): Promise<Result<void, Error>> {
    return fromAsyncThrowable(
      () => this.persist(AUDIT_ACTION.CREATE, { ...params, oldValue: null, newValue: params.newValue }),
      toAppError,
    )();
  }

  async recordUpdate(params: {
    resource: string;
    resourceId: string;
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
    userId?: string;
    sessionId?: string;
    source?: string;
    request?: AuditRequestContext;
  }): Promise<Result<void, Error>> {
    return fromAsyncThrowable(
      () => this.persist(AUDIT_ACTION.UPDATE, { ...params, oldValue: params.oldValue, newValue: params.newValue }),
      toAppError,
    )();
  }

  async recordDelete(params: {
    resource: string;
    resourceId: string;
    oldValue: Record<string, unknown> | null;
    userId?: string;
    sessionId?: string;
    source?: string;
    request?: AuditRequestContext;
  }): Promise<Result<void, Error>> {
    return fromAsyncThrowable(
      () => this.persist(AUDIT_ACTION.DELETE, { ...params, oldValue: params.oldValue, newValue: null }),
      toAppError,
    )();
  }

  /**
   * WO-159 Part 3 — retention prune. Deletes audit records older than `cutoff`
   * (epidemiology-law window; animal-owner erasure is void). Delegates to the
   * repository, which opens a transaction and arms `app.audit_retention = 'on'`
   * so the append-only trigger (Part 1) permits the delete. Returns the number
   * of rows removed.
   */
  async pruneOldRecords(cutoff: Date): Promise<Result<number, Error>> {
    return fromAsyncThrowable(() => this.repo.pruneRetained(cutoff), toAppError)();
  }

  async list(
    filter: AuditListFilter,
    limit: number,
    offset: number,
  ): Promise<Result<Awaited<ReturnType<AuditRepository["list"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.list(filter, limit, offset);
    }, toAppError)();
  }
}
