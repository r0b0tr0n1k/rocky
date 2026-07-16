// ── Geofence Test Factory ──
// Internal enums: FENCE_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { FENCE_TYPE, FENCE_TYPE_VALUES } from "@rocky/database/constants";
import { geofencesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type GeofenceRecord = InferSelectSchema<typeof geofencesSelectSchema>;

// Simple polygon geometry for testing
function createTestPolygon() {
  const centerLat = faker.location.latitude({ min: 40, max: 50 });
  const centerLng = faker.location.longitude({ min: 15, max: 25 });
  const offset = 0.01; // ~1km

  return {
    type: "Polygon" as const,
    coordinates: [
      [
        [centerLng - offset, centerLat - offset],
        [centerLng + offset, centerLat - offset],
        [centerLng + offset, centerLat + offset],
        [centerLng - offset, centerLat + offset],
        [centerLng - offset, centerLat - offset], // Close the polygon
      ],
    ],
  };
}

export class GeofenceFactory extends SchemaDataFactory<GeofenceRecord> {
  constructor(farmId: string) {
    super(geofencesSelectSchema, {
      id: faker.string.uuid(),
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      farmId,
      pastureId: null,
      geometry: createTestPolygon() as any,
      fenceType: faker.helpers.arrayElement(FENCE_TYPE_VALUES),
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
      // WO-110: nullable PostGIS foundation columns — populated only by real IoT writes
      polygon: null,
      cadastralReference: null,
      deforestationFreeSince: faker.date.past({ years: 2 }).toISOString().split("T")[0]!,
    });
  }

  createActive(overrides?: Partial<GeofenceRecord>): GeofenceRecord {
    return this.create({
      isActive: true,
      ...overrides,
    });
  }

  createInactive(overrides?: Partial<GeofenceRecord>): GeofenceRecord {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  createPasture(pastureId: string, overrides?: Partial<GeofenceRecord>): GeofenceRecord {
    return this.create({
      pastureId,
      fenceType: FENCE_TYPE.PASTURE_BOUNDARY,
      ...overrides,
    });
  }

  createPolygon(overrides?: Partial<GeofenceRecord>): GeofenceRecord {
    return this.create({
      fenceType: FENCE_TYPE.PASTURE_BOUNDARY,
      geometry: createTestPolygon() as any,
      ...overrides,
    });
  }

  createExclusion(overrides?: Partial<GeofenceRecord>): GeofenceRecord {
    return this.create({
      fenceType: FENCE_TYPE.EXCLUSION_ZONE,
      ...overrides,
    });
  }
}
