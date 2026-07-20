import { AUDIT_ACTION, EVENT_SOURCE } from "@rocky/database/constants";
import { EXECUTION_CONTEXT_CLS_KEY, type ExecutionContext } from "@rocky/execution";
import type { ClsService } from "nestjs-cls";
import { describe, expect, it, vi } from "vitest";
import type { AuditLogInsert, AuditRepository } from "../repositories/audit.repository.js";
import { AuditService } from "./audit.service.js";

// In-memory stub repository: captures the payload handed to insert() so we can
// assert that PII is masked *before* it would ever reach the database.
function stubRepo() {
  const inserted: AuditLogInsert[] = [];
  const repo = {
    insert: vi.fn(async (data: AuditLogInsert) => {
      inserted.push(data);
      return data;
    }),
    list: vi.fn(async () => ({ data: [], total: 0 })),
  } as unknown as AuditRepository & { inserted: AuditLogInsert[] };
  (repo as AuditRepository & { inserted: AuditLogInsert[] }).inserted = inserted;
  return repo as AuditRepository & { inserted: AuditLogInsert[] };
}

describe("AuditService masking (WO-159 Part 2 / ISO 27701 A.1.4.x / GDPR Art.25)", () => {
  it("redacts registered PII columns in oldValue/newValue but keeps traceability fields", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    const result = await svc.recordUpdate({
      resource: "subject",
      resourceId: "s1",
      oldValue: { id: "s1", firstName: "Jane", lastName: "Doe", status: "active" },
      newValue: { id: "s1", firstName: "Jane", lastName: "Smith", status: "suspended" },
      userId: "u1",
    });
    expect(result.isOk()).toBe(true);

    const row = repo.inserted[0]!;
    // PII columns (subjects.firstName/lastName) are masked
    expect(row.oldValue?.firstName).toBe("<redacted>");
    expect(row.oldValue?.lastName).toBe("<redacted>");
    expect(row.newValue?.lastName).toBe("<redacted>");
    // Non-PII traceability fields survive (status change must stay auditable)
    expect(row.oldValue?.status).toBe("active");
    expect(row.newValue?.status).toBe("suspended");
  });

  it("redacts PII values inside the field-level diff but keeps the changed field name", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    await svc.recordUpdate({
      resource: "subject",
      resourceId: "s1",
      oldValue: { id: "s1", firstName: "Jane", lastName: "Doe", status: "active" },
      newValue: { id: "s1", firstName: "Jane", lastName: "Smith", status: "suspended" },
      userId: "u1",
    });

    const row = repo.inserted[0]!;
    // lastName changed -> field name retained, values masked
    expect(row.changes?.lastName).toEqual({ old: "<redacted>", new: "<redacted>" });
    // status changed (non-PII) -> verbatim, still auditable
    expect(row.changes?.status).toEqual({ old: "active", new: "suspended" });
    // unchanged field is absent from the diff
    expect(row.changes?.firstName).toBeUndefined();
  });

  it("resolves the registry via the tolerant singular->plural mapping (resource 'farm' -> table 'farms')", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    await svc.recordUpdate({
      resource: "farm",
      resourceId: "f1",
      oldValue: { id: "f1", name: "Farm A", location: { lat: 41.9, lng: 21.4 }, addressId: "a1" },
      newValue: { id: "f1", name: "Farm A", location: { lat: 41.9, lng: 21.4 }, addressId: "a2" },
      userId: "u1",
    });

    const row = repo.inserted[0]!;
    // farms.location (geo PII) and farms.addressId (linkage PII) are masked
    expect(row.oldValue?.location).toBe("<redacted>");
    expect(row.oldValue?.addressId).toBe("<redacted>");
    // Non-PII field survives
    expect(row.oldValue?.name).toBe("Farm A");
    expect(row.changes?.addressId).toEqual({ old: "<redacted>", new: "<redacted>" });
  });

  it("passes through resources with no registry entry (no false masking)", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    await svc.recordUpdate({
      resource: "passport",
      resourceId: "p1",
      oldValue: { id: "p1", holderName: "Private Person", status: "active" },
      newValue: { id: "p1", holderName: "Private Person", status: "seized" },
      userId: "u1",
    });

    const row = repo.inserted[0]!;
    // 'passport' is not yet in the PII registry -> no masking occurs (documents
    // the registry coverage gap; see WO-159 follow-up for animal/passport/etc.)
    expect(row.oldValue?.holderName).toBe("Private Person");
    expect(row.changes?.status).toEqual({ old: "active", new: "seized" });
  });
});

describe("AuditService objective diffs (WO-159 Remediation A)", () => {
  it("records a factual field-level diff with no non-factual commentary injected", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    await svc.recordUpdate({
      resource: "animal",
      resourceId: "a1",
      oldValue: { id: "a1", status: "alive" },
      newValue: { id: "a1", status: "slaughtered" },
      userId: "u1",
    });

    const row = repo.inserted[0]!;
    // The status change is recorded...
    expect(row.changes?.status).toEqual({ old: "alive", new: "slaughtered" });
    // ...but no ideological/editorial commentary is injected into the audit record
    expect(row.changes?._biopolitical_reality).toBeUndefined();
    expect(row.changes?._bureaucratic_translation).toBeUndefined();
    expect(row.changes?._ideological_subtext).toBeUndefined();
  });
});

describe("AuditService CUD action mapping (WO-159 Part 4)", () => {
  it("recordCreate persists action=CREATE with no oldValue", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    const result = await svc.recordCreate({
      resource: "farm",
      resourceId: "f1",
      newValue: { id: "f1", name: "Farm A" },
      userId: "u1",
    });

    expect(result.isOk()).toBe(true);
    const row = repo.inserted[0]!;
    expect(row.action).toBe(AUDIT_ACTION.CREATE);
    expect(row.oldValue).toBeNull();
    expect(row.newValue).toMatchObject({ name: "Farm A" });
    expect(row.userId).toBe("u1");
    expect(row.source).toBe(EVENT_SOURCE.API);
    expect(row.success).toBe(true);
  });

  it("recordUpdate persists action=UPDATE carrying old+new", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    await svc.recordUpdate({
      resource: "animal",
      resourceId: "a1",
      oldValue: { id: "a1", status: "alive" },
      newValue: { id: "a1", status: "slaughtered" },
      userId: "u2",
    });

    const row = repo.inserted[0]!;
    expect(row.action).toBe(AUDIT_ACTION.UPDATE);
    expect(row.oldValue).toMatchObject({ status: "alive" });
    expect(row.newValue).toMatchObject({ status: "slaughtered" });
  });

  it("recordDelete persists action=DELETE with oldValue only", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo);

    await svc.recordDelete({
      resource: "earTagOrder",
      resourceId: "o1",
      oldValue: { id: "o1", status: "DRAFT" },
      userId: "u3",
    });

    const row = repo.inserted[0]!;
    expect(row.action).toBe(AUDIT_ACTION.DELETE);
    expect(row.newValue).toBeNull();
    expect(row.oldValue).toMatchObject({ status: "DRAFT" });
  });
});

describe("AuditService request context capture (WO-159 Remediation B)", () => {
  function stubCls(ctx?: ExecutionContext): ClsService {
    return {
      get: (key: string) => (key === EXECUTION_CONTEXT_CLS_KEY ? ctx : undefined),
    } as unknown as ClsService;
  }

  const ctx = {
    request: { ip: "10.0.0.5", userAgent: "vitest-agent", headers: {}, transport: "http" },
    runtime: { traceId: "trace-abc-123" },
  } as unknown as ExecutionContext;

  it("captures ip/userAgent/sessionId(traceId) from the execution CLS when no explicit request", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo, stubCls(ctx));

    await svc.recordUpdate({
      resource: "farm",
      resourceId: "f9",
      oldValue: { name: "old" },
      newValue: { name: "new" },
      userId: "u1",
    });

    const row = repo.inserted[0]!;
    expect(row.ipAddress).toBe("10.0.0.5");
    expect(row.userAgent).toBe("vitest-agent");
    expect(row.sessionId).toBe("trace-abc-123");
  });

  it("explicit request override takes precedence over the execution CLS", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo, stubCls(ctx));

    await svc.recordUpdate({
      resource: "farm",
      resourceId: "f9",
      oldValue: { name: "old" },
      newValue: { name: "new" },
      userId: "u1",
      request: { ip: "1.2.3.4", userAgent: "explicit-ua" },
      sessionId: "explicit-session",
    });

    const row = repo.inserted[0]!;
    expect(row.ipAddress).toBe("1.2.3.4");
    expect(row.userAgent).toBe("explicit-ua");
    expect(row.sessionId).toBe("explicit-session");
  });

  it("falls back to null context (no CLS) without throwing", async () => {
    const repo = stubRepo();
    const svc = new AuditService(repo); // no cls

    const result = await svc.recordUpdate({
      resource: "farm",
      resourceId: "f9",
      oldValue: { name: "old" },
      newValue: { name: "new" },
      userId: "u1",
    });

    expect(result.isOk()).toBe(true);
    const row = repo.inserted[0]!;
    expect(row.ipAddress).toBeUndefined();
    expect(row.userAgent).toBeUndefined();
    expect(row.sessionId).toBeUndefined();
  });
});
