// ── Vaccination Test Factory ──
// Internal enums: ADMIN_ROUTE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { ADMIN_ROUTE, ADMIN_ROUTE_VALUES } from "@rocky/database/constants";
import { vaccinationsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type VaccinationRecord = InferSelectSchema<typeof vaccinationsSelectSchema>;

export class VaccinationFactory extends SchemaDataFactory<VaccinationRecord> {
  constructor(animalId: string, farmId: string, vaccineId: string, batchId: string, vetId: string) {
    super(vaccinationsSelectSchema, {
      id: faker.string.uuid(),
      animalId,
      farmId,
      vaccineId,
      batchId,
      vetId,
      adminDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0]!,
      route: faker.helpers.arrayElement(ADMIN_ROUTE_VALUES),
      notes: faker.lorem.sentence(),
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createIntramuscular(overrides?: Partial<VaccinationRecord>): VaccinationRecord {
    return this.create({
      route: ADMIN_ROUTE.INTRAMUSCULAR,
      ...overrides,
    });
  }

  createSubcutaneous(overrides?: Partial<VaccinationRecord>): VaccinationRecord {
    return this.create({
      route: ADMIN_ROUTE.SUBCUTANEOUS,
      ...overrides,
    });
  }
}
