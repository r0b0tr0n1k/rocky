/**
 * RBAC Domain Service
 */

import type {
  RoleResponse,
  PermissionResponse,
  RoleWithPermissionsResponse,
  AssignRoleToUserRequest,
  RevokeRoleFromUserRequest,
} from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { RbacError, RBAC_ERRORS } from "../errors/rbac.errors.js";
import type { RbacRepository } from "../repositories/rbac.repository.js";

export class RbacService {
  constructor(private readonly repo: RbacRepository) {}

  async getAllRoles(): Promise<Result<RoleResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      return (await this.repo.findAllRoles()) as unknown as RoleResponse[];
    }, toAppError)();
  }

  async getRoleById(id: string): Promise<Result<RoleResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const role = await this.repo.findRoleById(id);
      if (!role) throw new RbacError(RBAC_ERRORS.ROLE_NOT_FOUND, { id });
      return role as unknown as RoleResponse;
    }, toAppError)();
  }

  async getAllPermissions(): Promise<Result<PermissionResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      return (await this.repo.findAllPermissions()) as unknown as PermissionResponse[];
    }, toAppError)();
  }

  async getRoleWithPermissions(roleId: string): Promise<Result<RoleWithPermissionsResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const role = await this.repo.findRoleById(roleId);
      if (!role) throw new RbacError(RBAC_ERRORS.ROLE_NOT_FOUND, { roleId });
      const perms = (await this.repo.findPermissionsForRole(roleId)) as unknown as { permission: unknown }[];
      const permissions = perms.map((p) => p.permission);
      return { ...role, permissions } as unknown as RoleWithPermissionsResponse;
    }, toAppError)();
  }

  async assignRoleToUser(input: AssignRoleToUserRequest): Promise<Result<{ assigned: boolean }, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findUserRoleAssignment(input.userId, input.roleId);
      if (existing) throw new RbacError(RBAC_ERRORS.ALREADY_ASSIGNED, { userId: input.userId, roleId: input.roleId });
      await this.repo.assignRoleToUser(input);
      return { assigned: true };
    }, toAppError)();
  }

  async revokeRoleFromUser(input: RevokeRoleFromUserRequest): Promise<Result<{ revoked: boolean }, Error>> {
    return fromAsyncThrowable(async () => {
      const deleted = await this.repo.revokeRoleFromUser(input.userId, input.roleId);
      if (!deleted)
        throw new RbacError(RBAC_ERRORS.USER_ROLE_NOT_FOUND, { userId: input.userId, roleId: input.roleId });
      return { revoked: true };
    }, toAppError)();
  }
}
