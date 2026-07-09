// ── RBAC: Role-Permission Binding Test Factory ──
// Links a role to a permission (M2M binding)
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { rolePermissionsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type RolePermissionRecord = InferSelectSchema<typeof rolePermissionsSelectSchema>;

export class RolePermissionFactory extends SchemaDataFactory<RolePermissionRecord> {
  constructor(roleId: string, permissionId: string) {
    super(rolePermissionsSelectSchema, {
      id: faker.string.uuid(),
      roleId,
      permissionId,
      condition: null,
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  createWithCondition(
    condition: string,
    overrides?: Partial<RolePermissionRecord>,
  ): RolePermissionRecord {
    return this.create({ condition, ...overrides });
  }
}
