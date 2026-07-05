# ADR-0001: Authentication vs. Authorization Boundary

| Key            | Value               |
| -------------- | ------------------- |
| **Status**     | Accepted            |
| **Date**       | 2026-07-05          |
| **Author**     | Architecture Review |
| **Supersedes** | None                |

---

## Context

The Rocky codebase uses **Better Auth** for authentication (session management, cookies, email/password, OAuth) and **SM RBAC** (`roles`, `permissions`, `role_permissions`, `user_roles` tables) for authorization. The current `customSession` plugin in `apps/api/src/auth/auth.ts` bridges Better Auth identity to SM domain identity and loads RBAC data into the session.

This coupling creates a dependency chain:

```txt
Better Auth → SM users → RBAC → organization
```

Where the authentication layer knows about domain entities (SM users, roles, permissions, organizations).

As the system grows toward multi-protocol support (tRPC, REST, GraphQL, RabbitMQ, cron), this coupling will become a bottleneck. If authorization logic changes (e.g., moving from RBAC to OpenFGA or Cedar), the authentication layer would need modification.

## Decision

**Split authentication and authorization into separate packages with a strict dependency boundary.**

```txt
packages/auth/          ← Authentication: Better Auth, sessions, cookies, OAuth
packages/authorization/ ← Authorization: Principal, RBAC, policy engine
```

### Dependency Rule

| Package                   | Knows About                                            | Must NOT Know About                                                  |
| ------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `packages/auth/`          | Better Auth, cookies, `auth_*` tables                  | SM users, RBAC, organizations, permissions, roles                    |
| `packages/authorization/` | SM users, RBAC, `users`, `roles`, `permissions` tables | Better Auth internals, cookies, sessions (receives only identity ID) |

### Data Flow

```txt
Better Auth session
  ↓ (packages/auth)
AuthResult { userId, email, session }
  ↓ (boundary — only userId crosses)
PrincipalResolver (packages/authorization)
  ↓
Principal { id, roles, permissions, organization, accessLevel, claims }
  ↓
Business code (packages/domains)
```

The only value that crosses the boundary from `auth` to `authorization` is the **user ID** (`auth_user.id`). The authorization package uses this to look up the SM user via `users.authUserId` and resolve all authorization state independently.

## Consequences

### Positive

1. **Authentication provider is swappable**: Switch from Better Auth to Keycloak, Clerk, or custom OIDC without touching authorization or business code.
2. **Authorization engine is swappable**: Switch from RBAC to OpenFGA, Cedar, or OPA without touching authentication.
3. **Testable in isolation**: Each package can be tested with mock inputs/outputs at the boundary.
4. **Clear mental model**: "Who is this?" (auth) vs. "What may they do?" (authorization).

### Negative

1. **Two packages instead of one**: More `package.json` files, more imports, more mental overhead for new contributors.
2. **Boundary discipline required**: Future developers must understand and respect the boundary. A code review checklist is needed.
3. **Migration cost**: Existing code in `customSession` must be split — session enrichment moves to `PrincipalResolver`.

## Alternatives Considered

### A: Single `packages/auth/` with everything inside

**Rejected.** This is the current state. It couples authentication to authorization and creates the problems described in Context.

### B: `packages/identity/` and `packages/authorization/`

**Rejected.** "Identity" suggests IAM, OIDC, LDAP, Keycloak — identity *providers*. The package is specifically authentication (Better Auth, sessions, cookies). `packages/auth/` is more honest about its scope.

## References

- [AUTH_ARCHITECTURE.md](../AUTH_ARCHITECTURE.md) — full architecture document
- `apps/api/src/auth/auth.ts` — current Better Auth configuration
- `packages/database/src/schema/sm/rbac.ts` — current RBAC schema
