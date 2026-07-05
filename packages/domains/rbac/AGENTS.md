# RBAC Domain Service

**Scope:** `packages/domains/rbac/` — service, repository, errors
**Source spec:** `docs/RBAC_ACCESS_DIAGRAMS.md`, `docs/USER_ROLES.md`
**Last verified:** 2026-07-05

## Overview

Role-Based Access Control management. Handles role/permission definitions, role-permission assignments, and user-role assignments. The RBAC data is consumed by `@rocky/authorization`'s `PrincipalResolver` to build `Principal.roles` and `Principal.permissions`.

## Service Methods

`packages/domains/rbac/src/services/rbac.service.ts`:

| Method | Purpose | Status |
|--------|---------|--------|
| `listRoles()` | List all roles | ✅ |
| `getRoleWithPermissions(id)` | Get a role with its assigned permissions | ✅ |
| `listPermissions()` | List all permissions | ✅ |
| `assignRoleToUser(userId, roleId)` | Assign a role to a user | ✅ |
| `revokeRoleFromUser(userId, roleId)` | Revoke a role from a user | ✅ |

## Tables

| Table | Purpose |
|-------|---------|
| `roles` | Role definitions (SUPER_ADMIN, VD_ADMIN, VD_STAFF, VETERINARIAN, etc.) |
| `permissions` | Granular action permissions (animal:create, eartag:order, etc.) |
| `role_permissions` | M:N binding between roles and permissions |
| `user_roles` | M:N binding between users and roles (with scope) |

## Seed Data

- 9 roles seeded
- 52 permissions seeded
- 188 role→permission assignments seeded
