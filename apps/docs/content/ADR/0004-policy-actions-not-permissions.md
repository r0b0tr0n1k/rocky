# ADR-0004: Policy Actions, Not Permissions

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-05 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The current authorization model uses permission strings directly in router decorators:

```typescript
@UseMiddlewares(createPermissionGuard("eartag:order"))
async placeOrder() { ... }
```

This has two problems:

1. **Implementation leakage**: Routers know that authorization is implemented via permissions. If authorization moves from RBAC to ABAC, Cedar, or OpenFGA, every router must change its decorator.
2. **Rigidity**: A single permission string cannot express compound rules like "permission + organization active + not suspended + within working hours."

The system also currently mixes concerns:

- `ProtectedMiddleware` checks session existence
- `createPermissionGuard("x")` checks permission
- `ScopeGuard` checks farm/org ownership
- No middleware checks organization membership

These should be unified under a single declarative policy system.

## Decision

**Routers declare `@Policy({ action: "..." })` — never permissions.** The policy engine resolves actions to authorization rules internally.

```typescript
// ✅ Router declares the ACTION it protects:
@Policy({ action: "eartag:order" })
async placeOrder() { ... }

// ❌ Router does NOT declare permissions or implementation details:
@Policy({ permissions: ["eartag:order"] })  // Rejected
```

### Policy Options

```typescript
interface PolicyOptions {
  /** Action to authorize */
  action?: string;
  /** Require authenticated session */
  authenticated?: boolean;
  /** Require organization membership */
  organization?: boolean;
  /** Require specific roles (shortcut) */
  roles?: string[];
  /** Require admin access (shortcut for roles: ["SUPER_ADMIN"]) */
  admin?: boolean;
}
```

### How the Policy Engine Resolves Actions

```txt
@Policy({ action: "eartag:order" })
         │
         ▼
PolicyEngine.evaluate(action, principal)
         │
         ├── Check: principal.permissions.includes("eartag:order")  ← today
         ├── Check: principal.organization !== null                   ← if @Policy({ organization: true })
         ├── Check: principal.claims.status !== "SUSPENDED"          ← future
         ├── Check: subscription.active                              ← future
         ├── Check: within working hours                             ← future
         └── Check: not in maintenance mode                          ← future
```

The **decorator never changes**. Only the `PolicyEngine` implementation evolves.

## Consequences

### Positive

1. **Authorization implementation is hidden**: Routers don't know whether authorization uses RBAC, ABAC, Cedar, or feature flags.
2. **Compound rules**: The engine can combine permission checks with organization checks, subscription checks, time-based rules — all from the single `action` declaration.
3. **Centralized policy**: All authorization rules live in the `PolicyEngine`, not scattered across routers and middleware.
4. **Testable in isolation**: `PolicyEngine.evaluate("eartag:order", principal)` is a pure function — no HTTP context needed.

### Negative

1. **Indirection**: A developer reading `@Policy({ action: "eartag:order" })` doesn't immediately see what checks are performed. Mitigated by documentation and the policy engine's debug logging.
2. **Migration cost**: All existing `createPermissionGuard("x")` calls must be replaced with `@Policy({ action: "x" })`.
3. **Action naming convention required**: Actions must follow a consistent naming scheme (e.g., `resource:verb`) to avoid collisions.

### Action Naming Convention

```txt
{domain}:{verb}[.{subresource}]

Examples:
  eartag:order              → Create ear tag order
  eartag:order.cancel       → Cancel ear tag order
  animal:register           → Register new animal
  animal:delete             → Delete animal record
  inspection:create         → Create inspection
  inspection:submit         → Submit inspection form
  farm:read                 → Read farm data
  farm:manage               → Manage farm settings
  admin:users               → Admin user management
  admin:system              → System-level operations
```

## Alternatives Considered

### A: Keep `createPermissionGuard("x")` pattern

**Rejected.** Leaks implementation. Cannot express compound rules. Requires multiple stacked decorators for organization + permission + scope checks.

### B: `@Policy({ permissions: [...], roles: [...], organization: true })`

**Rejected.** This is what the initial proposal had but was refined. It still exposes the concept of "permission" to routers. The `action` abstraction is cleaner.

### C: Use NestJS `@UseGuards` with custom guards

**Rejected.** NestJS guards are HTTP-specific. The policy system must be transport-agnostic (works for tRPC, cron, RabbitMQ).

## References

- [AUTH_ARCHITECTURE.md](https://github.com/r0b0tr0n1k/rocky/blob/main/docs/AUTH_ARCHITECTURE.md) — Refinement 5: Policy Engine Only Understands Actions
- `apps/api/src/trpc/middlewares/permission.guard.ts` — current permission guard
- `apps/api/src/trpc/middlewares/scope.guard.ts` — current scope guard
