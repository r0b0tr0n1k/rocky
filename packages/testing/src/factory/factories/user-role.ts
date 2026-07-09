// ── RBAC: User-Role Mapping Test Factory ──
// Links a user to a role (M2M), optionally scoped to org/farm
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { userRolesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type UserRoleRecord = InferSelectSchema<typeof userRolesSelectSchema>;

export class UserRoleFactory extends SchemaDataFactory<UserRoleRecord> {
  constructor(userId: string, roleId: string) {
    super(userRolesSelectSchema, {
      id: faker.string.uuid(),
      userId,
      roleId,
      scopeOrgId: null,
      scopeFarmId: null,
      validFrom: null,
      validTo: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
    });
  }

  createScopedToOrg(
    scopeOrgId: string,
    overrides?: Partial<UserRoleRecord>,
  ): UserRoleRecord {
    return this.create({ scopeOrgId, ...overrides });
  }

  createScopedToFarm(
    scopeFarmId: string,
    overrides?: Partial<UserRoleRecord>,
  ): UserRoleRecord {
    return this.create({ scopeFarmId, ...overrides });
  }
}
