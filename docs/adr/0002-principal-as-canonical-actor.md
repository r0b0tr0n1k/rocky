# ADR-0002: Principal as Canonical Runtime Actor

| Key            | Value               |
| -------------- | ------------------- |
| **Status**     | Accepted            |
| **Date**       | 2026-07-05          |
| **Author**     | Architecture Review |
| **Supersedes** | None                |

---

## Context

The current codebase scatters user/identity/authorization data across multiple context fields:

```txt
ctx.user          ← Better Auth user (after customSession enrichment)
ctx.session       ← Better Auth session
ctx.auth          ← After ProtectedMiddleware: { userId, role, permissions }
ctx.rls           ← After RLSMiddleware: { userId, role, roles, districtId, organizationId, accessLevel }
```

This creates ambiguity:

- Which field should a service use — `ctx.user`, `ctx.auth`, or `ctx.rls`?
- `ctx.rls.userId` and `ctx.auth.userId` are the same value but different shapes
- Adding new authorization data (claims, feature flags, billing tier) requires adding it to multiple context blocks
- Business code often imports Better Auth types (`Session`, `User`) even though it shouldn't care about authentication internals

## Decision

**Introduce `Principal` as the single canonical runtime actor.** Business code (routers, services, repositories) receives only `Principal`. Never Better Auth types, never RBAC internals, never SM user table references.

```typescript
export interface Principal {
  readonly id: string;
  readonly username: string;
  readonly roles: ReadonlyArray<string>;
  readonly permissions: ReadonlyArray<string>;
  readonly organization: { readonly id: string } | null;
  readonly accessLevel: "all" | "organization" | "own";
  readonly claims: Readonly<Record<string, unknown>>;

  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  isAdmin(): boolean;
  getClaim<T>(key: string): T | undefined;
}
```

### Construction

`Principal` is constructed by `PrincipalResolver` (in `packages/authorization/`) which receives only a user ID from the authentication layer:

```txt
AuthResolver → AuthResult { userId }
PrincipalResolver → Principal { id, roles, permissions, org, accessLevel, claims }
```

### Consumption

```typescript
// Router:
@Query(...)
async list(@Ctx() ctx: AppContext) {
  return this.farmService.list(ctx.execution.principal);
}

// Service:
async list(principal: Principal) {
  if (!principal.hasPermission("farm:read")) throw new ForbiddenError();
  return this.repo.findByOrg(principal.organization?.id);
}
```

## Consequences

### Positive

1. **Single source of truth**: One object for all identity/authorization data. No confusion about `ctx.user` vs `ctx.auth` vs `ctx.rls`.
2. **Abstraction survives change**: Switching auth providers or authorization engines changes only `PrincipalResolver`, never business code.
3. **Testable**: Tests create `Principal` instances directly — no need to mock Better Auth, sessions, or RBAC.
4. **Extensible**: New authorization data (billing tier, feature flags, impersonation state) goes into `claims` map without breaking existing code.
5. **Immutable**: `Principal` is read-only — safe to pass through middleware chains without defensive copying.

### Negative

1. **Additional abstraction**: One more concept for new developers to learn.
2. **Claims map is untyped**: `getClaim<T>()` uses generics but runtime shape depends on `PrincipalResolver` implementation. Mitigated by well-known claim keys.
3. **Migration cost**: All services and routers must switch from `ctx.user`/`ctx.auth`/`ctx.rls` to `ctx.execution.principal`.

## Alternatives Considered

### A: Keep current scattered context fields

**Rejected.** The ambiguity and coupling to Better Auth types is the problem this ADR solves.

### B: Flat context without Principal

**Rejected.** A flat `ExecutionContext` with separate `userId`, `roles`, `permissions`, `organizationId` fields is what we have now. It doesn't provide the abstraction or encapsulation that `Principal` offers.

### C: `CurrentUser` instead of `Principal`

**Rejected.** "User" is an overloaded term (Better Auth User, SM user, domain user). "Principal" is the standard term in security frameworks for the runtime actor representing an authenticated entity.

## Well-Known Claim Keys

```typescript
const ClaimKeys = {
  LOCALE: "locale",           // "MK", "EN"
  STATUS: "status",           // "ACTIVE", "SUSPENDED"
  DISTRICT: "district",       // { id: string } | null
  GEO_UNLIMITED: "geo",       // boolean
  IMPERSONATING: "imp",       // Principal | undefined
} as const;
```

## References

- [AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md) — Refinement 2: Introduce First-Class Principal
- `apps/api/src/app.context.ts` — current AppContext
- `apps/api/src/trpc/middlewares/protected.middleware.ts` — current auth enrichment
