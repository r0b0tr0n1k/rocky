---
title: Better Auth & Cloudflare Access — Auth Flow and the Service-Token Bypass
sidebarTitle: Better Auth & Cloudflare Access
---

# Better Auth & Cloudflare Access — Auth Flow and the Service-Token Bypass

*Explanation* — how Rocky's authentication reaches the API through the Cloudflare Access
shield. Companion to [ADR-0021: Better Auth Configuration](../ADR/0021-better-auth-configuration.md)
(the auth decision) and [ADR-0083: Deployment Topology — Docker Compose, External DB & Cloudflare Access](../ADR/0083-deployment-topology-docker-cloudflare-access.md)
(the ingress).

## TL;DR

- **Better Auth** runs as one idempotent singleton in `packages/auth`, namespaced with
  `cookiePrefix: "rocky"`, and terminates identity at `AuthResult` (only `userId` crosses to
  authorization — [ADR-0001](../ADR/0001-auth-vs-authorization-boundary.md)).
- A recent change (PR #1) fixed the **web proxy session-cookie resolution** to use the `rocky`
  cookie prefix and instrumented the whole auth path with debug logging.
- The **Cloudflare Access Service Token** lets the mobile (Expo) app and its Better Auth / tRPC
  clients clear the Cloudflare Access shield **without an interactive 2FA login** — a
  non-interactive "bypass" used for machine auth.

## 1. Better Auth as implemented

(See [ADR-0021](../ADR/0021-better-auth-configuration.md) for the ratified decision; this section records
the current shape.)

`Auth.getInstance(config)` is the monorepo's single Better Auth server:

- **Identity-only boundary** — imports only `@rocky/database` auth tables (`user`, `session`,
  `account`, `verification`); RBAC is resolved downstream by `PrincipalResolver`
  ([ADR-0022](../ADR/0022-authorization-policy-engine.md)). Only `userId` crosses the line.
- **`cookiePrefix: "rocky"`** — every Rocky session/cookie is namespaced, so the web, api, and docs
  cookies do not collide with other apps on the same host.
- **Cross-subdomain sessions** — when `AuthConfig.cookieDomain` is set (tertiary/subdomain
  deployments, e.g. `api.` / `admin.` / `docs.` under one parent), `crossSubDomainCookies` is enabled
  so the session cookie is shared across subdomains. Better Auth does **not** derive the parent from
  `baseURL`, so this must be configured explicitly.
- **Plugins** — `admin({ adminRoles: ["SUPER_ADMIN"], roles: _authRoles })` (user-management
  endpoints) and `expo()` (mobile session bridging). The roles (`SUPER_ADMIN`, `VD_ADMIN`,
  `VD_STAFF`, `VETERINARIAN`, `TECHNICIAN`, `FARMER`, `SLAUGHTERHOUSE_OP`, `MARKET_OP`, `SUPPLIER`)
  are **identity-level** (Better Auth admin plugin), distinct from SM RBAC.
- **Transport-agnostic resolution** — `AuthResolver.resolve(cookieHeader)` returns `AuthResult`
  with no Express/tRPC/NestJS types, so the same auth serves tRPC, cron, and future transports.

## 2. What changed recently (PR #1)

PR #1 was mostly **observability + one functional fix** on the auth path; the Better Auth core config
above was already in place.

### 2.1 Functional fix — web proxy session cookie

Next.js 16 replaced `middleware.ts` with `proxy.ts`. The proxy resolves the Better Auth session
cookie to gate protected routes. The fix passes the configured prefix so the cookie name actually
matches what Better Auth set:

```ts
// apps/web/proxy.ts
const sessionCookie = getSessionCookie(request, { cookiePrefix: "rocky" });
const isAuthenticated = looksLikeSessionToken(sessionCookie ?? undefined);
```

Without the `cookiePrefix: "rocky"` argument, `getSessionCookie` looks for the default `better-auth`
prefix and fails to find the session — silently treating authenticated users as anonymous. This folds
the guard that previously lived in `middleware.ts` into the new `proxy.ts`.

### 2.2 Auth-path debug instrumentation

The request path was instrumented with scoped `console.info` / `console.error` logs (all gated to the
auth flow, not general app logging):

- `apps/api/src/main.ts` — wraps `toNodeHandler(auth)` so every `/api/auth` request logs
  `[AUTH] <METHOD> <url> → <status> (<ms>)`, erroring (`console.error`) on `>= 400`.
  `toNodeHandler` bypasses NestJS entirely, so this is the only visibility into the auth handler.
- `apps/api/src/app.context.ts` — `[TRPC-CTX]` logs header count + cookie presence/length.
- `apps/api/src/trpc/middlewares/execution.middleware.ts` — `[TRPC-AUTH]` logs cookie-header length
  and whether a session was resolved.
- `apps/web/lib/auth-client.ts` — `[AUTH-CLIENT]` logs the resolved `baseURL`.
- `apps/web/components/auth/sign-in.tsx` — `[SIGN-IN]` / `[SIGN-IN ERROR]` logs the attempt and full
  error body.
- `packages/auth/src/better-auth.ts` — init `console.info` now reports `baseURL`, `secretSet`,
  `trustedOrigins`, and `cookieDomain`.

> These are debug logs added to trace the sign-in / proxy path. They should be gated behind an env
> flag or removed before GA to honor the "no console output in production code" convention.

### 2.3 Web container healthcheck

`docker-compose.yml` gained an explicit `healthcheck` for the `web` service that hits `GET /health`
via the bundled Node binary (the distroless image ships no `curl` / `nc`).

## 3. The Cloudflare Access Service-Token bypass

Rocky is deployed behind **Cloudflare Access** ([ADR-0083](../ADR/0083-deployment-topology-docker-cloudflare-access.md)):
`web` / `docs` require interactive TOTP / 2FA; `api` is protected by an Access application that expects
a **Service Token** (or an authenticated group member).

### 3.1 The problem

A native mobile app (Expo) and its `better-auth` / `tRPC` clients **cannot perform the interactive
browser 2FA challenge**. They need a way to clear the Access shield programmatically.

### 3.2 The bypass

Cloudflare Access issues a **Service Token** (Client ID + Client Secret). Presenting it as the
`CF-Access-Client-Id` / `CF-Access-Client-Secret` request headers makes Cloudflare validate and pass
the request through — no interactive login. This is a **non-interactive "2FA bypass"** / machine-auth
path.

```ts
// apps/mob/lib/auth.ts
const cfFetchOptions = (() => {
  const clientId = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET;
  if (!clientId && !clientSecret) return undefined;
  return {
    customFetch: async (url: string, init: RequestInit) => {
      const headers = new Headers(init.headers);
      if (clientId) headers.set("CF-Access-Client-Id", clientId);
      if (clientSecret) headers.set("CF-Access-Client-Secret", clientSecret);
      return fetch(url, { ...init, headers });
    },
  };
})();
```

The same headers are injected on every tRPC request in `apps/mob/providers/trpc-provider.tsx`. Both
are **no-ops when the env vars are unset** — i.e. direct LAN / dev with no Cloudflare in front.

### 3.3 Security posture

- A statically embedded Service Token is acceptable for **dev / test** against a Cloudflare-fronted
  backend.
- For **production**, prefer per-user Cloudflare Access (device enrollment / SSO) over an embedded
  static token. See [ADR-0083](../ADR/0083-deployment-topology-docker-cloudflare-access.md) § mobile
  machine auth.

## 4. End-to-end flow

```
Mobile / Web client
   │  better-auth client (cookiePrefix: "rocky", expo bridging)
   │  + CF-Access-Client-Id / -Secret   (mobile, when Cloudflare in front)
   ▼
Cloudflare Access  ──(Service Token / TOTP)──▶  Cloudflare Tunnel
   ▼
Rocky API (NestJS)
   ├─ /api/auth   → toNodeHandler(auth)          [Auth singleton, cookiePrefix "rocky"]
   ├─ tRPC        → ExecutionMiddleware → AuthResolver.resolve(cookie) → AuthResult
   └─                                                  └─ only userId ─▶ PrincipalResolver (ADR-0022)
```

## Related

- [ADR-0021: Better Auth Configuration & Session Resolution](../ADR/0021-better-auth-configuration.md)
- [ADR-0083: Deployment Topology — Docker Compose, External DB & Cloudflare Access](../ADR/0083-deployment-topology-docker-cloudflare-access.md)
- [ADR-0001: Auth vs. Authorization Boundary](../ADR/0001-auth-vs-authorization-boundary.md)
- [ADR-0022: Authorization Policy Engine](../ADR/0022-authorization-policy-engine.md)
- Mobile Bot `AGENTS.md` → "Device testing — LAN, real dev environment, Cloudflare Access"
