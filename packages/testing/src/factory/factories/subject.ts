// ── Subject (Keeper/Holder) Test Factory ──
// No internal enums — uses direct string fields
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { subjectsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type SubjectRecord = InferSelectSchema<typeof subjectsSelectSchema>;

export class SubjectFactory extends SchemaDataFactory<SubjectRecord> {
  constructor() {
    super(subjectsSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      shortName: faker.person.firstName(),
      shortNameAlt: faker.person.firstName(),
      firstName: faker.person.firstName(),
      firstNameAlt: faker.person.firstName(),
      lastName: faker.person.lastName(),
      lastNameAlt: faker.person.lastName(),
      companyName: null,
      personalId: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      vatNumber: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      addressId: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      validTo: null,
    });
  }

  createActive(overrides?: Partial<SubjectRecord>): SubjectRecord {
    return this.create({
      isActive: true,
      ...overrides,
    });
  }

  createInactive(overrides?: Partial<SubjectRecord>): SubjectRecord {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  createIndividual(overrides?: Partial<SubjectRecord>): SubjectRecord {
    return this.create({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      companyName: null,
      ...overrides,
    });
  }

  createCompany(overrides?: Partial<SubjectRecord>): SubjectRecord {
    return this.create({
      companyName: faker.company.name(),
      firstName: null,
      lastName: null,
      ...overrides,
    });
  }

  createWithContact(overrides?: Partial<SubjectRecord>): SubjectRecord {
    return this.create({
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      ...overrides,
    });
  }
}
