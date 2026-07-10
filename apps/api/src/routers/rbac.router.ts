// --- RBAC Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { OverridePolicy, Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { RbacService } from "@rocky/domains-rbac/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import type { AppContext } from "@rocky/trpc/index.js";
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
import { Input, Mutation, Query, Ctx, Router } from "nestjs-trpc";
import { z } from "zod";
import type { NoDrift, ActivateGuillotines } from "@rocky/validators/utils";

const roleIdParam = z.object({ roleId: z.uuid() });
const unwrap = createResultUnwrapper(RBAC_TRPC_ERROR_MAP);

// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const roleListSchema = z.array(roleResponseSchema);
const permissionListSchema = z.array(permissionResponseSchema);
const myPermissionsOutputSchema = z.object({
  permissions: z.array(z.string()),
  roles: z.array(z.string()),
});
const assignedResultSchema = z.object({ assigned: z.boolean() });
const revokedResultSchema = z.object({ revoked: z.boolean() });

@Router({ alias: "rbac" })
@RegisterPolicy("rbac")
@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })
@Injectable()
export class RbacRouter {
  constructor(@Inject(RbacService) private readonly rbacService: RbacService) {}

  @Query({ output: roleListSchema })
  async listRoles(): Promise<RoleResponse[]> {
    return unwrap(await this.rbacService.getAllRoles());
  }

  @Query({ input: roleIdParam, output: roleWithPermissionsResponseSchema })
  async getRole(@Input() input: { roleId: string }): Promise<RoleWithPermissionsResponse> {
    return unwrap(await this.rbacService.getRoleWithPermissions(input.roleId));
  }

  @Query({ output: permissionListSchema })
  async listPermissions(): Promise<PermissionResponse[]> {
    return unwrap(await this.rbacService.getAllPermissions());
  }

  @Mutation({ input: assignRoleToUserRequestSchema, output: assignedResultSchema })
  async assignRole(@Input() input: AssignRoleToUserRequest): Promise<{ assigned: boolean }> {
    return unwrap(await this.rbacService.assignRoleToUser(input));
  }

  @Mutation({ input: revokeRoleFromUserRequestSchema, output: revokedResultSchema })
  async revokeRole(@Input() input: RevokeRoleFromUserRequest): Promise<{ revoked: boolean }> {
    return unwrap(await this.rbacService.revokeRoleFromUser(input));
  }

  /**
   * @OverridePolicy replaces the class-level SUPER_ADMIN gate entirely (no merge)
   * so any authenticated user may read their own permissions (ADR-0042 / WO-104).
   * Without this, PolicyRegistry would merge the class gate through and non-admins
   * could not read their own permissions — WO-089 would collapse to fail-closed.
   *
   * @description Returns the current principal's permission + role strings.
   * Server stays authoritative (ADR-0042): permissions/roles are derived from
   * RBAC seed via `PrincipalResolver` in the execution middleware, NOT from a
   * client-enriched session. Any authenticated user may read their own.
   */
  @Query({
    output: myPermissionsOutputSchema,
  })
  @OverridePolicy({ authenticated: true })
  async myPermissions(@Ctx() ctx: AppContext) {
    const principal = ctx.execution!.principal;
    return { permissions: [...principal.permissions], roles: [...principal.roles] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BRIDGE 2b — service `Result<T>` success type MUST equal the declared
// `@Query/@Mutation output:` schema. nestjs-trpc treats `output:` as *metadata*
// (runtime serialization), NOT a TS constraint, so a divergence between the
// service return and the schema is otherwise silent. `OkType` extracts T from
// the service's `Promise<Result<T,E>>`; ctx-backed methods use Awaited directly.
// ═══════════════════════════════════════════════════════════════════════════
type _verify_listRolesOutput = NoDrift<
  Awaited<ReturnType<RbacRouter["listRoles"]>>,
  z.output<typeof roleListSchema>
>;
type _verify_getRoleOutput = NoDrift<
  Awaited<ReturnType<RbacRouter["getRole"]>>,
  z.output<typeof roleWithPermissionsResponseSchema>
>;
type _verify_listPermissionsOutput = NoDrift<
  Awaited<ReturnType<RbacRouter["listPermissions"]>>,
  z.output<typeof permissionListSchema>
>;
type _verify_assignRoleOutput = NoDrift<
  Awaited<ReturnType<RbacRouter["assignRole"]>>,
  z.output<typeof assignedResultSchema>
>;
type _verify_revokeRoleOutput = NoDrift<
  Awaited<ReturnType<RbacRouter["revokeRole"]>>,
  z.output<typeof revokedResultSchema>
>;
type _verify_myPermissionsOutput = NoDrift<
  Awaited<ReturnType<RbacRouter["myPermissions"]>>,
  z.output<typeof myPermissionsOutputSchema>
>;

export type _RbacGuillotines = ActivateGuillotines<
  [_verify_listRolesOutput, _verify_getRoleOutput, _verify_listPermissionsOutput,
   _verify_assignRoleOutput, _verify_revokeRoleOutput, _verify_myPermissionsOutput]
>;
