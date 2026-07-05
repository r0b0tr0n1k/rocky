// --- RBAC Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { RbacService } from "@rocky/domains-rbac";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  assignRoleToUserRequestSchema,
  permissionResponseSchema,
  revokeRoleFromUserRequestSchema,
  roleResponseSchema,
  roleWithPermissionsResponseSchema,
  type AssignRoleToUserRequest,
  type PermissionResponse,
  type RevokeRoleFromUserRequest,
  type RoleResponse,
  type RoleWithPermissionsResponse,
} from "@rocky/validators/api";
import { RBAC_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { ProtectedMiddleware } from "../trpc/middlewares/protected.middleware.js";

const roleIdParam = z.object({ roleId: z.uuid() });
const unwrap = createResultUnwrapper(RBAC_TRPC_ERROR_MAP);

@Router({ alias: "rbac" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class RbacRouter {
  constructor(
    @Inject(RbacService) private readonly rbacService: RbacService,
  ) { }

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
