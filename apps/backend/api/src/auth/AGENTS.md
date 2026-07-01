# Auth Bot — better-auth

Owns authentication and authorization: better-auth config, session enrichment, RBAC integration.

## Key Files

| File | Role |
|------|------|
| `auth.ts` | better-auth instance (Drizzle adapter) |
| `auth-core.module.ts` | NestJS `AUTH_INSTANCE` provider |
| `packages/@prasici/database/src/schema/auth/` | Auth Drizzle tables |
| `packages/@prasici/database/src/schema/sm/users.ts` | SM user with `authUserId` |
| `packages/@prasici/database/src/schema/sm/rbac.ts` | Roles, permissions |

## Global Identity Model

```
auth_user.id ──→ sm.users.authUserId (1:1)
                      │
                      ▼
              userRoles → roles → permissions
```

## Rules

- Auth tables have NO tenant_id
- SM `users` is domain identity, not an auth table
- Session enrichment via `customSession` loads SM roles + org
- `@better-auth/expo` for mobile with SecureStore cookie persistence
- Social providers: Google, GitHub, Apple, Discord
