/**
 * RBAC Repository
 */

import { eq, and } from "drizzle-orm";
import {
  roles as rolesTable,
  permissions as permissionsTable,
  rolePermissions as rolePermissionsTable,
  userRoles as userRolesTable,
} from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class RbacRepository extends BaseRepository {

  // ── Roles ──

  async findAllRoles() {
    return this.client.select().from(rolesTable);
  }

  async findRoleById(id: string) {
    const [row] = await this.client.select().from(rolesTable).where(eq(rolesTable.id, id)).limit(1);
    return row ?? null;
  }

  async findRoleByName(name: string) {
    const [row] = await this.client.select().from(rolesTable).where(eq(rolesTable.name, name)).limit(1);
    return row ?? null;
  }

  async insertRole(data: typeof rolesTable.$inferInsert): Promise<typeof rolesTable.$inferSelect | null> {
    const [row] = await this.client.insert(rolesTable).values(data).returning();
    return row ?? null;
  }

  // ── Permissions ──

  async findAllPermissions() {
    return this.client.select().from(permissionsTable);
  }

  async findPermissionById(id: string) {
    const [row] = await this.client.select().from(permissionsTable).where(eq(permissionsTable.id, id)).limit(1);
    return row ?? null;
  }

  // ── Role-Permission Bindings ──

  async findPermissionsForRole(roleId: string): Promise<Array<{ permission: typeof permissionsTable.$inferSelect }>> {
    return this.client
      .select({ permission: permissionsTable })
      .from(rolePermissionsTable)
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(eq(rolePermissionsTable.roleId, roleId));
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    const [row] = await this.client.insert(rolePermissionsTable).values({ roleId, permissionId }).returning();
    return row ?? null;
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    await this.client
      .delete(rolePermissionsTable)
      .where(and(eq(rolePermissionsTable.roleId, roleId), eq(rolePermissionsTable.permissionId, permissionId)));
  }

  // ── User-Role Assignments ──

  async findRolesForUser(userId: string) {
    const rows = await this.client
      .select({ role: rolesTable, userRole: userRolesTable })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, userId));
    return rows;
  }

  async findUserRoleAssignment(userId: string, roleId: string) {
    const [row] = await this.client
      .select()
      .from(userRolesTable)
      .where(and(eq(userRolesTable.userId, userId), eq(userRolesTable.roleId, roleId)))
      .limit(1);
    return row ?? null;
  }

  async assignRoleToUser(data: typeof userRolesTable.$inferInsert): Promise<typeof userRolesTable.$inferSelect | null> {
    const [row] = await this.client.insert(userRolesTable).values(data).returning();
    return row ?? null;
  }

  async revokeRoleFromUser(userId: string, roleId: string) {
    const [row] = await this.client
      .delete(userRolesTable)
      .where(and(eq(userRolesTable.userId, userId), eq(userRolesTable.roleId, roleId)))
      .returning({ id: userRolesTable.id });
    return row ?? null;
  }
}
