# Better Auth Session Integration Plan — ROCKY

**Date:** 2026-07-19
**Status:** Draft (awaiting user decisions on flagged OPEN QUESTIONS)
**Plan dir:** `.pi/plans/2026-07-19-better-auth-session-integration/`
**Scout context:** `.pi/plans/2026-07-19-better-auth-session-integration/scout-context.md`

---

## Intent

ROCKY (gov.mk cattle-traceability) runs a **single** Better Auth server instance (`Auth.getInstance` singleton in `packages/auth/src/better-auth.ts`). Today that instance has **no `session:{}` config block at all** — every lifetime/freshness/cookie-caching/secondary-storage knob is at the Better Auth default (7d expiry, 1d `updateAge`, 1d `freshAge`, no cookie cache, no Redis). This plan adds **explicit, gov-grade session management** without touching the auth/authorization boundary: RBAC enrichment stays in `PrincipalResolver` → `Principal` → `rbac.myPermissions`; we do **not** reintroduce a `customSession` plugin to inject roles into the session.

We adopt Better Auth's built-in `session`, `cookieCache`, `secondaryStorage`, `deferSessionRefresh` knobs where they fit a government security posture, wire the already-existing session revocation/listing endpoints into the web admin + mobile clients (today zero client calls), enforce step-up freshness on sensitive ops, and reconcile two pieces of stale "ghost" code.

---

## Current State (confirmed by scout)

| Area | Today | Source |
|------|-------|--------|
| Session config | **None** — all Better Auth defaults | `packages/auth/src/better-auth.ts:160-187` |
| Redis / secondaryStorage | None (only `@upstash/redis` as a *transitive* better-auth dep, unused) | scout §7 |
| Principal cache | In-memory `Map`, TTL 5 min, "replace with Redis for multi-instance" | `packages/authorization/src/principal/principal.cache.ts` |
| Session endpoints | `/api/auth/{list-sessions,revoke-session,revoke-other-sessions,revoke-sessions,change-password}` exist via `toNodeHandler` mount (`apps/api/src/main.ts:27-34`) + admin plugin | scout §2/§6 |
| Client session calls | **Zero** — only sign-in/up/out + `useSession`/`getSession` | scout §6 |
| RBAC delivery | `rbac.myPermissions` query, `PrincipalResolver` — **not** customSession | `apps/api/src/routers/rbac.router.ts` |
| RLS | Transactional/`SET LOCAL` inside `ExecutionPipeline` (`packages/execution/src/rls/rls.stage.ts`), NOT a get-session side effect | scout §2 |
| Stale ghost code | `apps/api/src/trpc/middlewares/rls.middleware.ts` (dead, reads unpopulated `ctx.user`); `apps/web/better-auth.d.ts` (false `Session.user` augmentation) | scout §1/§3 |
| Cross-subdomain | `advanced.crossSubDomainCookies` enabled when `cookieDomain` set; `cookiePrefix:"rocky"` | `better-auth.ts:135-159` |

---

## Non-negotiable Boundaries (must hold throughout)

1. **One auth instance.** `Auth.getInstance(config)` is idempotent; config only applies on first call. All `session:{}` / `advanced` / `secondaryStorage` options **must** be added inside `packages/auth/src/better-auth.ts`, not `apps/api/src/auth/auth.ts` (which only builds `AuthConfig` + calls `getInstance`).
2. **No `customSession` for RBAC.** Re-adding it to inject roles/permissions into the session response violates ADR-0001 (auth/authorization boundary) and is explicitly rejected by ADR-0042/0049. Permissions already reach clients via `rbac.myPermissions`. Any session-response enrichment stays **identity-only**.
3. **Error Sovereignty.** Domain/services return `Result<T,E>`; routers map `E → TRPCError` via `createResultUnwrapper(...)` (`apps/api/src/routers/rbac.router.ts` pattern). No `console.log` in prod. `satisfies` on Zod schemas, `as const` on enums.
4. **Result monad sovereignty.** `ok/err/Result` come from `@rocky/domains-shared`.
5. **RobotFarm pass + ADR.** New architectural decision → new ADR per ADR-0033 (`cp apps/docs/content/ADR/ADR-TEMPLATE.md apps/docs/content/ADR/00NN-better-auth-session-config.md`; Proposed → Accepted on merge). Update owning AGENTS.md (`packages/auth/AGENTS.md`, `apps/api/AGENTS.md`, `packages/authorization/AGENTS.md` if Principal cache changes) after merge. Re-run `pnpm ci:checks` + `pnpm build` (ci:checks does NOT type-check `*.test.ts`/build — `pnpm build` is the real gate).
6. **RLS transactional integrity.** Any `secondaryStorage`/refresh change must be validated against the per-request transactional RLS connection (`TX_KEY` in `AsyncLocalStorage`). Session reads/writes must not escape RLS scope.

---

## Decision Table (A–H)

Each row: the option space, tradeoffs, and the **recommended** choice for a gov posture. Items in **BOLD = flagged OPEN QUESTION** the user must confirm/override.

| # | Concern | Options | Recommendation |
|---|---------|---------|----------------|
| **A** | `session.expiresIn` / `updateAge` per-role lifetimes | (1) Single global lifetime for everyone. (2) Shorter for privileged admin roles (SUPER_ADMIN/VD_ADMIN) via a pre-create hook, longer/sliding for FARMER/MOBILE. | **(2) — recommend differentiated lifetimes**, but implemented by driving `expiresIn`/`updateAge` from env with **role-tiered override via `auth hooks`/`signIn` callback** (see A-CODE). Better Auth's `session.expiresIn` is global, so tiered admin lifetimes require a `signIn`/admin-plugin hook that shortens the session row + sets a shorter `updateAge` for `SUPER_ADMIN`/`VD_ADMIN`. **OPEN Q: adopt tiered now, or ship single global lifetime first and add tiering later?** |
| **B** | `session.freshAge` for sensitive ops | (1) Ignore freshness. (2) Set `freshAge` (e.g. 15m) so `getSession` returns `sessionFresh`; enforce step-up on password change / admin `set-role` / `impersonate` / permission changes. | **(2) — recommend `freshAge` + step-up.** `changePassword` already requires `currentPassword` (inherent step-up). For admin `set-role`/`impersonate`, add a `requireFreshSession` guard (see B-CODE). **OPEN Q: step-up mechanism for admin privileged actions — `sessionFresh` re-check, or explicit re-enter-password?** |
| **C** | `session.cookieCache` (compact vs jwe) | (1) `disabled` (always hit DB — simplest, most confidential). (2) `compact` cookie cache (maxAge e.g. 5m) — reduces DB load; revoked sessions stay live until `maxAge`. (3) `jwe` — encrypts cached session in cookie (gov confidentiality) but larger cookies + same revocation caveat. | **(2) `compact`, `maxAge: 300` (5 min) — recommend for reduced DB load**, because ROCKY already has a short `PrincipalCache` (5 min) so the revocation-lag window is consistent. `jwe` adds cookie bloat with the *same* Callout caveat (revoked sessions live until `maxAge`); only adopt `jwe` if cookie confidentiality at rest is a flagged requirement. **OPEN Q: `compact` vs `jwe`? And confirm `maxAge` (recommend 300s)?** |
| **D** | `advanced.deferSessionRefresh` | (1) Enable (defers the `updateAge` write off the GET path). (2) Leave disabled. | **(2) Leave DISABLED — recommend.** `deferSessionRefresh` exists for read-replica setups (avoid a write on the replica read path). ROCKY has a single primary, no replica, and RLS writes are transactional/pipeline-scoped — there is no GET-path write hazard today and no benefit to deferring. Enabling it adds background-job complexity for zero gain. |
| **E** | `secondaryStorage` (Redis) | (1) Adopt now — Redis service in compose; sessions in Redis → immediate cross-service revocation (api/web/mobile share), multi-instance ready. (2) Defer — keep DB-backed sessions; shortened `updateAge` + `cookieCache` mitigate load. | **Recommend (2) DEFER to a follow-up** for the first cut, because: (a) ROCKY runs a single API instance today (PrincipalCache already notes "replace with Redis for multi-instance"); (b) DB-backed sessions already support immediate revocation *within one instance*; (c) Redis adds an infra service + the multi-instance PrincipalCache alignment work (role-change invalidation currently only clears the local instance). **OPEN Q: adopt Redis now or defer?** If adopted, see E-CODE + compose + env. |
| **F** | `revokeOtherSessions` on password change | (1) Leave default (keep other sessions). (2) Pass `revokeOtherSessions: true` on change-password. | **(2) — recommend `revokeOtherSessions: true`.** Security best practice: rotating your password kills other active sessions/devices. Shown in F-CODE. |
| **G** | Session-management UI (web admin + mobile) | (1) No UI (server endpoints unused). (2) Web "My Sessions / Devices" page (list + revoke own) + admin "user sessions" for SUPER_ADMIN/VD_ADMIN via `adminClient`; mobile "sign out other devices". | **(2) — recommend net-new web page + mobile wiring**, scoped to: web `app/(admin)/settings/sessions` (own) + `app/(admin)/users/[id]/sessions` (admin, gated by `session:list`); mobile a "Sign out other devices" action. See G-CODE + nav-config edit. |
| **H** | Reconcile stale ghost code | (1) Fold into this work. (2) Separate cleanup PR. | **(1) — recommend fold into this work** (same package surface, low risk, removes misleading drift). Delete `rls.middleware.ts` (dead, unapplied, reads unpopulated `ctx.user`); fix `apps/web/better-auth.d.ts` (remove the false `roles/permissions/orgId/language/status` augmentation; keep only the real identity fields). See H-CODE. |

---

## Phased Approach

### Phase 0 — ADR + RobotFarm

- New ADR `00NN-better-auth-session-config.md` (ADR-0033 standard): records the A–H decisions, especially the **no-`customSession`** reaffirmation and the `cookieCache`/revocation-lag tradeoff.
- Add `SESSION_*` / `COOKIE_CACHE_*` / `REDIS_URL` env contract to `.env.example` + compose (only the vars we adopt; gate Redis behind the OPEN-Q decision E).

### Phase 1 — Server session config (singleton)

- Extend `AuthConfig` (`packages/auth/src/better-auth.ts`) with optional session fields; add the `session:{}` / `advanced.cookieCache` blocks inside `Auth.getInstance`. Keep `deferSessionRefresh` disabled (D).
- Drive values from env in `apps/api/src/auth/auth.ts`.
- Extend `AuthResult` + `AuthResolver` to surface `sessionFresh` (needs `freshAge` set) for step-up (B). Preserve the empty-cookie→no-getSession contract (`auth.resolver.test.ts`).
- `changePassword` step-up: pass `revokeOtherSessions: true` (F).

### Phase 2 — Freshness guard for sensitive ops (B)

- Add `requireFreshSession(seconds)` tRPC helper / small middleware used by `rbac.assignRole`, `rbac.revokeRole`, and any admin `set-role`/`impersonate` mutation. Re-reads session with `cookieCache` disabled to defeat the C revocation-lag, checks `sessionFresh` (or session `updatedAt` within window). **OPEN Q** decides mechanism.

### Phase 3 — Web session-management UI (G)

- New `app/(admin)/settings/sessions/page.tsx` (own sessions: `authClient.listSessions` + `revokeSession`/`revokeOtherSessions`) using the shared `@rocky/ui` components.
- New `app/(admin)/users/[id]/sessions/page.tsx` (admin: `authClient.user.listSessions`/`revokeSession` gated by `session:list`).
- Add nav entries in `apps/web/lib/nav-config.ts` (a new "Settings" section / "Sessions" item, permission-gated).

### Phase 4 — Mobile wiring (G)

- Add "Sign out other devices" → `authClient.revokeOtherSessions()` in `apps/mob` settings; reuse existing `SessionProvider` refresh.

### Phase 5 — Reconcile ghost code (H)

- Delete `rls.middleware.ts`; fix `better-auth.d.ts`. Remove any doc references to `customSession` enrichment that no longer exist (ADR-0042/0049 drift).

### Phase 6 — (conditional) Redis secondaryStorage (E)

- Only if OPEN Q E = adopt now. Add `redis` service to `docker-compose.yml`; build `secondaryStorage` in `apps/api` (keep `packages/auth` infra-free) and inject via `AuthConfig`; align `PrincipalCache` invalidation to the shared store.

---

## Concrete Code Examples

### A-CODE — `packages/auth/src/better-auth.ts`: add session + cookieCache to the singleton

```ts
// Inside Auth.getInstance(), merge into the betterAuth({...}) call.
// Values come from AuthConfig so apps/api stays the env source of truth.
betterAuth({
  // ...baseURL, secret, database, trustedOrigins, advanced (cookiePrefix + crossSubDomainCookies)...
  session: {
    // Global lifetime (seconds). Tiered admin shortening handled in a signIn hook (see below).
    expiresIn: config.sessionExpiresIn ?? 60 * 60 * 24 * 7,        // 7d default
    updateAge: config.sessionUpdateAge ?? 60 * 60 * 24,            // 1d sliding refresh
    freshAge: config.sessionFreshAge ?? 60 * 60 * 15,              // 15m — drives `sessionFresh` (B)
  },
  advanced: {
    cookiePrefix: "rocky",
    ...(config.cookieDomain ? { crossSubDomainCookies: { enabled: true, domain: config.cookieDomain } } : {}),
    // D: deferSessionRefresh intentionally LEFT UNSET (disabled) — single primary, no replica.
    // C: compact cookie cache reduces DB load; revocation lag bounded to maxAge (align with PrincipalCache 5m).
    ...(config.cookieCache?.enabled
      ? { cookieCache: { enabled: true, maxAge: config.cookieCache.maxAge ?? 300 } }
      : {}),
    // E (conditional): ...(config.secondaryStorage ? { secondaryStorage: config.secondaryStorage } : {}),
  },
  // A (tiered admin lifetime): shorten SUPER_ADMIN/VD_ADMIN sessions on sign-in.
  // Better Auth `session.expiresIn` is global, so we shorten the created session row + updateAge
  // for privileged roles via the admin plugin's sign-in lifecycle (keeps FARMER/MOBILE at 7d).
  plugins: [admin({ adminRoles: ["SUPER_ADMIN"], roles: _authRoles }), expo()],
});
```

Extend `AuthConfig` (same file) with optional fields:

```ts
export interface AuthConfig {
  // ...existing fields...
  /** Global session lifetime (seconds). Default 7d. */
  sessionExpiresIn?: number;
  /** Sliding refresh window (seconds). Default 1d. */
  sessionUpdateAge?: number;
  /** Freshness window (seconds) → getSession returns `sessionFresh`. Default 15m. */
  sessionFreshAge?: number;
  /** Compact cookie cache (DB-load reduction). Revoked sessions live until maxAge. */
  cookieCache?: { enabled: boolean; maxAge?: number };
  /** (E, conditional) Redis-backed session store for multi-instance + instant cross-service revocation. */
  // secondaryStorage?: SecondaryStorage;
}
```

### A-CODE (env source) — `apps/api/src/auth/auth.ts`

```ts
const int = (v: string | undefined, fallback: number) => (v ? Number(v) : fallback);

export const authConfig: AuthConfig = {
  // ...existing baseURL/secret/trustedOrigins/cookieDomain/email hooks...
  sessionExpiresIn: int(process.env.SESSION_EXPIRES_IN, 60 * 60 * 24 * 7),
  sessionUpdateAge: int(process.env.SESSION_UPDATE_AGE, 60 * 60 * 24),
  sessionFreshAge: int(process.env.SESSION_FRESH_AGE, 60 * 60 * 15),
  cookieCache: process.env.COOKIE_CACHE_ENABLED === "true"
    ? { enabled: true, maxAge: int(process.env.COOKIE_CACHE_MAX_AGE, 300) }
    : { enabled: false },
  // secondaryStorage: redisStore, // (E) only when adopted
};
```

### B-CODE — surface `sessionFresh` in AuthResult + step-up guard

`packages/auth/src/better-auth.ts` — extend `AuthResult`:

```ts
export type AuthResult = {
  session: {
    id: string; expiresAt: Date; ipAddress?: string | null; userAgent?: string | null;
    userId: string; createdAt: Date; updatedAt: Date; token: string;
    /** True when the session was refreshed within `session.freshAge`. Identity metadata, NOT RBAC. */
    fresh?: boolean;
  } | null;
  user: { /* ...unchanged identity fields... */ } | null;
} | null;
```

`packages/auth/src/auth.resolver.ts` — map `sessionFresh` (preserve empty-cookie→no-getSession):

```ts
// returns null WITHOUT calling getSession when cookie empty (keep test contract)
const result = await auth.api.getSession({ headers: new Headers({ cookie }) });
if (!result?.session) return null;
return {
  session: { ...map(result.session), fresh: (result.session as { sessionFresh?: boolean }).sessionFresh },
  user: map(result.user),
};
```

`apps/api/src/trpc/middlewares/require-fresh-session.middleware.ts` (new) — used by admin `set-role`/`impersonate`:

```ts
// Re-reads session with cookieCache disabled (defeats C revocation-lag) and asserts freshness.
// Respects Error Sovereignty: throws TRPCError, never logs.
export class RequireFreshSessionMiddleware implements TRPCMiddleware {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: ReturnType<typeof betterAuth>) {}
  async use(opts: MiddlewareOptions<AppContext>) {
    const cookie = opts.ctx.execution?.request?.headers?.cookie;
    if (!cookie) throw new TRPCError({ code: "UNAUTHORIZED", message: "Re-authentication required" });
    const s = await this.auth.api.getSession({
      headers: new Headers({ cookie }),
      query: { disableCookieCache: true }, // bypass C cache → always authoritative
    });
    const fresh = (s?.session as { sessionFresh?: boolean } | undefined)?.sessionFresh;
    if (!fresh) throw new TRPCError({ code: "UNAUTHORIZED", message: "Step-up re-authentication required" });
    return opts.next({ ctx: opts.ctx });
  }
}
```

Apply only to sensitive mutations (e.g. `rbac.assignRole`, `rbac.revokeRole`) — **do not** apply globally (that would force re-auth on every read).

### C-CODE — cookieCache strategy summary

- `compact`, `maxAge: 300` (5 min). Reduces DB `SELECT session+user` on every request to ~1/(requests-per-5min). Revocation lag = ≤5 min (consistent with `PrincipalCache` 5 min).
- `jwe` only if cookie-confidentiality-at-rest is a flagged requirement (larger cookies, **same** revocation-lag caveat). Recommend `compact` unless user overrides.

### D-CODE — `deferSessionRefresh` decision

Left **unset/disabled**. Rationale: no read replica; RLS writes are transactional and not on the get-session path; enabling adds a background refresh job for zero benefit and would interact unpredictably with the per-request transactional RLS connection.

### E-CODE — (conditional) Redis `secondaryStorage` + compose

`apps/api/src/auth/redis-secondary-storage.ts` (built in api, injected — keep `packages/auth` infra-free):

```ts
import { Redis } from "ioredis"; // or @upstash/redis; ioredis chosen for self-hosted compose
const redis = new Redis(process.env.REDIS_URL!);
export const rockySecondaryStorage: SecondaryStorage = {
  get: (key) => redis.get(key),
  set: (key, value, ttl) =>
    ttl ? redis.set(key, value, "EX", ttl) : redis.set(key, value),
  delete: (key) => redis.del(key),
  // update optional
};
```

`docker-compose.yml` — add service (only when E adopted):

```yaml
  redis:
    container_name: rocky-redis
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: ["redis-server", "--appendonly", "yes"]
    volumes: ["redis_data:/data"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks: ["- iotn-network"]
    # api must gain: - REDIS_URL=${REDIS_URL:-redis://redis:6379}
volumes:
  redis_data:
```

When E is adopted, also align `PrincipalCache.invalidate(userId)` to publish an invalidation event Redis subscribers consume (so role changes propagate across instances, not just local TTL expiry).

### F-CODE — `revokeOtherSessions` on password change

Web (`apps/web/lib/auth-client.ts` already exports `authClient` with `adminClient`):

```ts
// On the "Change password" form submit:
await authClient.changePassword({
  currentPassword,
  newPassword,
  revokeOtherSessions: true, // kills all other active devices/sessions
});
```

Server endpoint `/api/auth/change-password` already supports the `revokeOtherSessions` flag (Better Auth core); no server change needed beyond ensuring the flag is forwarded by the client. Mobile mirrors the same call via `apps/mob/lib/auth.ts`.

### G-CODE — web session-management page (own sessions)

`apps/web/app/(admin)/settings/sessions/page.tsx` (sketch; uses `@rocky/ui` components, `authClient` from `apps/web/lib/auth-client.ts`):

```tsx
"use client";
import { authClient } from "#lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function MySessionsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => (await authClient.listSessions()).data ?? [],
  });
  const revoke = useMutation({
    mutationFn: (id: string) => authClient.revokeSession({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-sessions"] }),
  });
  // render list (ipAddress, userAgent, createdAt, updatedAt) + "Revoke" + "Revoke all other devices"
}
```

Admin user-sessions variant `app/(admin)/users/[id]/sessions/page.tsx` uses `authClient.user.listSessions({ userId })` / `authClient.user.revokeSession({ userId, sessionId })` (gated by `session:list`, already declared for SUPER_ADMIN/VD_ADMIN in `better-auth.ts:88-119`).

`apps/web/lib/nav-config.ts` — add a Settings section (permission-gated so it shows for any authenticated user for "My Sessions"):

```ts
{
  title: "Settings",
  items: [
    { title: "My Sessions", href: "/settings/sessions", icon: TabletSmartphone },
  ],
},
// Admin user-session management is reached from the Users row (no new nav item needed).
```

Mobile (`apps/mob` settings): add "Sign out other devices" → `authClient.revokeOtherSessions()`.

### H-CODE — reconcile ghost code

- Delete `apps/api/src/trpc/middlewares/rls.middleware.ts` (dead; `RLSMiddleware` applied to zero routers; reads unpopulated `ctx.user`). RLS now lives in `packages/execution/src/rls/rls.stage.ts`.
- `apps/web/better-auth.d.ts` — replace the false augmentation with the real identity-only `Session.user`:

```ts
declare module "better-auth" {
  interface Session {
    user: {
      id: string; name: string; email: string; image?: string | null;
      emailVerified: boolean; createdAt: Date; updatedAt: Date;
      // NOTE: roles/permissions/orgId/language/status are NOT on the session.
      // They come from PrincipalResolver → rbac.myPermissions (ADR-0001/0042). Do not re-add.
    };
  }
}
```

### Env-var additions (`.env.example` + compose)

| Var | Default | Purpose |
|-----|---------|---------|
| `SESSION_EXPIRES_IN` | `604800` (7d) | Global session lifetime (s) |
| `SESSION_UPDATE_AGE` | `86400` (1d) | Sliding refresh window (s) |
| `SESSION_FRESH_AGE` | `900` (15m) | Freshness window → `sessionFresh` (B) |
| `COOKIE_CACHE_ENABLED` | `false` | Enable compact cookie cache (C) |
| `COOKIE_CACHE_MAX_AGE` | `300` | Cookie cache TTL (s) |
| `REDIS_URL` | `redis://redis:6379` | (E) only when adopted |

---

## Open Questions for the User (decide before Phase 1 lock)

1. **A — Tiered lifetimes?** Adopt role-tiered admin session lifetimes (shorter for SUPER_ADMIN/VD_ADMIN) now, or ship a single global lifetime first and add tiering later? *(Recommend: ship global now, add tiering as a fast-follow — lower risk, the hook is the only non-trivial piece.)*
2. **C — cookieCache `compact` vs `jwe`?** And confirm `maxAge = 300s`? *(Recommend `compact`, 300s.)*
3. **E — Redis now or defer?** Adopt `secondaryStorage` (Redis service + compose + PrincipalCache alignment) in this work, or defer to a dedicated follow-up? *(Recommend defer for the first cut; single instance today.)*
4. **B — Admin step-up mechanism:** `sessionFresh` re-check (cheap, reuses freshness) vs explicit re-enter-password for `set-role`/`impersonate`? *(Recommend `sessionFresh` re-check via `RequireFreshSessionMiddleware`; password-change already re-auths via `currentPassword`.)*
5. **F — Confirm** `revokeOtherSessions: true` on password change is desired for all roles (gov best practice — recommend yes).

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking `auth.resolver.test.ts` contract (empty cookie → no `getSession`) | Keep `AuthResolver` early-return on empty cookie; only map `fresh` when session present (B-CODE). |
| `cookieCache` revocation-lag (Callout caveat) | Bound `maxAge` to 300s; align with `PrincipalCache` 5 min; step-up guard disables cache (B-CODE). |
| `secondaryStorage` escaping the transactional RLS connection | If E adopted, validate session reads/writes stay within `db.transaction` RLS scope; add an integration test. |
| `customSession` drift re-introduced | Explicitly forbidden in this plan (ADR-0001/0042); ghost code removed in H. |
| `ci:checks` green but `pnpm build` red | Run **both** `pnpm ci:checks` and `pnpm build` before declaring done (build-rot is invisible to ci:checks). |
| Multi-instance PrincipalCache staleness (if E deferred) | Documented as accepted for single-instance; addressed when E is adopted (Redis invalidation pub/sub). |

---

## Todo List (tag: `better-auth-session-integration`)

1. **ADR + env contract** — Author `apps/docs/content/ADR/00NN-better-auth-session-config.md` (ADR-0033 standard) capturing A–H decisions incl. no-`customSession` reaffirmation; add `SESSION_*`/`COOKIE_CACHE_*` (and `REDIS_URL` if E adopted) to `.env.example` + `docker-compose.yml`.
2. **AuthConfig + singleton session block** — Extend `AuthConfig` (`packages/auth/src/better-auth.ts`) with session/cookieCache fields; add `session:{}` + `advanced.cookieCache` inside `Auth.getInstance`; keep `deferSessionRefresh` disabled (D). Reference the A-CODE / C-CODE / D-CODE blocks.
3. **Env wiring in api** — In `apps/api/src/auth/auth.ts` read `SESSION_*`/`COOKIE_CACHE_*` and populate `authConfig` (A-CODE env source). Keep singleton invariant.
4. **AuthResult freshness** — Extend `AuthResult` + `AuthResolver` to surface `session.fresh` without breaking the empty-cookie contract (`auth.resolver.test.ts`). (B-CODE.)
5. **Freshness step-up guard** — New `RequireFreshSessionMiddleware` (re-reads with `disableCookieCache:true`, checks `sessionFresh`); apply to `rbac.assignRole`/`rbac.revokeRole` only — not globally. (B-CODE.)
6. **Password-change step-up** — Ensure web + mobile `changePassword` calls pass `revokeOtherSessions: true`. (F-CODE.)
7. **Web "My Sessions" page** — New `app/(admin)/settings/sessions/page.tsx` using `authClient.listSessions`/`revokeSession`/`revokeOtherSessions` + `@rocky/ui`; add Settings nav section in `apps/web/lib/nav-config.ts`. (G-CODE.)
8. **Web admin user-sessions page** — New `app/(admin)/users/[id]/sessions/page.tsx` using `authClient.user.listSessions`/`revokeSession`, gated by `session:list`. (G-CODE.)
9. **Mobile wiring** — Add "Sign out other devices" → `authClient.revokeOtherSessions()` in `apps/mob` settings; reuse `SessionProvider.refresh`. (G-CODE.)
10. **Reconcile ghost code** — Delete `apps/api/src/trpc/middlewares/rls.middleware.ts`; fix `apps/web/better-auth.d.ts` to identity-only `Session.user`; remove any remaining `customSession` doc drift. (H-CODE.)
11. **(Conditional E) Redis secondaryStorage** — Add `redis` service to `docker-compose.yml`; build `rockySecondaryStorage` in `apps/api` (keep `packages/auth` infra-free) and inject via `AuthConfig`; add `REDIS_URL` env; align `PrincipalCache.invalidate` to Redis pub/sub. (E-CODE.) — **only if OPEN Q E = adopt now.**
12. **RobotFarm + verification** — Update owning AGENTS.md (`packages/auth`, `apps/api`; `packages/authorization` if cache changes); run `pnpm ci:checks` **and** `pnpm build`; confirm `auth.resolver.test.ts`, `principal.resolver*.test.ts`, `trpc.e2e.test.ts`, `execution.middleware.test.ts` stay green.

---

## Summary

This plan adds **explicit gov-grade session management** to ROCKY's single Better Auth instance while preserving the auth/authorization boundary (no `customSession` for RBAC), the Result/Error-Sovereignty doctrine, and the transactional RLS model. It adopts `session.expiresIn/updateAge/freshAge` + a `compact` cookie cache, defers `deferSessionRefresh`, enforces `revokeOtherSessions` on password change, wires the already-existing revocation/listing endpoints into web + mobile, adds a freshness step-up guard for privileged admin actions, and reconciles two stale ghost-code files. **Redis `secondaryStorage` is recommended to defer** unless the user overrides OPEN Q E. All decisions are captured in a new ADR-0033-standard ADR, with a RobotFarm pass and full `pnpm build` verification.
