# Context for: auth-session-hardening (Option 3 — server-side only)

Scope ratified: configure the singleton session block, implement `RequireFreshSessionMiddleware`,
attach it to privileged admin mutations (set-role / impersonate), delete dead `rls.middleware.ts`,
strip the false `better-auth.d.ts` augmentation, ensure `pnpm build` passes with 0 TS errors. NO UI.

---

## VERIFIED REAL — better-auth version & type surface

**Installed version: `better-auth@1.7.0-rc.1`** (confirmed in
`packages/auth/node_modules/better-auth/package.json` and the `@better-auth/core@1.7.0-rc.1`
peer it resolves to under `node_modules/.pnpm/@better-auth+core@1.7.0-rc.1_...`).

Types are strict in this RC — the `BetterAuthOptions` type lives in `@better-auth/core`
(`types/init-options.d.mts`), **not** in the `better-auth` package's own `index.d.mts`.
`SessionQueryParams` (the only query-param shape for `getSession`) does **NOT** include `freshAge`.

### 2a) `session` config block — SUPPORTED ✅

File: `node_modules/.pnpm/@better-auth+core@1.7.0-rc.1_.../node_modules/@better-auth/core/dist/types/init-options.d.mts`

```ts
// ~line 873
session?: (BetterAuthDBOptions<"session", keyof BaseSession> & {
  /** Expiration time for the session token, in seconds. @default 7 days (60*60*24*7) */
  expiresIn?: number;                                  // ~line 877
  /** How often the session should be refreshed, in seconds.
   *  If 0 the session is refreshed every time it is used. @default 1 day (60*60*24) */
  updateAge?: number;                                  // ~line 884
  disableSessionRefresh?: boolean;                     // ~line 893 (default false)
  deferSessionRefresh?: boolean;                       // ~line 902 (default false)
  storeSessionInDatabase?: boolean;                    // (secondary-storage related)
  preserveSessionInDatabase?: boolean;
  /** Enable caching session in cookie */
  cookieCache?: {                                      // ~line 935
    maxAge?: number;            // @default 5 minutes (5*60)
    enabled?: boolean;          // @default false
    strategy?: "compact" | "jwt" | "jwe";   // @default "compact"
    jwt?: { signingKey?: "secret" | "jwt-plugin" };
    refreshCache?: boolean | { updateAge?: number };
    version?: string | ((session, user) => string) | (... => Promise<string>);
  };
  /** The age of the session to consider it fresh (sensitive ops like deleting an account).
   *  If 0, session is considered fresh every time. @default 1 day (60*60*24) */
  freshAge?: number;                                  // ~line 1021
});
```

Runtime defaults (from `better-auth/dist/context/create-context.mjs:156`):

```js
sessionConfig: {
  updateAge:  options.session?.updateAge !== void 0 ? options.session.updateAge : 1440 * 60,  // 1 day
  expiresIn:  options.session?.expiresIn || 3600 * 24 * 7,                                   // 7 days
  freshAge:   options.session?.freshAge === void 0 ? 3600 * 24 : options.session.freshAge,   // 1 day
  // cookieCache.maxAge default 300 (5 min); refreshCache disabled when DB/secondaryStorage present
}
```

→ Decision **A** (7-day lifetime, sliding via `updateAge`) and **C** (`cookieCache.maxAge=300`, `strategy:"compact"`) map directly onto this block.

### 2b) `cookieCache` — SUPPORTED ✅ (shape quoted above: `maxAge`, `enabled`, `strategy:"compact"|"jwt"|"jwe"`, `refreshCache`, `version`). Default `maxAge=300`, default `strategy="compact"`

### 2c) `secondaryStorage` — OPTION EXISTS ✅ (DEFERRED per decision E)

`init-options.d.mts:566`: `secondaryStorage?: SecondaryStorage | undefined;`
`context.d.mts:266`: `secondaryStorage: SecondaryStorage | undefined;` on the resolved context.
Plan note: option is present; we intentionally do **not** set it (single API instance; PostgreSQL handles revocation). The `cookieCache.refreshCache` will be left disabled because DB is configured (better-auth warns + auto-disables otherwise).

### 2d) revoke-other-sessions on password change — SUPPORTED ✅

`update-user` body accepts `revokeOtherSessions: z.ZodOptional<z.ZodBoolean>` —
`better-auth/dist/api/index.d.mts:879` (and `:2854`), `better-auth/dist/api/routes/update-user.d.mts:93`.
Endpoints also exist: `revokeOtherSessions` (`/revoke-other-sessions`) and `revokeSessions` (`/revoke-sessions`) —
`better-auth/dist/api/routes/session.d.mts:396,343`, exported from `api/index.d.mts:1521,1468`.
→ Decision **F**: the password-change path must pass `revokeOtherSessions: true` to better-auth's update-user/change-password endpoint. That endpoint is a **native better-auth HTTP route**, not a tRPC router in this repo (see §8).

### 2e) SERVER-SIDE FRESH-SESSION ENFORCEMENT — how better-auth exposes it

- `freshSessionMiddleware` is an internal endpoint guard: `better-auth/dist/api/routes/session.d.mts:186`
  (also exported `api/index.d.mts:3974`). Its logic (`session.mjs:369-372`):

  ```js
  if (ctx.context.sessionConfig.freshAge !== 0) {
    const freshAge = ctx.context.sessionConfig.freshAge * 1e3;
    if (Date.now() - createdAt >= freshAge) throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.SESSION_NOT_FRESH);
  }
  ```

  **Critical nuance:** freshness is measured against the session's `createdAt`, NOT last activity. `updateAge`/sliding only extends `expiresAt`, it does **not** reset `createdAt`. So step-up = "session issued within `freshAge` seconds" = effectively re-authenticate at least every `freshAge`.
- The **public** `getSession` (client/API) does **NOT** take `freshAge`. `SessionQueryParams`
  (`better-auth/dist/client/types.d.mts:46`) is only:

  ```ts
  type SessionQueryParams = { disableCookieCache?: boolean; disableRefresh?: boolean };
  ```

  So `getSession({ query: { freshAge } })` is **NOT** a valid call.
- **Recommended enforcement for `RequireFreshSessionMiddleware`** (mirrors `freshSessionMiddleware`):
  1. read cookie from `ctx.headers` (same as `ExecutionMiddleware`),
  2. `const res = await auth.api.getSession({ headers: new Headers({ cookie }) });` (benefits from cookieCache),
  3. if `!res?.session` → `TRPCError({ code: "UNAUTHORIZED" })`,
  4. `const freshAge = (auth.options.session?.freshAge ?? 86400);`
     `if (Date.now() - new Date(res.session.createdAt).getTime() >= freshAge * 1000) throw new TRPCError({ code: "FORBIDDEN", message: "SESSION_NOT_FRESH" });`
  5. `return next({ ctx });`
  `auth.options` is typed — `better-auth/dist/types/auth.d.mts:16`: `interface Auth<Options> { options: Options; ... }`
  (so `auth.options.session?.freshAge` is type-checked). `auth.api.getSession` is the same call `AuthResolver` already uses
  (`packages/auth/src/auth.resolver.ts`).

---

## 4) The singleton & where session config lands

**File: `packages/auth/src/better-auth.ts`** (read fully)

- `Auth.getInstance(config: AuthConfig)` builds the singleton via `betterAuth({...})` (line ~90).
- Current options present: `baseURL`, `secret`, `database` (drizzleAdapter), `trustedOrigins`,
  `advanced: { cookiePrefix: "rocky", crossSubDomainCookies? }`, `emailAndPassword`, `emailVerification`,
  `plugins: [admin(...), expo()]`.
- **No `session` block exists today.** Add one alongside the others, env-driven.
- `AuthConfig` interface (lines ~21-66) is the typed input injected by apps/api. It currently has
  `baseURL, secret, trustedOrigins, cookieDomain?, sendResetPassword?, sendVerificationEmail?, ...`.
  **Recommendation:** extend `AuthConfig` with an optional `session?: { expiresIn?, updateAge?, freshAge?, cookieCache?: { maxAge?, strategy? } }`
  (or a flatter `sessionLifetimeSeconds` / `sessionFreshAgeSeconds` / `cookieCacheMaxAgeSeconds`). The singleton maps
  `config.session` into the `betterAuth({ session: {...} })` block. Because `getInstance` is idempotent, the session
  config is fixed at first construction — fine since it is env-driven and stable.

**File: `apps/api/src/auth/auth.ts`** (read fully) — assembles `authConfig: AuthConfig` and creates the singleton.

- Reads env: `BETTER_AUTH_SECRET` (throws if missing), `TRUSTED_ORIGINS`, `AUTH_COOKIE_DOMAIN` / `ROCKY_DOMAIN`,
  `BETTER_AUTH_URL` / `BASE_SERVICE_URL`, `MAIL_FROM`, etc.
- This is where new env reads belong: e.g. `SESSION_LIFETIME_SECONDS` (default 604800), `SESSION_FRESH_AGE_SECONDS`
  (decision B step-up window), `COOKIE_CACHE_MAX_AGE_SECONDS` (default 300). Populate `authConfig.session = {...}`.
- `export const auth = Auth.getInstance(authConfig);` — single shared instance.

**Env convention check (`apps/api/src/config.ts`):** existing auth-related env read as `process.env.TRUSTED_ORIGINS`,
`process.env.AUTH_BASE_URL` (config schema), `process.env.BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` are read ad-hoc in
`auth.ts` rather than via the zod config schema. New session env vars can follow the same ad-hoc `process.env.X ?? default`
pattern already used in `auth.ts` (no need to touch the zod config schema).

---

## 5) apps/api/src/auth/auth.ts — session/cookieCache env injection point

Confirmed above. Custom per-task env names are not yet present; the planner should add them in `auth.ts` and feed
`authConfig.session`. No changes needed in `config.ts` zod schema (existing `BETTER_AUTH_*` / `AUTH_*` vars are read
decentralized in `auth.ts`).

---

## 6) Dead `rls.middleware.ts` — deletion SAFE

- **Path:** `apps/api/src/trpc/middlewares/rls.middleware.ts`
- **What it does:** reads `ctx.user` (old enriched session), runs `SET LOCAL app.current_user_id/current_role/current_org_id`
  for PostgreSQL pgPolicy, injects `ctx.rls`. Superseded by `ExecutionPipeline` (RLS is now handled in `@rocky/execution`).
- **Wiring check:**
  - Exported only from `apps/api/src/trpc/middlewares/index.ts:11`:
    `export { RLSMiddleware } from "./rls.middleware.js";` — this line must be removed.
  - **No router applies it.** `grep -rEn "RLSMiddleware|rls.middleware" apps/api/src` returns ONLY `index.ts` + the
    file's own doc-comment self-references. It is tagged `@deprecated - removed in Phase 4. RLS is handled by
    ExecutionPipeline now.` in `index.ts`.
  - `@UseMiddlewares(RLSMiddleware)` appears nowhere in `routers/`.
  - `dist/` copies (`apps/api/dist/trpc/middlewares/rls.middleware.js`) are build artifacts — regenerated by `nest build`.
- **Action:** delete `rls.middleware.ts` + remove the `index.ts:11` export line. Note `index.ts` still exports other
  deprecated-but-kept guards (`permission.guard`, `principal.guard`, `protected.middleware`, `scope.guard`) — leave those.

---

## 7) False `better-auth.d.ts` augmentation — STRIP IT

- **Path:** `apps/web/better-auth.d.ts` (the only source-level `declare module "better-auth"` augmentation in the repo).
- **Content:** augments `Session.user` with `roles?`, `permissions?`, `orgId?`, `language?`, `status?`, claiming:
  > "The server's customSession plugin adds roles, permissions, orgId, language, status to the session.user object."
- **Why it is FALSE:** the current singleton (`packages/auth/src/better-auth.ts`) **does NOT use `customSession`**.
  Its header comment (lines 7-10) states the customSession enrichment was *split and moved to `PrincipalResolver`*.
  Plugins configured today are only `admin()` and `expo()`. Grep for `customSession` across `packages`/`apps` src finds
  it only in this stale comment chain + this file. The role/permission/orgId enrichment now happens server-side in
  `packages/authorization` (`PrincipalResolver`), **not** in the better-auth session object. So these fields are never
  populated at runtime — the augmentation is semantically wrong.
- **Dependents:** `grep -rEn "\.user\.(roles|permissions|orgId|language|status)" apps/web/src apps/web/lib` → **no
  consumers**. `apps/web` depends on `better-auth@^1.7.0-rc.1` but nothing reads the augmented fields.
- **Action:** delete `apps/web/better-auth.d.ts`. Ambient per-app `.d.ts`; removal does not affect `apps/api` or
  `packages/auth` builds.

---

## 8) Privileged admin mutations → `RequireFreshSessionMiddleware` targets

**tRPC routers wrapping role mutations:** `apps/api/src/routers/rbac.router.ts` (read fully).

- `@Router({ alias: "rbac" })`, class-level `@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })`.
- Target mutations (both change a user's role → privileged step-up scope = "set-role"):
  - `assignRole(@Input() input, ...)` `@Mutation({ input: assignRoleToUserRequestSchema, output: assignedResultSchema })` (line 61) → `rbacService.assignRoleToUser`.
  - `revokeRole(@Input() input, ...)` `@Mutation({ input: revokeRoleFromUserRequestSchema, output: revokedResultSchema })` → `rbacService.revokeRoleFromUser`.
- `user.router.ts` `create`/`update` are also `@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })` but are user CRUD,
  not role/impersonate mutations — out of the agreed scope (decision B names set-role / impersonate).
- **Note on `impersonate`/`set-role` native endpoints:** better-auth's `admin` plugin exposes `/admin/set-role`,
  `/admin/impersonate-user` as **native HTTP endpoints**, not tRPC routers in this repo. The only tRPC role-mutation
  entry point is `RbacRouter.assignRole` (+ `revokeRole`). If the plan also wants to gate the native better-auth
  `set-role`/`impersonate` HTTP endpoints, that requires a better-auth `hook`/`createAuthMiddleware` on those routes,
  which is a different mechanism than the tRPC middleware. The agreed tRPC target = `RbacRouter.assignRole`/`revokeRole`.

**Middleware attachment model (model `RequireFreshSessionMiddleware` on `execution.middleware.ts`):**

- Global chain is registered in `apps/api/src/trpc/trpc.module.ts:27`:
  `globalMiddlewares: [ExecutionMiddleware, PolicyResolver]`.
- Per-router / per-method middlewares use the `@UseMiddlewares(...)` decorator (see `middlewares/permission.guard.ts`,
  `protected.middleware.ts`, `scope.guard.ts`). `ExecutionMiddleware` itself is a Nest provider (factory) so it can be
  referenced by class in `@UseMiddlewares`.
- **Plan:** implement `RequireFreshSessionMiddleware` as an `@Injectable()` class implementing `TRPCMiddleware`
  (constructor injects `AUTH_INSTANCE` = the `auth` instance, so it can read `auth.options.session?.freshAge`),
  provide it in `trpc.module.ts` (mirror the `ExecutionMiddleware` `useFactory`/`inject:[AUTH_INSTANCE,...]` block), and
  attach it to the two mutations via `@UseMiddlewares(RequireFreshSessionMiddleware)`. Because `globalMiddlewares` run
  first, `ctx.execution` (principal) and the SUPER_ADMIN `PolicyResolver` gate are already satisfied before the fresh
  check; the new middleware is purely an additive step-up gate.
- `ExecutionMiddleware` (`apps/api/src/trpc/middlewares/execution.middleware.ts`) reads the cookie exactly as the new
  middleware must: `const cookieHeader = ctx.headers?.get?.("cookie") ?? "";` then `AuthResolver.resolve(this.auth, cookieHeader)`.

---

## 9) Build / verify gate

- **`packages/auth` build:** `tsc -p tsconfig.build.json` (`packages/auth/package.json:33`). Emits `dist/`.
- **`apps/api` build:** `nest build` (`apps/api/package.json:9`). `apps/api` depends on `@rocky/auth` (`workspace:*`,
  `apps/api/package.json:23`) plus `@rocky/authorization`, `@rocky/execution`, `@rocky/trpc`.
- **`turbo.json` build task:** `dependsOn: ["^build", "generate:trpc"]` → builds `@rocky/auth` dist BEFORE `apps/api`.
- **⚠️ KNOWN TRAP (from AGENTS.md):** `turbo run dev` has `cache:false`, `persistent:true`, **no `dependsOn`** —
  it does **NOT** rebuild workspace deps. Changes to `packages/auth` are invisible to `apps/api` under `dev` until
  `@rocky/auth` dist is rebuilt. `pnpm ci:checks` also does NOT run `nest build` (only `generate:trpc` + guardians +
  `vitest`). So a green `ci:checks` is NOT proof of 0 TS errors across the boundary.
- **Required verification command:**

  ```bash
  pnpm build            # turbo: builds @rocky/auth (tsc) then apps/api (nest build) — end-to-end type check
  # or, faster incremental:
  pnpm --filter @rocky/auth build && pnpm --filter apps/api build
  ```

  Must complete with **0 TS errors**. Also run `pnpm --filter apps/web build` (or at least typecheck) since the
  `better-auth.d.ts` deletion lives in `apps/web`.

---

## Conventions to follow (observed in this codebase)

- `.mjs` for JS, `satisfies` on Zod schemas, `as const` enums, **no `console.log` in prod**, no TODO/FIXME in commits.
- Routers: `@Router/@Query/@Mutation` (nestjs-trpc), `@RegisterPolicy` + `@Policy`, `return unwrap(result)` (never
  `result.data`) — error mapping via `createResultUnwrapper(<X>_TRPC_ERROR_MAP)`.
- Middlewares implement `TRPCMiddleware` (`use(opts: MiddlewareOptions<AppContext>)`), are `@Injectable()`, wired as
  Nest providers in `trpc.module.ts`, attached with `@UseMiddlewares`.
- `AuthConfig` is the typed injection contract; session values should be threaded through it (extend the interface) so
  `apps/api` stays the env owner and `packages/auth` stays the singleton owner.
