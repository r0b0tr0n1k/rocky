# Plan: Server-Side Auth Session Hardening (Option 3)

Status: APPROVED (all 5 decisions ratified). Server-only — no UI.
Date: 2026-07-19. Branch target: `dev`.

## Ratified decisions

- **A** global session lifetime 7d (expiresIn 604800), sliding via updateAge 1d. No role tiering.
- **B** step-up via `sessionFresh` re-check (RequireFreshSessionMiddleware on privileged role mutations). No custom password-reentry endpoint. Freshness vs `createdAt`, NOT last activity.
- **C** `cookieCache`: compact, maxAge 300s (mirrors 5-min PrincipalCache revocation lag).
- **E** DEFER Redis secondaryStorage (single API instance; PostgreSQL revokes in-instance).
- **F** `revokeOtherSessions: true` on password change — CONFIRMED supported, but it is a CLIENT call-param on better-auth `changePassword`, not server config. UI phase (Phase 3/4) wires it where `changePassword` is invoked. Deferred-to-UI here.

## Changes (7)

1. `packages/auth/src/better-auth.ts`
   - Add `AuthSessionConfig` interface (expiresIn, updateAge, freshAge, cookieCache{enabled,maxAge,strategy}).
   - Add `session?: AuthSessionConfig` to `AuthConfig`.
   - In `Auth.getInstance`, add `session: { expiresIn, updateAge, freshAge, cookieCache:{enabled:true,maxAge:300,strategy:"compact"} }` block (env-driven via config, sane fallbacks). freshAge fallback = 900s (15 min).
2. `apps/api/src/auth/auth.ts`
   - Read env: SESSION_LIFETIME_SECONDS (def 604800), SESSION_FRESH_AGE_SECONDS (def 900), COOKIE_CACHE_MAX_AGE_SECONDS (def 300).
   - Populate `authConfig.session = {...}`.
3. NEW `apps/api/src/trpc/middlewares/require-fresh-session.middleware.ts`
   - `@Injectable() TRPCMiddleware`, inject `AUTH_INSTANCE`.
   - `auth.api.getSession({ headers, query:{ disableCookieCache:true } })` → force DB revalidation (bypass 300s cache).
   - If no session → UNAUTHORIZED. If `Date.now()-createdAt >= freshAge*1000` → FORBIDDEN `SESSION_NOT_FRESH`.
   - Reads `auth.options.session?.freshAge` (typed).
4. `apps/api/src/trpc/trpc.module.ts`
   - Import + provide `RequireFreshSessionMiddleware` (mirror ExecutionMiddleware useFactory/inject:[AUTH_INSTANCE]); export it.
5. `apps/api/src/routers/rbac.router.ts`
   - Import `UseMiddlewares` + `RequireFreshSessionMiddleware`.
   - Attach `@UseMiddlewares(RequireFreshSessionMiddleware)` to `assignRole` + `revokeRole` (the set-role mutations; class-level SUPER_ADMIN gate already satisfied by global PolicyResolver).
6. DELETE `apps/api/src/trpc/middlewares/rls.middleware.ts` (dead; only exported from index.ts, applied by no router).
7. `apps/api/src/trpc/middlewares/index.ts` — remove the `@deprecated` `RLSMiddleware` export line.
8. DELETE `apps/web/better-auth.d.ts` (false augmentation: claims customSession enrichment that no longer exists; PrincipalResolver owns RBAC now; zero consumers).

## Build gate (the REAL gate — ci:checks does NOT run nest build)

```
pnpm --filter @rocky/auth build && pnpm --filter apps/api build
pnpm --filter apps/web build   # confirms the .d.ts deletion typechecks
```

Must complete with 0 TS errors. (turbo `dev` does NOT rebuild deps — do NOT rely on it.)

## Follow-ups (not in Option 3, flag before dev→main PR)

- ADR for session policy (A/B/C/F) — ADR-0033 standard.
- RobotFarm pass on `packages/auth/AGENTS.md` (documents singleton session config).
- F client wiring: pass `revokeOtherSessions: true` in web/mob `changePassword` (UI phase).
- Consider `SESSION_NOT_FRESH` → friendly re-auth redirect on client (UI phase).
