# Context for: Better Auth SESSION integration (expiration, freshness, cookie caching, secondary storage, custom session response, revocation/listing)

Scout date: 2026-07-19. Monorepo: ROCKY (gov.mk cattle-traceability).

## TL;DR for the planner

- There is **exactly one** Better Auth server instance: the idempotent `Auth.getInstance(config)` singleton in `packages/auth/src/better-auth.ts`. It is the identity authority for **all** apps (web + mobile + API + docs). There is **no `session` config block at all** — `expiresIn`/`updateAge`/`freshAge`/`cookieCache` are all Better Auth defaults.
- **No Redis, no `secondaryStorage`, no `cookieCache`, no `deferSessionRefresh`** exist anywhere in the code. `@upstash/redis` appears only as a *transitive* dependency of `better-auth` (its optional Redis adapter) — ROCKY does not wire it. `docker-compose.yml` has **no** redis service (only `db`, `api`, `web`, `docs`, `drizzle-studio`).
- **RBAC enrichment is NOT done via `customSession`.** It lives entirely in `PrincipalResolver` (`packages/authorization`). The server `better-auth.ts` only registers `admin()` + `expo()` plugins. Several docs/AGENTS.md still *say* `customSession`/`nextCookies()` are active — that is **drift/stale**; the code rejects it (see ADR-0042, ADR-0049, ADR-0021).
- **Stale/ghost references to `customSession` remain in live code and will mislead:**
  - `apps/api/src/trpc/middlewares/rls.middleware.ts` reads `ctx.user as EnrichedUser` (with `smUserId`, `roles`, `permissions`, `organizationId`, `districtId`, `language`, `status`) — but `ExecutionMiddleware` no longer populates `ctx.user` (it only sets `ctx.execution.principal`). `RLSMiddleware` is **not applied to any router** (no `@UseMiddlewares(RLSMiddleware)` in `apps/api/src/routers`), so it is dead code.
  - `apps/web/better-auth.d.ts` augments the `better-auth` `Session.user` type with `roles?/permissions?/orgId?/language?/status?` that **do not exist** on the real session. This type augmentation is misleading and should be reconciled.
- **Session endpoints exist server-side** (Better Auth core + admin plugin at `/api/auth/*`, mounted in `main.ts`), but **no client (web/mobile) calls session listing/revocation** today. The admin plugin declares `session: ["list","revoke",...]` per role, but nothing in the UI consumes them.
- **Roles/permissions reach the browser via a domain query** (`rbac.myPermissions`), NOT from the session. Do **not** reintroduce `customSession` for RBAC — it violates the auth/authorization boundary (ADR-0001/0042).

---

## 1. Server auth instance — `packages/auth`

### Files

- `packages/auth/src/better-auth.ts` — `Auth` singleton (`Auth.getInstance`).
- `packages/auth/src/auth.resolver.ts` — `AuthResolver.resolve(auth, cookie)` → `AuthResult`.
- `packages/auth/src/client.ts` — `createRockyAuthClient()` factory (web + mobile).
- `packages/auth/src/auth.module.ts` — `AuthModule.register(config)` (`@Global()`, exports `AUTH_CONFIG`, `AUTH_INSTANCE`).
- `packages/auth/src/index.ts` — barrel exports.

### Plugins currently active (`better-auth.ts:166`)

```ts
plugins: [admin({ adminRoles: ["SUPER_ADMIN"], roles: _authRoles }), expo()],
```

- `admin({...})` — Better Auth *account-level* roles (`SUPER_ADMIN`, `VD_ADMIN`, `VD_STAFF`, `VETERINARIAN`, `TECHNICIAN`, `FARMER`, `SLAUGHTERHOUSE_OP`, `MARKET_OP`, `SUPPLIER`). These are distinct from SM RBAC roles. The admin role vocabulary + `session` permissions are defined at `better-auth.ts:88-119`:
  - `SUPER_ADMIN`: `session: ["list","revoke","delete"]`, full `user:*`
  - `VD_ADMIN`: `session: ["list","revoke"]`
  - `VD_STAFF`: `session: ["list"]`
  - `VETERINARIAN`/`TECHNICIAN`: `session: []`
- `expo()` — enables the Expo SecureStore cookie/session flow for mobile (server side).
- **NOT present:** `customSession`, `nextCookies()`, `organizationClient` (server), twoFactor (server), `cookieCache`, `secondaryStorage`, `deferSessionRefresh`, any `session: {}` block.

### `AuthConfig` surface (`better-auth.ts:33-78`)

`baseURL`, `secret`, `trustedOrigins`, `cookieDomain?`, plus email hooks (`sendResetPassword`, `sendVerificationEmail`, `afterEmailVerification`, `onExistingUserSignUp`). `cookieDomain` drives `advanced.crossSubDomainCookies`.

### Cookie / cross-subdomain config (`better-auth.ts:135-159`)

```ts
advanced: {
  cookiePrefix: "rocky",
  ...(config.cookieDomain
    ? { crossSubDomainCookies: { enabled: true, domain: config.cookieDomain } }
    : {}),
},
```

Better Auth does NOT derive the parent domain from `baseURL`, so cross-subdomain sharing requires an explicit `cookieDomain`.

### AuthResult type (`better-auth.ts:80-104`)

`AuthResult = { session: { id, expiresAt, ipAddress?, userAgent?, userId, createdAt, updatedAt, token } | null, user: { id, email, emailVerified, name, image?, phone?, createdAt, updatedAt } | null } | null`. **Identity only — no roles/permissions/orgId.** This is the object that crosses into `@rocky/authorization`.

### AuthResolver (`auth.resolver.ts`)

Transport-agnostic: takes a cookie header string, calls `auth.api.getSession({ headers: new Headers({ cookie }) })`, maps `{session,user}` → `AuthResult`. Returns `null` for empty cookie or missing session. **This is the single session-read call** in the identity layer.

---

## 2. NestJS wiring — `apps/api`

### `apps/api/src/auth/auth.ts`

Builds `authConfig` (the `AuthConfig`):

- `secret = process.env.BETTER_AUTH_SECRET` (throws if unset, `auth.ts:12-14`).
- `trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "http://localhost:4000,mobile://").split(",")` (`auth.ts:17-19`).
- `cookieDomain = process.env.AUTH_COOKIE_DOMAIN ?? (process.env.ROCKY_DOMAIN ? "." + ROCKY_DOMAIN : undefined)` (`auth.ts:25-26`).
- `baseURL = process.env.BETTER_AUTH_URL ?? process.env.BASE_SERVICE_URL ?? "http://localhost:8080"` (`auth.ts:35`).
- Email hooks wired via `@rocky/email` (`MAIL_FROM` default `noreply@rocky.gov.mk`).
- `export const auth = Auth.getInstance(authConfig)` — singleton created here (`auth.ts:67`).

### `apps/api/src/auth/auth-core.module.ts`

`@Global()` `AuthCoreModule` → `AuthModule.register(authConfig)` (from `@rocky/auth`). Exports `AUTH_INSTANCE`.

### HTTP handler mount — `apps/api/src/main.ts:27-34`

```ts
const authHandler = toNodeHandler(auth);
app.getHttpAdapter().use("/api/auth", (req, res) => { authHandler(req, res); });
```

This mounts **all** Better Auth endpoints (sign-in/up, `get-session`, `list-sessions`, `revoke-session`, `revoke-other-sessions`, `revoke-sessions`, `change-password`, plus admin-plugin `/admin/*` routes) at `/api/auth/*`. CORS is `enableCors({ origin: appConfig.cors.origins, credentials: true })` (`main.ts:25-27`).

### Per-request session read → Principal → RLS

- `apps/api/src/trpc/middlewares/execution.middleware.ts` is a **global** tRPC middleware (`trpc.module.ts:22-27`). For every procedure it:
  1. `AuthResolver.resolve(this.auth, cookieHeader)` → `AuthResult`
  2. `principalResolver.resolve(authResult)` → `Principal` (handles anonymous)
  3. `pipeline.run(principal, request, ...)` → sets `ctx.execution = { principal, request, runtime }` and runs `RLSStage`.
- **RLS context is now injected inside the `ExecutionPipeline`** by `packages/execution/src/rls/rls.stage.ts` via a transactional `db.transaction(...)` + `SET LOCAL app.current_user_id/current_role/current_org_id/current_permissions/current_locale/...` (read `rls.stage.ts:50-62`). The transactional connection is stored in nestjs-cls `AsyncLocalStorage` (`TX_KEY`) so all repositories share it.
- `packages/trpc/src/middleware/withRls.ts` is a separate standalone helper (`injectRlsContext`/`clearRlsContext`/`validateRlsContext`) used outside the pipeline by `packages/domains/sync/...` and `packages/domains/shared` repositories.
- **`deferSessionRefresh` / read-replica concerns:** none present. There is no replica. The GET `/get-session` path goes through `toNodeHandler` → Better Auth; it performs a `SELECT session + user`. Because RLS writes (`SET LOCAL`) happen **transactionally inside the pipeline, not during get-session**, there is currently no write-during-GET hazard — but if you add `secondaryStorage` (which routes session reads/writes to Redis), watch the interaction with the per-request transaction-scoped RLS connection, and consider Better Auth's `advanced.deferSessionRefresh` if/when a read replica is introduced.

### `ctx.user` / `ctx.session` are deprecated and UNPOPULATED

`packages/trpc/src/context.ts` declares `user?`/`session?` as `@deprecated` "Populated by ExecutionMiddleware for backwards compat" — but `ExecutionMiddleware` does **not** set them (only `ctx.execution.principal`). Any code reading `ctx.user` (e.g. the dead `RLSMiddleware`) gets `undefined`.

---

## 3. Authorization bridge — `packages/authorization` (PrincipalResolver)

- `packages/authorization/src/principal/principal.resolver.ts` — `PrincipalResolver.resolve(authResult: AuthResult): Promise<Principal>`:
  - null/`no user` → returns `ANONYMOUS_PRINCIPAL` (no DB hit).
  - Else: cache lookup (`PrincipalCache.get(authUser.id)`) → if miss, JOIN `sm_users` (by `authUserId`), `user_roles`, `roles`, `role_permissions`, `permissions` (`principal.resolver.ts:46-95`). Builds `roles`, `permissions (resource:action)`, `organizationId`, `highestRole`, `accessLevel`, `claims.locale/status`.
  - Caches result for **5 minutes** (`principal.cache.ts`).
- **No `customSession` plugin** is used anywhere to inject roles into the client session response. Roles/permissions are delivered to clients via the `rbac.myPermissions` query (see §4/§5). This is by design (ADR-0001 auth/authorization boundary; ADR-0042).
- `Principal` (`principal.ts`) is the canonical actor: `id, username, roles[], permissions[], organization, accessLevel, claims`. `principal.permissions` is the source for `rbac.myPermissions`.

---

## 4. Web client — `apps/web`

- `apps/web/lib/auth-client.ts` — `createAuthClient({ baseURL: window.location.origin (SSR fallback NEXT_PUBLIC_API_URL), plugins: [adminClient(), organizationClient({dynamicAccessControl:{enabled:true}}), twoFactorClient()] })`. Exports `signIn, signOut, signUp, useSession, getSession`. **No `customSessionClient`, no `expoClient`.** baseURL is same-origin; `next.config.ts` rewrites `/api/auth/:path*` → `${API_URL}/api/auth/:path*` (`next.config.ts:55-62`) and `/trpc/:path*` similarly.
- `apps/web/lib/permissions.tsx` — `PermissionsProvider` fetches `trpc.rbac.myPermissions` (enabled only when `session?.user` present) for **authoritative** `permissions`; `roles` is best-effort from `session.user.roles` (drift-prone per ADR-0042). Fail-closed (`[]` on error). Exports `useCan/clientCan`.
- `apps/web/proxy.ts` — edge `proxy()` uses `getSessionCookie(request, { cookiePrefix: "rocky" })` to decide auth redirects. Pure UX; authoritative auth is server-side.
- `apps/web/better-auth.d.ts` — **STALE type augmentation** claiming the server `customSession` adds `roles?/permissions?/orgId?/language?/status?` to `Session.user`. These fields do NOT exist on the real session. Should be reconciled/removed.
- There is **no** `apps/web/lib/auth.ts` (only `auth-client.ts`).

---

## 5. Mobile client — `apps/mob`

- `apps/mob/lib/auth.ts` — `createAuthClient({ baseURL: EXPO_PUBLIC_API_URL, fetchOptions: cfFetchOptions, plugins: [adminClient(), organizationClient({dynamicAccessControl:{enabled:true}}), twoFactorClient(), expoClient({ scheme, cookiePrefix:"rocky", storagePrefix:"mobile", storage: SecureStore })] })`. Exports `signIn, signUp, signOut, resetPassword, getSession, useSession`.
- `apps/mob/providers/session-provider.tsx` — `SessionProvider` calls `authClient.useSession()` and surfaces `{ data, isPending, refresh, onAuthSuccess }` via context; `refresh()` calls `authClient.getSession()` (guarded try/catch for offline).
- `apps/mob/providers/trpc-provider.tsx:78-83` — forwards the Expo session cookie on every tRPC request: `headers["cookie"] = authClient.getCookie()` (web platform uses `credentials:"include"`).
- `apps/mob/providers/permissions-provider.tsx` — mirrors web: `trpc.rbac.myPermissions.useQuery()` for permissions; `roles` best-effort from `session.user.roles`.

---

## 6. Session endpoints in use (mapping)

Server endpoints exist at `/api/auth/*` (mounted in `main.ts` via `toNodeHandler`). Standard Better Auth core endpoints available by default:

- `/api/auth/get-session`, `/api/auth/list-sessions`, `/api/auth/revoke-session`, `/api/auth/revoke-other-sessions`, `/api/auth/revoke-sessions`, `/api/auth/change-password` (+ `revokeOtherSessions` option on password change).
- Admin plugin adds per-user variants under `/api/auth/admin/*` (list/revoke user sessions) gated by the `session: [...]` permission per role defined in `better-auth.ts:88-119`.

**Reality today:**

- **Consumed by clients:** only the standard auth flow endpoints via `createAuthClient` (`sign-in`, `sign-up`, `sign-out`, `get-session`/`useSession`, `reset-password`).
- **NOT consumed anywhere:** `list-sessions`, `revoke-session`, `revoke-other-sessions`, `revoke-sessions`, `change-password(revokeOtherSessions)`. A repo-wide grep for `listSessions|revokeSession|revokeOtherSessions|revokeSessions|list-sessions|revoke-session` in `apps/web` + `apps/mob` returns **zero** matches. The admin `session` permissions are declared but no UI/router calls them.
- tRPC routers expose their own `rbac` router (`myPermissions`, `assignRole`, `revokeRole`, etc.) — not session management.

So if the planner wants session listing/revocation UI, it must be built new (front-end calls to the existing Better Auth endpoints), and the admin-plugin `session` permission vocabulary already supports role-gated access.

---

## 7. Existing caching / Redis / secondary storage

- **No Redis service** in `docker-compose.yml` or `docker-compose.dev.yml` (services: `db`, `api`, `web`, `docs`, `drizzle-studio`).
- **No `secondaryStorage`, `cookieCache`, `deferSessionRefresh`** in the codebase (grep across `.ts`/`.yaml`/`.json` except `pnpm-lock.yaml` → none).
- `@upstash/redis` appears only in `pnpm-lock.yaml` as a *transitive* dependency of `better-auth` (its optional Redis adapter). Not imported or configured by ROCKY.
- Only caching that exists:
  - `packages/authorization/src/principal/principal.cache.ts` — **in-memory `Map`** of `Principal` keyed by auth userId, TTL 5 min, `invalidate(userId)`. Its own header comment explicitly notes "For production multi-instance deployments, replace with Redis" — this is the natural place a distributed cache would slot in (distinct from Better Auth session `secondaryStorage`).
  - Better Auth DB session rows (Postgres `session` table via `drizzleAdapter`) — the only session store today.

**Implication:** introducing Better Auth `secondaryStorage` (Redis) for sessions is greenfield. Note the multi-instance caveat: `PrincipalCache` is per-instance; if you add Redis for sessions, consider aligning the Principal cache to the same store for consistency (role-change invalidation currently only clears the local instance).

---

## 8. Cookie / cross-subdomain config

- `cookiePrefix: "rocky"` (`better-auth.ts:145`) → cookies `rocky_session`, `rocky_csrf`, etc. Confirmed in `AUTH_ARCHITECTURE.md:86` and `proxy.ts` (`getSessionCookie(request, { cookiePrefix: "rocky" })`).
- `crossSubDomainCookies` enabled **only when `cookieDomain` set** (`better-auth.ts:146-153`). On the web, `proxy.ts` guards redirects using the cookie; the browser sends it same-origin and Next.js rewrites to the API.
- Mobile uses `expoClient({ cookiePrefix: "rocky", storagePrefix: "mobile", storage: SecureStore })` and forwards via `getCookie()` (`trpc-provider.tsx:78`).
- `trustedOrigins` from `TRUSTED_ORIGINS` (comma-list). Web CORS origins from `CORS_ORIGINS` (API `config.ts` + compose). Cloudflare Access service token headers are injected client-side via `fetchOptions.customFetch` (`apps/web/lib/auth-client.ts` indirectly; `apps/mob/lib/auth.ts:14-26`).

---

## 9. Env vars referenced in auth code + docker-compose

| Var | Read in | Purpose |
|-----|---------|---------|
| `BETTER_AUTH_SECRET` | `apps/api/src/auth/auth.ts:12`, `apps/web` (compose) | Session signing secret (required) |
| `BETTER_AUTH_URL` | `auth.ts:35` | Public API origin (Secure shared cookies) |
| `BASE_SERVICE_URL` | `auth.ts:35`, `config.ts` | Internal server-to-server base URL |
| `AUTH_COOKIE_DOMAIN` | `auth.ts:25` | Shared parent cookie domain (enables crossSubDomainCookies) |
| `ROCKY_DOMAIN` | `auth.ts:26` (compose) | Tertiary root; `.${ROCKY_DOMAIN}` is the default cookie domain |
| `TRUSTED_ORIGINS` | `auth.ts:17` | Comma-list of trusted CORS/origin hosts (+`mobile://`) |
| `CORS_ORIGINS` | `config.ts` (compose) | Browser CORS allow-list |
| `AUTH_BASE_URL` | compose `web`/`api` | Public auth base URL (CSRF/CORS trust) |
| `MAIL_FROM` | `auth.ts:42,51,63` | From-address for reset/verify/duplicate emails |
| `NEXT_PUBLIC_API_URL` | `packages/auth/src/client.ts:42`, `apps/web` | Web client base URL (SSR fallback) |
| `EXPO_PUBLIC_API_URL` | `client.ts:42`, `apps/mob/lib/auth.ts` | Mobile client base URL |
| `EXPO_PUBLIC_CF_ACCESS_CLIENT_ID/SECRET` | `apps/mob/lib/auth.ts` | Cloudflare Access service token (optional) |
| `DATABASE_URL` | `packages/auth` (db), compose `api`/`drizzle-studio` | Session + user store |

Compose (`docker-compose.yml`) sets: `ROCKY_DOMAIN` (default `tehno.party`), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (default `https://api.${ROCKY_DOMAIN}`), `BASE_SERVICE_URL`, `AUTH_COOKIE_DOMAIN` (default `.${ROCKY_DOMAIN}`), `AUTH_BASE_URL`, `CORS_ORIGINS`, `TRUSTED_ORIGINS` (includes `mobile://`). No session-specific (`SESSION_*`) or Redis vars.

---

## 10. Tests that must keep passing

- `packages/auth/src/auth.resolver.test.ts` — 3 cases for `AuthResolver.resolve`: (1) returns `null` **without** calling `getSession` on empty cookie; (2) calls `getSession` with `Headers` carrying cookie and maps `{session,user}` to `AuthResult`; (3) returns `null` when `getSession` yields no session. **Any session-read change must preserve the "empty cookie → no getSession call" contract and the `AuthResult` shape.**
- `packages/authorization/src/principal/principal.resolver.test.ts` — anonymous contract: `resolve(null)` and `resolve({session:null,user:null})` return `ANONYMOUS_PRINCIPAL` (not throw), `id==="anonymous"`, `roles===[]`. Uses a **stub cache** (`{get,set}`) so no DB.
- `packages/authorization/src/principal/principal.resolver.integration.test.ts` — authenticated branch joins SM RBAC; expects `roles`, `permissions` (`resource:action`), `claims.locale==="MK"`, `claims.status==="active"`, `accessLevel==="own"`. Hits real DB. **If you add session-driven caching or change Principal shape, keep these invariants.**
- `packages/authorization/src/principal/principal.resolver.e2e.test.ts` — full-stack principal resolution.
- `apps/api/src/trpc/middlewares/execution.middleware.test.ts` — mocks `auth.api.getSession` resolving `{ session:{id:"s1"}, user:{id:"u1",name:"n"} }` and asserts the pipeline/principal path. **Session-read mocking must stay compatible.**
- `apps/api/src/trpc.e2e.test.ts` — real HTTP flow: `POST /api/auth/sign-in/email` (real auth handler mounted in `main.ts`), captures `rocky_session` cookie, exercises genuine cookie→session→principal path. **Confirms the `/api/auth/*` handler is functional and shared with AppModule (same secret+DB).** Any change to handler mount or cookie name (`cookiePrefix:"rocky"`) must keep this green.

---

## Gotchas for the planner

1. **Don't add `customSession` for RBAC.** It breaks the auth/authorization boundary (ADR-0001) and is explicitly rejected by ADR-0042/0049. Permissions already reach the client via `rbac.myPermissions`. If you want a richer *session response* (e.g. exposing a few non-RBAC identity fields), do it without SM/role data.
2. **Reconcile stale `customSession` references** before shipping: `apps/api/src/trpc/middlewares/rls.middleware.ts` (dead, reads unpopulated `ctx.user`) and `apps/web/better-auth.d.ts` (false type augmentation). The `rls.middleware.ts` doc comment ("populated by customSession") is wrong.
3. **RLS is transactional and pipeline-scoped** (`rls.stage.ts`), not via a per-request `getSession` side-effect. If you add `secondaryStorage`/Redis, verify session reads don't escape the `db.transaction` RLS connection or you'll read/write outside RLS scope. `advanced.deferSessionRefresh` only matters with read replicas.
4. **Singleton idempotency:** `Auth.getInstance(config)` returns the same instance; config is only applied on first call. Any `session:{}` / `secondaryStorage` / `advanced` option must be added inside `better-auth.ts` (the only place `betterAuth({...})` is constructed) — not in `apps/api/src/auth/auth.ts` (which only builds `AuthConfig` and calls `getInstance`).
5. **Cookie name coupling:** everything assumes `cookiePrefix: "rocky"` (`rocky_session`, `rocky_csrf`). `proxy.ts` and `main.ts` handler mount depend on it. Keep the prefix if you touch cookies.
6. **Admin-plugin `session` permissions are declared but unused** — wiring revocation/listing UI is net-new work; the role vocabulary already gates it.
7. **Multi-instance caveat:** `PrincipalCache` is in-memory per API instance. Adding Redis for sessions should be accompanied by aligning Principal invalidation to the shared store, or role changes won't propagate across instances until TTL expiry.
8. **`nextCookies()` is NOT registered** (despite AGENTS.md). Web SSR cookie handling relies on `proxy.ts` `getSessionCookie` + same-origin rewrites; if you adopt `nextCookies()` server plugin, ensure it composes with the existing `crossSubDomainCookies` + `cookiePrefix` setup.

## Key files index

- `packages/auth/src/better-auth.ts` — singleton, plugins, cookie/advanced config, `AuthConfig`, `AuthResult`, admin roles.
- `packages/auth/src/auth.resolver.ts` — `AuthResolver.resolve` (the session read).
- `packages/auth/src/auth.module.ts`, `index.ts`, `client.ts` — module, barrel, client factory.
- `apps/api/src/auth/auth.ts`, `auth-core.module.ts` — config + module registration.
- `apps/api/src/main.ts` — `/api/auth` handler mount (`toNodeHandler`).
- `apps/api/src/trpc/middlewares/execution.middleware.ts` — global auth→principal→pipeline.
- `packages/execution/src/rls/rls.stage.ts` — transactional RLS `SET LOCAL` (current session authority).
- `packages/trpc/src/context.ts` — `AppContext` (`user`/`session` deprecated; use `ctx.execution.principal`).
- `packages/authorization/src/principal/principal.resolver.ts` + `principal.cache.ts` — RBAC→`Principal`, 5-min in-memory cache.
- `apps/web/lib/auth-client.ts`, `lib/permissions.tsx`, `proxy.ts`, `better-auth.d.ts`, `next.config.ts`.
- `apps/mob/lib/auth.ts`, `providers/session-provider.tsx`, `providers/trpc-provider.tsx`, `providers/permissions-provider.tsx`.
- `packages/authorization/src/principal/principal.resolver.test.ts` + `.integration.test.ts`, `packages/auth/src/auth.resolver.test.ts`, `apps/api/src/trpc.e2e.test.ts`, `apps/api/src/trpc/middlewares/execution.middleware.test.ts`.
- `docker-compose.yml` — services + auth env vars (no redis).
