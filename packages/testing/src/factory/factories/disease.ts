// ── Disease (Health Bot) Test Factory ──
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  DISEASE_CATEGORY,
  DISEASE_CATEGORY_VALUES,
  CONTROL_MEASURES,
  CONTROL_MEASURES_VALUES,
} from "@rocky/database/constants";
import { diseasesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type DiseaseRecord = InferSelectSchema<typeof diseasesSelectSchema>;

export class DiseaseFactory extends SchemaDataFactory<DiseaseRecord> {
  constructor() {
    super(diseasesSelectSchema, {
      id: faker.string.uuid(),
      name: `Disease ${faker.string.alphanumeric({ length: 6 }).toUpperCase()}`,
      notifiable: false,
      description: faker.lorem.sentence(),
      diseaseCategory: faker.helpers.arrayElement(DISEASE_CATEGORY_VALUES),
      diseaseCategories: [faker.helpers.arrayElement(DISEASE_CATEGORY_VALUES)],
      listedDisease: true,
      legalBasis: faker.lorem.words(3),
      woahCode: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      euAnnexRef: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      controlMeasures: faker.helpers.arrayElement(CONTROL_MEASURES_VALUES),
      quarantineDays: faker.number.int({ min: 7, max: 60 }),
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createNotifiable(overrides?: Partial<DiseaseRecord>): DiseaseRecord {
    return this.create({ notifiable: true, ...overrides });
  }

  createInactive(overrides?: Partial<DiseaseRecord>): DiseaseRecord {
    return this.create({ isActive: false, ...overrides });
  }
}
