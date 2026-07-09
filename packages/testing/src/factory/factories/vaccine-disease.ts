// ── Vaccine-Disease Mapping (Health Bot) Test Factory ──
// M2M link: a vaccine protects against a disease
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { vaccineDiseasesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type VaccineDiseaseRecord = InferSelectSchema<typeof vaccineDiseasesSelectSchema>;

export class VaccineDiseaseFactory extends SchemaDataFactory<VaccineDiseaseRecord> {
  constructor(vaccineId: string, diseaseId: string) {
    super(vaccineDiseasesSelectSchema, {
      id: faker.string.uuid(),
      vaccineId,
      diseaseId,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
    });
  }
}
