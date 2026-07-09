// ── Sensor Reading Test Factory ──
// Internal enums: READING_TYPE, PROCESSING_STAGE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  PROCESSING_STAGE,
  PROCESSING_STAGE_VALUES,
  READING_TYPE,
  READING_TYPE_VALUES,
} from "@rocky/database/constants";
import { sensorReadingsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type SensorReadingRecord = InferSelectSchema<typeof sensorReadingsSelectSchema>;

export class SensorReadingFactory extends SchemaDataFactory<SensorReadingRecord> {
  constructor(deviceId: string, farmId?: string, animalId?: string) {
    super(sensorReadingsSelectSchema, {
      id: faker.string.uuid(),
      deviceId,
      animalId: animalId ?? null,
      farmId: farmId ?? null,
      recordedAt: faker.date.recent({ days: 1 }),
      ingestedAt: faker.date.recent({ days: 1 }),
      readingType: faker.helpers.arrayElement(READING_TYPE_VALUES),
      valueNumeric: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }).toString(),
      valueText: null,
      unit: faker.helpers.arrayElement(["°C", "bpm", "mg/dL", "pH"]),
      location: null, // PostGIS geometry - skip for tests
      rawPayload: JSON.stringify({
        sensorId: faker.string.uuid(),
        timestamp: faker.date.recent({ days: 1 }).toISOString(),
        value: faker.number.float({ min: 0, max: 100 }),
      }),
      processingStage: faker.helpers.arrayElement(PROCESSING_STAGE_VALUES),
      processedAt: null,
      createdAt: faker.date.recent({ days: 1 }),
    });
  }

  createTemperature(overrides?: Partial<SensorReadingRecord>): SensorReadingRecord {
    return this.create({
      readingType: READING_TYPE.TEMPERATURE,
      unit: "°C",
      valueNumeric: faker.number.float({ min: 35, max: 42, fractionDigits: 1 }).toString(),
      ...overrides,
    });
  }

  createHeartRate(overrides?: Partial<SensorReadingRecord>): SensorReadingRecord {
    return this.create({
      readingType: READING_TYPE.HEART_RATE,
      unit: "bpm",
      valueNumeric: faker.number.float({ min: 40, max: 120, fractionDigits: 0 }).toString(),
      ...overrides,
    });
  }

  createRaw(overrides?: Partial<SensorReadingRecord>): SensorReadingRecord {
    return this.create({
      processingStage: PROCESSING_STAGE.RAW,
      processedAt: null,
      ...overrides,
    });
  }

  createProcessed(overrides?: Partial<SensorReadingRecord>): SensorReadingRecord {
    return this.create({
      processingStage: PROCESSING_STAGE.VALIDATED,
      processedAt: faker.date.recent({ days: 1 }),
      ...overrides,
    });
  }

  createWithAnimal(animalId: string, overrides?: Partial<SensorReadingRecord>): SensorReadingRecord {
    return this.create({
      animalId,
      ...overrides,
    });
  }
}
