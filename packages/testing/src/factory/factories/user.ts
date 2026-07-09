// ── User (Better Auth) Test Factory ──
// Internal enums: USER_ROLE, USER_STATUS, LANGUAGE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  LANGUAGE,
  LANGUAGE_VALUES,
  USER_ROLE,
  USER_ROLE_VALUES,
  USER_STATUS,
  USER_STATUS_VALUES,
} from "@rocky/database/constants";
import { usersSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type UserRecord = InferSelectSchema<typeof usersSelectSchema>;

export class UserFactory extends SchemaDataFactory<UserRecord> {
  constructor() {
    super(usersSelectSchema, {
      id: faker.string.uuid(),
      authUserId: faker.string.uuid(), // Better Auth user ID
      username: faker.internet.username(),
      email: faker.internet.email(),
      passwordHash: null, // Deprecated - Better Auth handles
      mfaEnabled: false, // Deprecated - Better Auth handles
      mfaSecret: null, // Deprecated - Better Auth handles
      firstName: faker.person.firstName(),
      firstNameAlt: faker.person.firstName(),
      lastName: faker.person.lastName(),
      lastNameAlt: faker.person.lastName(),
      mobilePhone: faker.phone.number(),
      mobileVerified: faker.datatype.boolean(),
      deviceId: null,
      role: faker.helpers.arrayElement(USER_ROLE_VALUES),
      organizationId: null,
      language: faker.helpers.arrayElement(LANGUAGE_VALUES),
      geoUnlimited: faker.datatype.boolean(),
      lastLoginAt: faker.date.recent({ days: 30 }),
      status: faker.helpers.arrayElement(USER_STATUS_VALUES),
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createSuperAdmin(overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      role: USER_ROLE.SUPER_ADMIN,
      ...overrides,
    });
  }

  createVdAdmin(overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      role: USER_ROLE.VD_ADMIN,
      ...overrides,
    });
  }

  createVdStaff(overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      role: USER_ROLE.VD_STAFF,
      ...overrides,
    });
  }

  createFarmer(overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      role: USER_ROLE.FARMER,
      ...overrides,
    });
  }

  createActive(overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      status: USER_STATUS.ACTIVE,
      ...overrides,
    });
  }

  createBlocked(overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      status: USER_STATUS.BLOCKED,
      ...overrides,
    });
  }

  createWithOrganization(organizationId: string, overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      organizationId,
      ...overrides,
    });
  }

  createWithMobile(mobilePhone: string, overrides?: Partial<UserRecord>): UserRecord {
    return this.create({
      mobilePhone,
      mobileVerified: true,
      ...overrides,
    });
  }
}
