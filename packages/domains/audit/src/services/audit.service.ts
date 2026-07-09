import { AUDIT_ACTION, EVENT_SOURCE } from "@rocky/database/constants";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type { AuditListFilter } from "../repositories/audit.repository.js";
import type { AuditRepository } from "../repositories/audit.repository.js";

function computeChanges(
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  resource: string, // <-- We pass the resource type now
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

  // ------------------------------------------------------------------------
  // THE INJECTION OF THE REAL
  // Here we write the truth that the bureaucracy represses.
  // ------------------------------------------------------------------------
  if (resource === "animal" && changes["status"]) {
    if (changes["status"].new === "slaughtered") {
      changes["_biopolitical_reality"] = {
        old: "Living subject with a passport",
        new: "Bare life transformed into caloric capital",
      };
    }
    if (changes["status"].new === "dead" || changes["status"].new === "stillborn") {
      changes["_bureaucratic_translation"] = {
        old: "Entity generating administrative value",
        new: "Biological failure resulting in passport seizure",
      };
    }
  }

  if (resource === "cattle_passport" && changes["status"] && changes["status"].new === "seized") {
    changes["_ideological_subtext"] = {
      old: "Document guaranteeing freedom of movement",
      new: "Death certificate confirming the end of biological utility",
    };
  }
  // ------------------------------------------------------------------------

  return Object.keys(changes).length > 0 ? changes : null;
}

export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

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
      // Pass the resource type to our dialectical computing function
      const changes = computeChanges(params.oldValue, params.newValue, params.resource);

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
