// ── Vaccine Batch (Health Bot) Test Factory ──
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { vaccineBatchesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type VaccineBatchRecord = InferSelectSchema<typeof vaccineBatchesSelectSchema>;

export class VaccineBatchFactory extends SchemaDataFactory<VaccineBatchRecord> {
  constructor(vaccineId: string) {
    const received = faker.number.int({ min: 50, max: 1000 });
    super(vaccineBatchesSelectSchema, {
      id: faker.string.uuid(),
      vaccineId,
      batchNo: `B${faker.string.alphanumeric({ length: 10 }).toUpperCase()}`,
      productionDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      expiryDate: faker.date.future({ years: 2 }).toISOString().split("T")[0],
      quantityReceived: received,
      quantityRemaining: received,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createExpired(overrides?: Partial<VaccineBatchRecord>): VaccineBatchRecord {
    return this.create({
      expiryDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      ...overrides,
    });
  }

  createLowStock(overrides?: Partial<VaccineBatchRecord>): VaccineBatchRecord {
    return this.create({
      quantityReceived: 100,
      quantityRemaining: faker.number.int({ min: 0, max: 5 }),
      ...overrides,
    });
  }
}
