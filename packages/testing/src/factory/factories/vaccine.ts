// ── Vaccine (Health Bot) Test Factory ──
// Internal enums: VACCINE_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { VACCINE_TYPE, VACCINE_TYPE_VALUES } from "@rocky/database/constants";
import { vaccinesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type VaccineRecord = InferSelectSchema<typeof vaccinesSelectSchema>;

export class VaccineFactory extends SchemaDataFactory<VaccineRecord> {
  constructor() {
    super(vaccinesSelectSchema, {
      id: faker.string.uuid(),
      name: `Vaccine ${faker.string.alphanumeric({ length: 6 }).toUpperCase()}`,
      manufacturer: faker.company.name(),
      type: faker.helpers.arrayElement(VACCINE_TYPE_VALUES),
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createLive(overrides?: Partial<VaccineRecord>): VaccineRecord {
    return this.create({ type: VACCINE_TYPE.LIVE, ...overrides });
  }

  createInactivated(overrides?: Partial<VaccineRecord>): VaccineRecord {
    return this.create({ type: VACCINE_TYPE.INACTIVATED, ...overrides });
  }

  createInactive(overrides?: Partial<VaccineRecord>): VaccineRecord {
    return this.create({ isActive: false, ...overrides });
  }
}
