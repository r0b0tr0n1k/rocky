// --- RBAC Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { RbacService } from "@rocky/domains-rbac/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type AssignRoleToUserRequest,
  assignRoleToUserRequestSchema,
  type PermissionResponse,
  permissionResponseSchema,
  type RevokeRoleFromUserRequest,
  type RoleResponse,
  type RoleWithPermissionsResponse,
  revokeRoleFromUserRequestSchema,
  roleResponseSchema,
  roleWithPermissionsResponseSchema,
} from "@rocky/validators/api/index.js";
import { RBAC_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const roleIdParam = z.object({ roleId: z.uuid() });
const unwrap = createResultUnwrapper(RBAC_TRPC_ERROR_MAP);

@Router({ alias: "rbac" })
@RegisterPolicy("rbac")
@Policy({ authenticated: true })
@Injectable()
export class RbacRouter {
  constructor(@Inject(RbacService) private readonly rbacService: RbacService) {}

  @Query({ output: z.array(roleResponseSchema) })
  async listRoles(): Promise<RoleResponse[]> {
    return unwrap(await this.rbacService.getAllRoles());
  }

  @Query({ input: roleIdParam, output: roleWithPermissionsResponseSchema })
  async getRole(@Input() input: { roleId: string }): Promise<RoleWithPermissionsResponse> {
    return unwrap(await this.rbacService.getRoleWithPermissions(input.roleId));
  }

  @Query({ output: z.array(permissionResponseSchema) })
  async listPermissions(): Promise<PermissionResponse[]> {
    return unwrap(await this.rbacService.getAllPermissions());
  }

  @Mutation({ input: assignRoleToUserRequestSchema, output: z.object({ assigned: z.boolean() }) })
  async assignRole(@Input() input: AssignRoleToUserRequest): Promise<{ assigned: boolean }> {
    return unwrap(await this.rbacService.assignRoleToUser(input));
  }

  @Mutation({ input: revokeRoleFromUserRequestSchema, output: z.object({ revoked: z.boolean() }) })
  async revokeRole(@Input() input: RevokeRoleFromUserRequest): Promise<{ revoked: boolean }> {
    return unwrap(await this.rbacService.revokeRoleFromUser(input));
  }
}
