// WO-040 / WO-041 Validator Hardening - Runtime Smoke Test
// Mandated by workorder WO-040 ("needs a runtime smoke test before broad rollout").
// Verifies the Diamond Seal strictness contract from ADR-0018:
//   - WO-040: response schemas migrated .strip() -> .strict() must NOT reject keys
//             present in a real (full DB row) service response. The only unsafe case
//             is an omit()-based schema made .strict(); that trap is asserted absent.
//   - WO-041: create schemas derive via .pick() (not .omit()) on Insert schemas.
// Place: @rocky/testing (already depends on @rocky/validators + has factories + vitest).

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as api from "@rocky/validators/api";
import {
  AddressFactory,
  AnimalFactory,
  AnimalParentFactory,
  ArchiveDocumentFactory,
  AuditLogFactory,
  ErrorCorrectionFactory,
  DiseaseFactory,
  EarTagFactory,
  EarTagOrderFactory,
  EarTagTypeFactory,
  FarmBookFactory,
  FarmFactory,
  FarmSubjectFactory,
  AnimalGeofenceEventFactory,
  GeofenceFactory,
  InspectionFactory,
  IotDeviceFactory,
  LabTestFactory,
  MovementFactory,
  NotificationFactory,
  OrganizationFactory,
  CattlePassportFactory,
  PdaDeviceFactory,
  PermissionFactory,
  RoleFactory,
  SensorReadingFactory,
  SubjectFactory,
  TreatmentFactory,
  UserFactory,
  VaccinationFactory,
  VaccineFactory,
  VaccineBatchFactory,
  VaccineDiseaseFactory,
  VsAssignmentFactory,
  VsContractFactory,
  RiskAnalysisFactory,
} from "./factory/factories/index.js";

const uuid = () => crypto.randomUUID();

// Read the live validators/api source so we can statically assert the contract.
// Walk up from this file to the repo root, then resolve packages/validators/src/api.
// vitest may rewrite import.meta.url, so locate the dir by existence, not by relative path.
function resolveApiDir(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== dirname(dir)) {
    const candidate = join(dir, "packages/validators/src/api");
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error("could not locate packages/validators/src/api");
}
const apiDir = resolveApiDir();
function apiSources(): string[] {
  return readdirSync(apiDir)
    .filter((f: string) => f.endsWith(".api.ts"))
    .map((f: string) => readFileSync(join(apiDir, f), "utf8"));
}

// A *response* schema that omits fields yet is .strict() would reject keys present in a real
// (full DB row) service response - the WO-040 trap. Request schemas (client input) are
// legitimately .omit().strict(), so we scope this to *Response* schemas only.
function unsafeResponseSchemas(): string[] {
  const bad: string[] = [];
  for (const src of apiSources()) {
    for (const m of src.matchAll(/export const (\w*Response\w*)\s*=[\s\S]*?;/g)) {
      const chain = m[0];
      if (/\.omit\(/.test(chain) && /\.strict\(/.test(chain)) bad.push(m[1]);
    }
  }
  return bad;
}

// Map every Select-schema-derived response schema to a factory that builds a real full DB row.
// (moduleResponseSchema / systemParameterResponseSchema have no factories - covered by static + typecheck.)
type Ctor = new (...args: unknown[]) => { create: (o?: unknown) => unknown };
const ROW_BUILDERS: Record<string, [Ctor, unknown[]]> = {
  addressResponseSchema: [AddressFactory, [uuid()]],
  animalResponseSchema: [AnimalFactory, [uuid()]],
  animalParentResponseSchema: [AnimalParentFactory, [uuid(), uuid()]],
  archiveDocumentResponseSchema: [ArchiveDocumentFactory, []],
  auditResponseSchema: [AuditLogFactory, []],
  correctionResponseSchema: [ErrorCorrectionFactory, []],
  diseaseResponseSchema: [DiseaseFactory, []],
  earTagResponseSchema: [EarTagFactory, [uuid()]],
  earTagOrderResponseSchema: [EarTagOrderFactory, [uuid()]],
  earTagTypeResponseSchema: [EarTagTypeFactory, []],
  farmBookResponseSchema: [FarmBookFactory, [uuid()]],
  farmResponseSchema: [FarmFactory, [uuid()]],
  farmSubjectBindingResponseSchema: [FarmSubjectFactory, [uuid(), uuid()]],
  geofenceEventResponseSchema: [AnimalGeofenceEventFactory, [uuid(), uuid()]],
  geofenceResponseSchema: [GeofenceFactory, [uuid()]],
  inspectionResponseSchema: [InspectionFactory, [uuid(), uuid()]],
  iotDeviceResponseSchema: [IotDeviceFactory, []],
  labTestResponseSchema: [LabTestFactory, [uuid(), uuid(), uuid()]],
  movementResponseSchema: [MovementFactory, [uuid(), uuid()]],
  notificationResponseSchema: [NotificationFactory, [uuid()]],
  organizationResponseSchema: [OrganizationFactory, []],
  passportResponseSchema: [CattlePassportFactory, [uuid(), uuid()]],
  pdaDeviceResponseSchema: [PdaDeviceFactory, []],
  permissionResponseSchema: [PermissionFactory, []],
  roleResponseSchema: [RoleFactory, []],
  sensorReadingResponseSchema: [SensorReadingFactory, [uuid()]],
  subjectResponseSchema: [SubjectFactory, []],
  treatmentResponseSchema: [TreatmentFactory, [uuid(), uuid(), uuid()]],
  userResponseSchema: [UserFactory, []],
  vaccinationResponseSchema: [VaccinationFactory, [uuid(), uuid(), uuid(), uuid(), uuid()]],
  vaccineBatchResponseSchema: [VaccineBatchFactory, [uuid()]],
  vaccineDiseaseResponseSchema: [VaccineDiseaseFactory, [uuid(), uuid()]],
  vaccineResponseSchema: [VaccineFactory, []],
  vsAssignmentResponseSchema: [VsAssignmentFactory, [uuid(), uuid()]],
  vsContractResponseSchema: [VsContractFactory, [uuid()]],
};

function isTrap(issue: { code?: string; message?: string }): boolean {
  return issue?.code === "unrecognized_keys" || /unrecognized|unexpected key/i.test(issue?.message ?? "");
}

describe("WO-041: create schemas use .pick() not .omit() on Insert schemas", () => {
  it("no InsertSchema.omit in api sources", () => {
    const offenders = apiSources().filter((s) => /InsertSchema\.omit/.test(s));
    expect(offenders, "Found InsertSchema.omit - WO-041 requires .pick()").toEqual([]);
  });
});

describe("WO-040: omit-based RESPONSE schemas must NOT be .strict() (the unrecognized_keys trap)", () => {
  it("no *Response* schema is both .omit() and .strict()", () => {
    const offenders = unsafeResponseSchemas();
    expect(offenders, "Found response schema that omits fields yet is .strict() - would reject audit keys on full DB rows").toEqual([]);
  });
});


function runFullRow(name: string, Ctor: Ctor, args: unknown[]): void {
  const schema = (api as Record<string, unknown>)[name] as {
    safeParse: (d: unknown) => { success: boolean; error?: { issues: { code?: string; message?: string }[] } };
  };
  expect(schema, `schema ${name} must be exported`).toBeDefined();
  const inst: any = new Ctor(...args);
  const row: unknown = inst.create();
  const res = schema.safeParse(row);
  if (!res.success) {
    const issues = res.error ? res.error.issues : [];
    const trap = issues.filter(isTrap);
    expect(trap).toHaveLength(0);
  }
}

describe("WO-040 runtime: response schemas tolerate a real full DB row - no unrecognized keys", () => {
  for (const [name, [Ctor, args]] of Object.entries(ROW_BUILDERS)) {
    it(name, () => runFullRow(name, Ctor, args));
  }
});

describe("WO-040 runtime: special extend-based response", () => {
  it("roleWithPermissionsResponseSchema (kept .strip())", () => {
    const schema = (api as Record<string, unknown>).roleWithPermissionsResponseSchema as {
      safeParse: (d: unknown) => { success: boolean; error?: { issues: { code?: string; message?: string }[] } };
    };
    const row = { ...new RoleFactory().create(), permissions: [new PermissionFactory().create()] };
    const res = schema.safeParse(row);
    const ok = res.success || !(res.error ? res.error.issues : []).some(isTrap);
    expect(ok).toBe(true);
  });
});

describe("WO-040 runtime: object-strict response schemas parse their exact shape", () => {
  it("riskAnalysisListResponseSchema", () => {
    const schema = (api as Record<string, unknown>).riskAnalysisListResponseSchema as {
      safeParse: (d: unknown) => { success: boolean; error?: { issues: unknown[] } };
    };
    const res = schema.safeParse({ data: [new RiskAnalysisFactory().create()], total: 1 });
    expect(res.success).toBe(true);
  });
  it("pdaDeviceBlockedResponseSchema", () => {
    const schema = (api as Record<string, unknown>).pdaDeviceBlockedResponseSchema as {
      safeParse: (d: unknown) => { success: boolean };
    };
    expect(schema.safeParse({ blocked: true }).success).toBe(true);
  });
  it("vaccineDiseaseUnlinkResponseSchema", () => {
    const schema = (api as Record<string, unknown>).vaccineDiseaseUnlinkResponseSchema as {
      safeParse: (d: unknown) => { success: boolean };
    };
    expect(schema.safeParse({ deleted: true }).success).toBe(true);
  });
});
