// ── Treatment Test Factory ──
// Internal enums: none specific (uses diseaseId FK)
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { treatmentsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type TreatmentRecord = InferSelectSchema<typeof treatmentsSelectSchema>;

export class TreatmentFactory extends SchemaDataFactory<TreatmentRecord> {
  constructor(animalId: string, farmId: string, vetId: string, diseaseId?: string) {
    super(treatmentsSelectSchema, {
      id: faker.string.uuid(),
      animalId,
      farmId,
      diseaseId: diseaseId ?? null,
      vetId,
      diagnosisDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0]!,
      treatmentDesc: faker.lorem.sentence(),
      isolated: faker.datatype.boolean({ probability: 0.3 }),
      antibioticName: null,
      amrFlag: false,
      withdrawalPeriod: null,
      alertTriggeredAt: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 7 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createDiagnosis(overrides?: Partial<TreatmentRecord>): TreatmentRecord {
    return this.create(overrides);
  }

  createRoutineCheckup(overrides?: Partial<TreatmentRecord>): TreatmentRecord {
    return this.create({
      diseaseId: null,
      treatmentDesc: "Routine health checkup",
      ...overrides,
    });
  }

  createAMR(overrides?: Partial<TreatmentRecord>): TreatmentRecord {
    return this.create({
      antibioticName: faker.company.name() + " Antibiotic",
      amrFlag: true,
      withdrawalPeriod: faker.number.int({ min: 7, max: 30 }),
      ...overrides,
    });
  }
}
