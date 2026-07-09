// ── Animal Geofence Event Test Factory ──
// Internal enums: GEOFENCE_EVENT_TYPE, GEOFENCE_EVENT_SOURCE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  GEOFENCE_EVENT_SOURCE,
  GEOFENCE_EVENT_SOURCE_VALUES,
  GEOFENCE_EVENT_TYPE,
  GEOFENCE_EVENT_TYPE_VALUES,
} from "@rocky/database/constants";
import { animalGeofenceEventsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type AnimalGeofenceEventRecord = InferSelectSchema<typeof animalGeofenceEventsSelectSchema>;

export class AnimalGeofenceEventFactory extends SchemaDataFactory<AnimalGeofenceEventRecord> {
  constructor(animalId: string, geofenceId: string, farmId?: string) {
    super(animalGeofenceEventsSelectSchema, {
      id: faker.string.uuid(),
      animalId,
      geofenceId,
      farmId: farmId ?? null,
      eventType: faker.helpers.arrayElement(GEOFENCE_EVENT_TYPE_VALUES),
      eventAt: faker.date.recent({ days: 7 }),
      location: null, // PostGIS geometry - skip for tests
      source: faker.helpers.arrayElement(GEOFENCE_EVENT_SOURCE_VALUES),
      createdAt: faker.date.recent({ days: 7 }),
    });
  }

  createEntry(overrides?: Partial<AnimalGeofenceEventRecord>): AnimalGeofenceEventRecord {
    return this.create({
      eventType: GEOFENCE_EVENT_TYPE.ENTERED,
      ...overrides,
    });
  }

  createExit(overrides?: Partial<AnimalGeofenceEventRecord>): AnimalGeofenceEventRecord {
    return this.create({
      eventType: GEOFENCE_EVENT_TYPE.EXITED,
      ...overrides,
    });
  }

  createManual(overrides?: Partial<AnimalGeofenceEventRecord>): AnimalGeofenceEventRecord {
    return this.create({
      source: GEOFENCE_EVENT_SOURCE.MANUAL,
      ...overrides,
    });
  }

  createAutomated(overrides?: Partial<AnimalGeofenceEventRecord>): AnimalGeofenceEventRecord {
    return this.create({
      source: GEOFENCE_EVENT_SOURCE.AUTOMATED,
      ...overrides,
    });
  }

  createWithLocation(overrides?: Partial<AnimalGeofenceEventRecord>): AnimalGeofenceEventRecord {
    return this.create({
      location: `POINT(${faker.location.longitude()} ${faker.location.latitude()})` as any,
      ...overrides,
    });
  }
}
