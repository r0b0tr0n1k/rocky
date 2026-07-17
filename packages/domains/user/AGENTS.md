# User Domain Service

**Scope:** `packages/domains/user/` — service, repository, errors
**Source spec:** SM.PDF §Users
**Last verified:** 2026-07-05

## Overview

Manages SM (System Management) users. Users are the system agents — they have login credentials, roles, permissions, and organizational assignments. Each SM user is linked 1:1 to a Better Auth `auth_user` via `authUserId`.

## Service Methods

`packages/domains/user/src/services/user.service.ts`:

| Method              | Purpose                                       | Status |
| ------------------- | --------------------------------------------- | ------ |
| `getById(id)`       | Fetch single user with role/permissions       | ✅      |
| `list(input)`       | List users with filters (org, status, search) | ✅      |
| `create(input)`     | Create a new SM user                          | ✅      |
| `update(id, input)` | Update user profile fields                    | ✅      |

## Key Relations

| Relation          | Table                                       | Type             |
| ----------------- | ------------------------------------------- | ---------------- |
| Better Auth link  | `users.authUserId` → `auth_user.id`         | 1:1              |
| Organization      | `users.organizationId` → `organizations.id` | M:1              |
| Roles (M:N)       | `user_roles.userId` → `users.id`            | M:N              |
| Sessions (legacy) | `user_sessions.userId` → `users.id`         | 1:M (deprecated) |

## Deprecated Features

| Column                    | Deprecation                     | Replacement                   |
| ------------------------- | ------------------------------- | ----------------------------- |
| `passwordHash`            | ✅ Better Auth manages passwords | Better Auth `auth_account`    |
| `mfaEnabled`/ `mfaSecret` | ✅ Better Auth manages MFA       | Better Auth 2FA               |
| `role` (flat)             | ✅ RBAC M:N system               | `user_roles` + `roles` tables |
| `user_sessions` table     | ✅ Better Auth sessions          | `auth_session` table          |

## Repository Methods

`packages/domains/user/src/repositories/user.repository.ts`:

| Method                              | Purpose                                                   | Status |
| ----------------------------------- | --------------------------------------------------------- | ------ |
| `findById(id)`                      | Fetch a user by id (null if none)                         | ✅      |
| `findByUsername(username)`           | Fetch a user by username (null if none)                   | ✅      |
| `findByEmail(email)`                 | Fetch a user by email (null if none)                      | ✅      |
| `findByRole(role)`                   | List users by flat `role` column                          | ✅      |
| `list(filters)`                      | List users with org/status/search filters + pagination    | ✅      |
| `insert(data)` / `update(id, data)`  | Create / update a user row                                | ✅      |

**Cross-domain consumption:** `findByRole(role)` is consumed by Notification's `SubscriptionResolver`
to resolve `targetType: "role"` subscribers (ROCKY-DS 001:2026(E) §8.5 module-wiring exception — the
`UserRepository` is provided in `app.module.ts` and injected into the resolver; User Bot owns the method).
