import { AUDIT_ACTION, EVENT_SOURCE } from "@rocky/database/constants";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type { AuditRepository } from "../repositories/audit.repository.js";

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

export class AuditService {
  constructor(private readonly repo: AuditRepository) { }

  async recordUpdate(params: {
    resource: string;
    resourceId: string;
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
    userId?: string;
    sessionId?: string;
    source?: string;
  }): Promise<Result<void, Error>> {
    return fromAsyncThrowable(async () => {
      const changes = computeChanges(params.oldValue, params.newValue);
      await this.repo.insert({
        action: AUDIT_ACTION.UPDATE,
        resource: params.resource,
        resourceId: params.resourceId,
        oldValue: params.oldValue,
        newValue: params.newValue,
        changes,
        userId: params.userId,
        sessionId: params.sessionId,
        source: (params.source ?? EVENT_SOURCE.API) as (typeof EVENT_SOURCE)[keyof typeof EVENT_SOURCE],
        success: true,
      });
    }, toAppError)();
  }
}
