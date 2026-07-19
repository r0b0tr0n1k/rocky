# Auth Package

**Scope:** `packages/auth/` — Better Auth singleton, session resolution, auth client factory
**Source spec:** `docs/AUTH_ARCHITECTURE.md` §Package Layout, §Identity vs. Authorization
**Last verified:** 2026-07-05 — Aligned to code after Phase 4 @Policy rollout

## Overview

Authentication infrastructure. Owns the Better Auth singleton and session resolution.
**NEVER touches RBAC, permissions, organizations, or SM users.** That boundary is enforced by design — see ADR 0001. The client factory likewise carries no org/2FA plugins (ADR-0021 Identity-Only Boundary).

## Key Files

| File | Purpose |
|------|---------|
| `better-auth.ts` | `Auth` singleton class — `Auth.getInstance(config)` is idempotent. Creates the single Better Auth server instance with all plugins. |
| `auth.resolver.ts` | `AuthResolver.resolve(auth, cookie)` — resolves a cookie to Better Auth session + user. Returns `AuthResult`. |
| `auth.module.ts` | `AuthModule.register(config)` — `@Global()` dynamic NestJS module. Exports `AUTH_INSTANCE` token. |
| `client.ts` | `createRockyAuthClient()` — shared factory consumed by `apps/web` and `apps/mob`. Pre-configures **`adminClient()` only**. Org/2FA plugins are intentionally absent (Identity-Only Boundary, ADR-0021): Better Auth answers "who", `@rocky/authorization` answers "which org/role". |

## Better Auth Plugins

| Plugin | Config | Purpose |
|--------|--------|---------|
| `drizzleAdapter` | pg, auth schema tables | Drizzle owns schema — Better Auth never owns migrations |
| `emailAndPassword` | credential auth | Password-based sign-in |
| `expo()` | mobile only | Expo SecureStore cookie storage |
| `admin()` | SUPER_ADMIN roles | User management endpoints (create, ban, impersonate) |

> **Deliberately NOT registered:** Better Auth's `organization()` and `twoFactor()` plugins.
> They would spawn competing `organization`/`member`/`twoFactors` tables and split the
> org source-of-truth that `@rocky/authorization` + RLS already own. Org/RBAC live in
> the authorization package, not in Better Auth's plugin surface. |

## Cross-Package Dependencies

| Package | Dependency | Direction |
|---------|-----------|-----------|
| `@rocky/database` | auth schema tables (user, session, account, verification) | ✅ auth → database |
| `@rocky/authorization` | `PrincipalResolver` receives `AuthResult` from `AuthResolver` | ✅ authorization → auth (NOT auth → authorization) |

## Critical Constraints

1. **Auth NEVER depends on authorization.** `AuthResult` contains only identity: session + user. RBAC resolution happens in `PrincipalResolver` (`@rocky/authorization`).
2. **`Auth.getInstance()` is idempotent.** Multiple calls with the same config return the same singleton.
3. **`console.info()` for logging** — avoids package coupling to `@rocky/logger`.
4. **Passwords managed by Better Auth.** The legacy `passwordHash` column on SM `users` is deprecated.
