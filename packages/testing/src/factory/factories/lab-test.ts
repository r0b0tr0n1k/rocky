// ── Lab Test Test Factory ──
// Internal enums: TEST_TYPE, TEST_RESULT
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  SAMPLE_STATUS,
  SAMPLE_STATUS_VALUES,
  TEST_TYPE,
  TEST_TYPE_VALUES,
  TEST_RESULT,
  TEST_RESULT_VALUES,
} from "@rocky/database/constants";
import { labTestsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type LabTestRecord = InferSelectSchema<typeof labTestsSelectSchema>;

export class LabTestFactory extends SchemaDataFactory<LabTestRecord> {
  constructor(animalId: string, farmId: string, diseaseId: string) {
    super(labTestsSelectSchema, {
      id: faker.string.uuid(),
      animalId,
      farmId,
      diseaseId,
      sampleStatus: faker.helpers.arrayElement(SAMPLE_STATUS_VALUES),
      testType: faker.helpers.arrayElement(TEST_TYPE_VALUES),
      testMethod: faker.lorem.words(3),
      result: faker.helpers.arrayElement(TEST_RESULT_VALUES),
      resultNumeric: null,
      resultUnit: null,
      interpretation: null,
      labName: faker.company.name(),
      labSampleId: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      sampleDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0]!,
      resultDate: faker.date.recent({ days: 3 }).toISOString().split("T")[0]!,
      certificateRef: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 7 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPositive(overrides?: Partial<LabTestRecord>): LabTestRecord {
    return this.create({
      result: TEST_RESULT.POSITIVE,
      ...overrides,
    });
  }

  createNegative(overrides?: Partial<LabTestRecord>): LabTestRecord {
    return this.create({
      result: TEST_RESULT.NEGATIVE,
      ...overrides,
    });
  }

  createSerology(overrides?: Partial<LabTestRecord>): LabTestRecord {
    return this.create({
      testType: TEST_TYPE.SEROLOGY,
      ...overrides,
    });
  }

  createPCR(overrides?: Partial<LabTestRecord>): LabTestRecord {
    return this.create({
      testType: TEST_TYPE.PCR,
      ...overrides,
    });
  }
}
