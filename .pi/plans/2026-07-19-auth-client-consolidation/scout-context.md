# Context for: auth-client-consolidation

Consolidating the Better Auth frontend client in the Rocky monorepo. Today there are
THREE copies of the common plugin set (`adminClient()`, `organizationClient({dynamicAccessControl:{enabled:true}})`, `twoFactorClient()`). Goal: (A) set `disableDefaultFetchPlugins: true` for mobile; (B) route BOTH `apps/web` and `apps/mob` through the shared `createRockyAuthClient` factory in `packages/auth/src/client.ts` so plugin changes live in one place. Apps keep their own `baseURL` derivation and their own extra plugins (mob's `expoClient`).

## 1. Current contents of the relevant files

### packages/auth/src/client.ts — the factory (full)

Exports `RockyAuthClientOptions` interface + `createRockyAuthClient(options)`. Currently **dead code** — no app instantiates it.

```ts
// packages/auth/src/client.ts
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";

export interface RockyAuthClientOptions {
  baseURL?: string;
  /** Extra plugins (expoClient for mobile, etc.) */
  // biome-ignore lint/suspicious/noExplicitAny: better-auth plugins have complex union types
  plugins?: any[];
  fetchOptions?: {
    headers?: Record<string, string>;
    // biome-ignore lint/suspicious/noExplicitAny: better-auth customFetch signature
    customFetch?: (url: string, init: any) => Promise<Response>;
  };
}

export function createRockyAuthClient(options: RockyAuthClientOptions = {}) {
  const baseURL =
    options.baseURL ??
    (typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080")
      : "http://localhost:8080");

  return createAuthClient({
    baseURL,
    fetchOptions: options.fetchOptions,
    plugins: [
      adminClient(),
      organizationClient({ dynamicAccessControl: { enabled: true } }),
      twoFactorClient(),
      ...(options.plugins ?? []),
    ],
  });
}
```

Note: the factory already forwards `baseURL`, `fetchOptions`, and `plugins`. It returns the same `createAuthClient(...)` result type as the apps' direct calls, so the `authClient` object type is identical either way.

### packages/auth/src/index.ts — exports (full)

```ts
// packages/auth/src/index.ts
export { AUTH_CONFIG, AUTH_INSTANCE, AuthModule } from "./auth.module.js";
export { AuthResolver } from "./auth.resolver.js";
export { Auth, type AuthConfig, type AuthResult } from "./better-auth.js";
export { createRockyAuthClient } from "./client.js";
```

`createRockyAuthClient` IS exported from `@rocky/auth` (root). Additionally the package exposes a subpath export `@rocky/auth/client` (see package.json `exports` map below), which is what `docs/BETTER_AUTH_ENV_FIX.md` and ADR-0049 reference.

### apps/web/lib/auth-client.ts — full (direct createAuthClient)

```ts
// apps/web/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";

const _baseURL =
  typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080");

export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient({ dynamicAccessControl: { enabled: true } }), twoFactorClient()],
  baseURL: _baseURL,
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
```

GOTCHA: line 1 comment says "Uses shared factory from @rocky/auth/client" but the code imports `better-auth/react` directly and does NOT use the factory — stale/misleading comment. Web passes NO `fetchOptions` today.

### apps/mob/lib/auth.ts — full (direct createAuthClient + expo + CF customFetch)

```ts
// apps/mob/lib/auth.ts
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080",
  fetchOptions: cfFetchOptions,
  plugins: [
    adminClient(),
    organizationClient({ dynamicAccessControl: { enabled: true } }),
    twoFactorClient(),
    ...(Platform.OS !== "web"
      ? [ expoClient({ scheme: ..., cookiePrefix: "rocky", storagePrefix: "mobile", storage: SecureStore }) ]
      : []),
  ],
});

export const { signIn, signUp, signOut, resetPassword, getSession, useSession } = authClient;
```

Mob already branches `Platform.OS !== "web"` for the expo plugin — the factory should NOT force `disableDefaultFetchPlugins` for web.

### apps/mob/providers/session-provider.tsx — how it consumes authClient

Imports `authClient` from `@/lib/auth` (the raw client module). Uses `authClient.useSession()` (lines 15, 19) and `authClient.getSession()` (line 19). Re-exports its own `useSession()` (React context hook, unrelated to better-auth). Does NOT re-export the better-auth destructured names.

## 2. How @rocky/auth is consumed / resolved to dist

- **apps/web and apps/mob do NOT currently declare `@rocky/auth` as a dependency.** Confirmed: `rg "@rocky/auth" apps/web/package.json apps/mob/package.json` returns nothing (web only has `@rocky/authorization`). The apps import `createAuthClient` / plugins **directly from `better-auth/*`**, not from the factory. So the consolidation (Plan B) first requires adding `"@rocky/auth": "workspace:*"` to BOTH `apps/web/package.json` and `apps/mob/package.json`.
- `packages/auth/package.json` resolves to BUILT output:
  - `"main": "./dist/index.js"`, `"types": "./dist/index.d.ts"`, `"exports": { ".": dist, "./client": dist/client, "./*": dist/* }`.
  - No source `paths` mapping exists: `@rocky/typescript-config/base.json` has no `paths`; web's `nextjs.json`/`base.json` and mob's `expo/tsconfig.base` only map local aliases (`#lib`, `@/*`). So `@rocky/auth` resolves purely via node_modules → **built `dist`**. Changing the factory requires rebuilding `@rocky/auth` before web/mob pick it up.
- **Pattern to mirror:** `apps/api/package.json` already consumes `@rocky/auth` and `@rocky/email` via `"workspace:*"` and imports `AUTH_INSTANCE`, `Auth`, `AuthResolver`, `AuthModule` from `@rocky/auth` (compiled dist). web/mob should follow the same `workspace:*` convention.
- `packages/auth/tsconfig.json`: `outDir: ./dist`, `rootDir: ./src`, extends base (NodeNext moduleResolution). Build emits to `dist/`. Subpath `@rocky/auth/client` → `dist/client.js`/`.d.ts` exists.

## 3. Better Auth plugin imports actually used

- `better-auth/client/plugins` → `adminClient, organizationClient, twoFactorClient` (used in packages/auth, apps/web, apps/mob). Available because all three depend on `better-auth` (catalog `1.7.0-rc.1`).
- `@better-auth/expo/client` → `expoClient` (used ONLY in apps/mob today).
- `packages/auth/package.json` dependencies ALREADY include `"@better-auth/expo": "catalog:"` (and `better-auth`, `@better-auth/drizzle-adapter`, `@nestjs/common`, `@rocky/database`, `drizzle-orm`). So if the planner wanted to move the expo import into the factory it is already a dep — BUT Plan B keeps `expoClient` in mob (passed via `options.plugins`), so no dep move is required. mob keeps `@better-auth/expo` in its own deps (it does).

## 4. Type concerns for disableDefaultFetchPlugins

- `RockyAuthClientOptions.plugins` is typed `any[]` with a `biome-ignore` (no type friction).
- `disableDefaultFetchPlugins` is a **top-level** `createAuthClient` config option (Better Auth docs; recommended for RN/Expo to disable the default redirect plugin), NOT a plugin. The factory already passes a literal object to `createAuthClient`, so adding `disableDefaultFetchPlugins: options.disableDefaultFetchPlugins ?? false` is type-safe — no blocker. The factory should NOT hardcode it; expose it (default false) so web stays unaffected: `RockyAuthClientOptions` gains `disableDefaultFetchPlugins?: boolean`, and mob passes `disableDefaultFetchPlugins: Platform.OS !== "web"` alongside its `plugins: [expoClient(...)]`.

## 5. Consumers / blast radius

### createRockyAuthClient — truly dead code

`rg createRockyAuthClient` across apps/packages returns ONLY: docs (`AGENTS.md`, `docs/BETTER_AUTH_ENV_FIX.md`, `docs/AUTH_ARCHITECTURE.md`, `apps/docs/content/...`) and the definition in `packages/auth/src/client.ts` + export in `index.ts`. **No runtime instantiation** — confirms it is currently unused by any app.

### apps/web consumers of `authClient` / destructured exports

- `apps/web/lib/auth-client.ts` — defines `authClient` + `{ signIn, signOut, signUp, useSession, getSession }`.
- `apps/web/app/(admin)/dashboard/page.tsx:10` imports `authClient` from `#lib/auth-client`; uses `authClient.useSession()`.
- `apps/web/components/auth/auth-provider.tsx:4` imports `authClient`; line 21 passes `authClient as unknown as AuthClient` to `@better-auth-ui/react` provider (needs the full client object).
- External destructured imports:
  - `apps/web/lib/permissions.tsx:6` → `useSession` from `#lib/auth-client`
  - `apps/web/components/admin-shell.tsx:36` → `signOut, useSession`
  - `apps/web/components/command-palette.tsx:16` → `useSession`
  - `apps/web/components/dashboard/analytics.tsx:8` → `useSession`
- The better-auth-ui auth components (`sign-in.tsx`, `sign-up.tsx`, `sign-out.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `app/auth/[...path]/page.tsx`) consume `authClient` via `useAuth()` from `@better-auth-ui/react`, not the destructured names.
- **Action:** when switching web to the factory, keep `export const authClient` AND keep `export const { signIn, signOut, signUp, useSession, getSession } = authClient;` so the 4 external `useSession`/1 `signOut` importers keep working. Also fix the stale line-1 comment.

### apps/mob consumers

- `apps/mob/lib/auth.ts` — defines `authClient` + `{ signIn, signUp, signOut, resetPassword, getSession, useSession }`.
- `apps/mob/providers/trpc-provider.tsx:1,80` imports `authClient`; line 80 uses `authClient.getCookie()` (cast to `{ getCookie: () => string }`).
- `apps/mob/providers/session-provider.tsx:2,15,19` uses `authClient.useSession()` / `authClient.getSession()`.
- **Action:** keep `export const authClient` and the full destructured set when switching mob to the factory.
- **Test safety:** `apps/mob/test/render.tsx` does `vi.mock("@/lib/auth", () => ({ authClient: { getCookie: () => "" }, signIn, signUp, signOut, resetPassword, getSession, useSession }))`. It mocks the **raw module `@/lib/auth`**, not the factory, and provides the exact export names the providers consume. As long as `apps/mob/lib/auth.ts` continues to export `authClient` + those six names (even if internally it just re-exports from the factory), the mock keeps working. No test changes needed.

## 6. Other fetchOptions / customFetch / Cloudflare header sites

- `apps/mob/lib/auth.ts:16-23` is the ONLY place injecting Cloudflare Access headers (`CF-Access-Client-Id`/`CF-Access-Client-Secret`) via `customFetch`, gated on `EXPO_PUBLIC_CF_ACCESS_CLIENT_ID`/`EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET` (no CF → `undefined`). This already flows through the factory's `fetchOptions` param, so mob can keep passing `fetchOptions: cfFetchOptions` to `createRockyAuthClient(...)`.
- Web currently passes NO `fetchOptions`. The factory supports it; web can pass it later but **we are NOT changing web's fetchOptions now** — keep web's call without `fetchOptions`.
- Doc references: `docs/content/workorder.md:1428`, `docs/content/explanation/better-auth-and-cloudflare-access.md:119`, `docs/content/ADR/0083-...:106` describe the CF `customFetch` + factory `fetchOptions` forwarding.

## 7. Build / verify commands

- `@rocky/auth` build: `pnpm --filter @rocky/auth build` → runs `tsc -p tsconfig.build.json` (NODE_OPTIONS max-old-space-size=30720). `typecheck: tsc --noEmit`. `test: vitest run`. NOTE: must rebuild (or `turbo run build --filter=@rocky/auth`) before web/mob pick up factory changes because they resolve to `dist`.
- Root orchestration: `turbo run build` has `dependsOn: ["^build"]` → building web/mob via turbo builds `@rocky/auth` first (topological). BUT `turbo run dev` has `dependsOn: []` → dev will NOT auto-build the dep; `@rocky/auth` must be pre-built once (`pnpm --filter @rocky/auth build`) before `pnpm --filter web dev` / `pnpm --filter @rocky/mobile-app dev` (or `expo start`).
- `apps/web`: `dev: next dev --turbopack --port 3001`; `build: next build`; `check-types: tsc --noEmit`; `test: vitest run`; `lint: biome check .`.
- `apps/mob`: `dev: expo start -c`; `web/ios/android` variants; `test: vitest run`; (no `build` script for web bundle — uses `eas build` / `expo prebuild` for native). Mob typecheck via `tsc` (extends expo base) — no dedicated `check-types` script; `test` runs vitest.
- Verification steps for planner: (1) `pnpm --filter @rocky/auth build`; (2) `pnpm --filter web check-types && pnpm --filter web test`; (3) `pnpm --filter @rocky/mobile-app test` (vitest + jsdom; render.tsx mock covers auth); (4) optionally `pnpm --filter web build` and `pnpm build` (turbo) for full gate. Recall `ci:checks` does NOT run `next build`/`nest build` — a green `ci:checks` is not a green build.

## 8. RobotFarm / AGENTS.md doc pass

- `packages/auth/AGENTS.md` DOES document the factory: line 19 `client.ts | createRockyAuthClient() — shared factory for Next.js and Expo frontends. Pre-configures adminClient(), organizationClient(), twoFactorClient().` A RobotFarm pass should update this after the change (e.g., note both apps now consume it, and the `disableDefaultFetchPlugins` / native-only flag behavior).
- `apps/web/AGENTS.md` (2522 bytes) and `apps/mob/AGENTS.md` (24996 bytes) were grepped for `auth-client|createRockyAuthClient|authClient|better-auth` → **no matches**. Neither documents the client factory, so no RobotFarm pass is required on them (though mob's AGENTS may describe offline/auth at a higher level — worth a quick scan by the worker, but no factory-specific text found).
- Upstream/global docs that reference the factory (already consistent with intent, may need a touch-up after implementation): `docs/AUTH_ARCHITECTURE.md` (§client.ts, line 243), `docs/BETTER_AUTH_ENV_FIX.md` (already shows web/mob consuming `createRockyAuthClient` from `@rocky/auth/client` — i.e., these docs already describe the TARGET state, so they validate the plan), `apps/docs/content/ADR/0021-better-auth-configuration.md` and `apps/docs/content/ADR/0049-client-auth-session.md` (both already specify "Web + Mobile share createRockyAuthClient()"). The implementation closes the gap between these ADRs and the actual code.

## Summary of concrete changes the planner should make

1. `packages/auth/src/client.ts`: add `disableDefaultFetchPlugins?: boolean` to `RockyAuthClientOptions`; forward it in the `createAuthClient` call (default false).
2. `apps/web/package.json` + `apps/mob/package.json`: add `"@rocky/auth": "workspace:*"` (mob already has `better-auth` + `@better-auth/expo`; keep them).
3. `apps/web/lib/auth-client.ts`: switch to `import { createRockyAuthClient } from "@rocky/auth/client"`; keep `baseURL` derivation (`window.location.origin` / `NEXT_PUBLIC_API_URL`) and re-export `authClient` + the destructured names; fix the stale "shared factory" comment. Do NOT add `fetchOptions`.
4. `apps/mob/lib/auth.ts`: switch to `createRockyAuthClient({ baseURL: EXPO_PUBLIC_API_URL, fetchOptions: cfFetchOptions, plugins: [expoClient(...)], disableDefaultFetchPlugins: Platform.OS !== "web" })`; keep re-exports + `getCookie` availability.
5. Rebuild `@rocky/auth` before web/mob verification.
6. RobotFarm pass on `packages/auth/AGENTS.md`.
