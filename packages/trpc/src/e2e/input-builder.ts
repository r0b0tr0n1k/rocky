// ── Factory / schema-derived input builder ──
//
// Produces a schema-valid tRPC input for any procedure. The walker
// (`schema-walker.ts`) is the universal primitive and ALWAYS yields a valid
// input. For entity routers we additionally reuse the existing
// `@rocky/testing` factories (Diamond Seal) to overlay realistic values onto
// any optional field the walker left undefined — purely for realism; the walker
// alone already guarantees validity, so any factory failure is caught and
// ignored (the walker result stands).

import { faker } from "@faker-js/faker";
import { derive } from "./schema-walker.js";
import {
  AnimalFactory,
  FarmFactory,
  MovementFactory,
  InspectionFactory,
  CattlePassportFactory,
  UserFactory,
  RoleFactory,
  VaccinationFactory,
  EarTagFactory,
  ArchiveDocumentFactory,
  NotificationFactory,
  OrganizationFactory,
  SubjectFactory,
  AuditLogFactory,
  IotDeviceFactory,
  VsAssignmentFactory,
  VsContractFactory,
  PdaDeviceFactory,
  DiseaseFactory,
  SensorReadingFactory,
  ErrorCorrectionFactory,
  GeofenceFactory,
} from "@rocky/testing/factory";

// biome-ignore-all lint/suspicious/noExplicitAny: test builder

function safeFactory(fn: () => Record<string, unknown>): Record<string, unknown> | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

/** Routers that have a `@rocky/testing` factory; keyed by tRPC router alias. */
const FACTORY_BY_ROUTER: Record<string, () => Record<string, unknown> | null> = {
  animal: () => safeFactory(() => new AnimalFactory(faker.string.uuid()).create()),
  farm: () => safeFactory(() => new FarmFactory(faker.string.uuid()).create()),
  movement: () => safeFactory(() => new MovementFactory(faker.string.uuid(), faker.string.uuid()).create()),
  inspection: () => safeFactory(() => new InspectionFactory(faker.string.uuid(), faker.string.uuid()).create()),
  passport: () => safeFactory(() => new CattlePassportFactory(faker.string.uuid(), faker.string.uuid()).create()),
  user: () => safeFactory(() => new UserFactory().create()),
  rbac: () => safeFactory(() => new RoleFactory().create()),
  health: () =>
    safeFactory(() =>
      new VaccinationFactory(
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
      ).create(),
    ),
  eartag: () => safeFactory(() => new EarTagFactory(faker.string.uuid()).create()),
  archive: () => safeFactory(() => new ArchiveDocumentFactory(faker.string.uuid()).create()),
  notification: () => safeFactory(() => new NotificationFactory(faker.string.uuid()).create()),
  organization: () => safeFactory(() => new OrganizationFactory().create()),
  subject: () => safeFactory(() => new SubjectFactory().create()),
  audit: () => safeFactory(() => new AuditLogFactory().create()),
  iot: () => safeFactory(() => new IotDeviceFactory().create()),
  "vs-assignment": () => safeFactory(() => new VsAssignmentFactory(faker.string.uuid(), faker.string.uuid()).create()),
  "vs-contract": () => safeFactory(() => new VsContractFactory(faker.string.uuid()).create()),
  device: () => safeFactory(() => new PdaDeviceFactory().create()),
  geo: () => safeFactory(() => new GeofenceFactory(faker.string.uuid()).create()),
  disease: () => safeFactory(() => new DiseaseFactory().create()),
  "sensor-reading": () => safeFactory(() => new SensorReadingFactory(faker.string.uuid()).create()),
  correction: () => safeFactory(() => new ErrorCorrectionFactory().create()),
};

/**
 * Build a schema-valid input for a procedure input schema.
 * Prefers the factory (realism) where one exists, then fills any remaining
 * fields from the schema-walker. No hand-written literals or enums.
 */
export function buildInput(routerAlias: string, inputSchema: any): any {
  const base = derive(inputSchema) as Record<string, unknown>;
  const fac = FACTORY_BY_ROUTER[routerAlias];
  if (fac) {
    const entity = fac();
    // Override the walker-derived value with the factory's Diamond-Seal-valid
    // one wherever the select record carries the same key AND a real (non-null)
    // value. The request schema is a subset of the select schema, so factory
    // values are always valid for the request — this also satisfies fields
    // whose schema embeds a throwing refine (e.g. the MK_8 ear-tag "first 8
    // digits" check) that the walker cannot otherwise generate. Null/undefined
    // factory values are NOT copied (they would clobber valid walker values).
    if (entity) {
      for (const k of Object.keys(base)) {
        if (entity[k] != null) base[k] = entity[k];
      }
    }
  }
  return base;
}
