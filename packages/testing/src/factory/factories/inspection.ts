// ── Inspection Test Factory ──
// Internal enums: INSPECTION_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { INSPECTION_STATUS, INSPECTION_STATUS_VALUES } from "@rocky/database/constants";
import { inspectionsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type InspectionRecord = InferSelectSchema<typeof inspectionsSelectSchema>;

export class InspectionFactory extends SchemaDataFactory<InspectionRecord> {
  constructor(farmId: string, inspectorId: string) {
    super(inspectionsSelectSchema, {
      id: faker.string.uuid(),
      farmId,
      inspectorId,
      status: faker.helpers.arrayElement(INSPECTION_STATUS_VALUES),
      scheduledDate: faker.date.soon({ days: 30 }).toISOString().split("T")[0]!,
      inspectionDate: null,
      riskScore: null,
      riskCriteria: null,
      selectedByRiskAnalysis: false,
      result: null,
      notes: null,
      discrepanciesFound: false,
      checkedAnimals: null,
      formPrinted: false,
      formReturned: false,
      keeperSigned: false,
      signedAt: null,
      storedAtVi: false,
      retentionExpiry: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createScheduled(overrides?: Partial<InspectionRecord>): InspectionRecord {
    return this.create({
      status: INSPECTION_STATUS.SCHEDULED,
      ...overrides,
    });
  }

  createInProgress(overrides?: Partial<InspectionRecord>): InspectionRecord {
    return this.create({
      status: INSPECTION_STATUS.IN_PROGRESS,
      inspectionDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0]!,
      ...overrides,
    });
  }

  createCompleted(overrides?: Partial<InspectionRecord>): InspectionRecord {
    return this.create({
      status: INSPECTION_STATUS.COMPLETED,
      inspectionDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0]!,
      result: faker.lorem.words(3).slice(0, 50),
      notes: faker.lorem.sentence(),
      discrepanciesFound: faker.datatype.boolean(),
      ...overrides,
    });
  }

  createCancelled(overrides?: Partial<InspectionRecord>): InspectionRecord {
    return this.create({
      status: INSPECTION_STATUS.CANCELLED,
      ...overrides,
    });
  }

  createWithRiskAnalysis(overrides?: Partial<InspectionRecord>): InspectionRecord {
    return this.create({
      selectedByRiskAnalysis: true,
      riskScore: faker.helpers.arrayElement(["LOW", "MEDIUM", "HIGH"]),
      riskCriteria: faker.lorem.sentence(),
      ...overrides,
    });
  }

  createWithForm(overrides?: Partial<InspectionRecord>): InspectionRecord {
    return this.create({
      formPrinted: true,
      formReturned: true,
      keeperSigned: true,
      signedAt: faker.date.recent({ days: 3 }),
      checkedAnimals: JSON.stringify({
        total: faker.number.int({ min: 5, max: 50 }),
        tagged: faker.number.int({ min: 3, max: 45 }),
        discrepancies: faker.number.int({ min: 0, max: 5 }),
      }),
      ...overrides,
    });
  }
}
