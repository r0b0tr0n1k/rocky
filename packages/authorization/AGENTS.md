# Authorization Package

**Scope:** `packages/authorization/` — Principal, RBAC, Policy system
**Source spec:** `docs/AUTH_ARCHITECTURE.md` §Refinement 2: Principal, §Policy System
**Last verified:** 2026-07-05 — Aligned to code after Phase 4 @Policy rollout

## Overview

Authorization infrastructure. Receives `AuthResult` from `@rocky/auth` and produces `Principal` — the canonical runtime actor that business code receives.
**Business code NEVER touches Better Auth, SM users, or RBAC tables directly.** It receives only `Principal`.

## Key Files

| File | Purpose |
|------|---------|
| `principal/principal.ts` | `Principal` class — `id`, `username`, `roles`, `permissions`, `organization`, `accessLevel`, `claims`. Methods: `hasPermission()`, `hasRole()`, `isAdmin()`. |
| `principal/principal.resolver.ts` | `PrincipalResolver` — receives `AuthResult` → loads SM user via `authUserId` → loads RBAC → builds `Principal`. |
| `principal/principals.ts` | `ANONYMOUS_PRINCIPAL` and `SYSTEM_PRINCIPAL` — well-known principals for unauthenticated requests and cron jobs. |
| `policies/policy.decorator.ts` | `@Policy({ action, authenticated, roles, admin, organization })` — declarative authorization metadata. |
| `policies/policy.registry.ts` | `PolicyRegistry` — static `Map<"alias.method", PolicyMetadata>`. Populated by `@RegisterPolicy()` at decorator time, read by `PolicyResolver` at runtime. |
| `policies/register-policy.decorator.ts` | `@RegisterPolicy(alias)` — class decorator that scans prototype for `@Policy()` metadata and registers in `PolicyRegistry`. |
| `policies/engine.ts` | `PolicyEngine.evaluate(principal, policy)` — evaluates a policy against a principal. Checks: authenticated, admin, roles, organization, action. |

## Permission Catalog (isomorphic single source)

`permissions.ts` is a **re-export** of the isomorphic `Permissions` / `Permission` const defined in
`@rocky/validators/rbac` (see `packages/validators/AGENTS.md` §2.7). The canonical definition lives
there because RN cannot bundle this package's server-only deps; this module re-exports it verbatim so
`@Policy({ action })`, `Principal`, and the client `clientCan`/`useCan` gates all share ONE definition.
Do **not** redefine permission literals here — edit `@rocky/validators/rbac` (and the seed). WO-101's
drift test guards seed ↔ catalog sync.

## The @Policy System Flow

```
Router class definition:
  @Router({ alias: "farm" })            // 3rd: nestjs-trpc registration
  @RegisterPolicy("farm")               // 2nd: scans @Policy metadata, registers
  @Policy({ authenticated: true })      // 1st: sets metadata via Reflect.defineMetadata
  export class FarmRouter { ... }

At runtime (every tRPC request):
  PolicyResolver (global middleware)
    → PolicyRegistry.get("farm.list")   // lookup by procedure path
    → PolicyEngine.evaluate(principal, policy)
    → allowed? next() : FORBIDDEN
```

## Cross-Package Dependencies

| Package | Dependency | Direction |
|---------|-----------|-----------|
| `@rocky/auth` | Receives `AuthResult` | ✅ authorization → auth |
| `@rocky/database` | SM schema (users, roles, permissions, user_roles) | ✅ authorization → database |
| `reflect-metadata` | `@Policy()` decorator uses `Reflect.defineMetadata` / `getMetadata` | ✅ peer dependency |

## Critical Constraints

1. **Actions not permissions.** Routers declare `@Policy({ action: "animal:create" })`. The engine resolves actions to permission checks internally. Today: `principal.hasPermission("animal:create")`. Tomorrow: ABAC, feature flags, licensing.
2. **`@RegisterPolicy` MUST appear AFTER `@Policy`** in the decorator stack. TypeScript decorator evaluation is bottom-to-top for class decorators.
3. **`PolicyRegistry` is static.** No DI required at decorator time — populated during module import.
4. **`Principal` survives any provider change.** Switch Better Auth → Keycloak? Keep `Principal`. Rename `sm.users` → `app_users`? Keep `Principal.username`.
5. **`PrincipalResolver` uses `useFactory`** in `AuthorizationModule` because `tsx`/`esbuild` does not emit `design:paramtypes` metadata. Any `@Injectable()` class with constructor parameters MUST be provided via `useFactory` — see `ExecutionModule` for the same pattern.
