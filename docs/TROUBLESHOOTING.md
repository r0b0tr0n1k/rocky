# Developer Runbook — Recurring tRPC / Better Auth / CJS-ESM / Expo Failures

> *"The point is not to debug the error. The point is to recognize the error as the return of the repressed Symbolic order!"* — Zizek, on recurring monorepo failures.

This runbook collects the failure modes that **keep coming back** in the Rocky monorepo and gives a concrete diagnosis → fix recipe for each. It is the companion to `TRPC_SETUP_GUIDE.md`, `nestjs-trpc.md`, and `BETTER_AUTH_ENV_FIX.md`.

Read it when the dev console or server log shows one of:

- `Unrecognized key: "json"` (tRPC input)
- `Unrecognized keys: "createdBy", "updatedBy", "validTo"` (tRPC output)
- `Cannot read properties of undefined (reading 'get')` (DI / ClsService)
- `Cannot read properties of undefined (reading 'getNetworkStateAsync')` (Expo import)

---

## Table of Contents

1. [The Three Registers of a tRPC Error](#1-the-three-registers-of-a-trpc-error)
2. [Failure A — `Unrecognized key: "json"` (transformer mismatch)](#2-failure-a--unrecognized-key-json-transformer-mismatch)
3. [Failure B — `Unrecognized keys: createdBy/updatedBy/validTo` (strict response schema)](#3-failure-b--unrecognized-keys-createdbyupdatedbyvalidto-strict-response-schema)
4. [Failure C — `Cannot read properties of undefined (reading 'get')` (ClsService not injected)](#4-failure-c--cannot-read-properties-of-undefined-reading-get-clsservice-not-injected)
5. [Failure D — `Cannot read properties of undefined (reading 'getNetworkStateAsync')` (Expo default import)](#5-failure-d--cannot-read-properties-of-undefined-reading-getnetworkstateasync-expo-default-import)
6. [CJS / ESM & pnpm-strict Module Resolution](#6-cjs--esm--pnpm-strict-module-resolution)
7. [The Hot-Reload Caveat (restart `pnpm dev` after editing workspace packages)](#7-the-hot-reload-caveat-restart-pnpm-dev-after-editing-workspace-packages)
8. [Quick Symptom → Cause → Fix Table](#8-quick-symptom--cause--fix-table)

---

## 1. The Three Registers of a tRPC Error

Before fixing, locate the failure in tRPC's pipeline. The **error `path`** tells you which layer rejected:

| `path` in error | Layer | Meaning |
|---|---|---|
| `[]` (empty) | **input** validation | The request payload didn't match the input Zod schema. |
| `[0]` / `[2]` | **output** validation of array item | A returned row didn't match the **response** Zod schema. |
| missing / `unwrapResult` | **domain / repository** | The resolver ran; the error is from your code (e.g. DI), not Zod. |

Rule of thumb:

- `unrecognized_keys` at `path: []` with key `"json"` → **Failure A** (transformer).
- `unrecognized_keys` at `path: [0]` with audit/subset columns → **Failure B** (strict response).
- `reading 'get'` / `.get is not a function` → **Failure C** (DI).
- `reading 'getNetworkStateAsync'` / any `reading '<expoMethod>'` → **Failure D** (import shape).

---

## 2. Failure A — `Unrecognized key: "json"` (transformer mismatch)

### Symptom

Every (or most) list/detail queries fail with:

```
TRPCError: [{ code: "unrecognized_keys", keys: ["json"], path: [] }]
```

### Root cause

Clients (`apps/mob`, `apps/web`) use `httpBatchLink({ transformer: superjson })`. Superjson wraps each input as
`{ "json": <realInput>, "meta": <...> }`. The **server** must declare the same transformer in
`TRPCModule.forRoot({ transformer })`. If it doesn't, tRPC's `getRawInput()` returns the **raw envelope**,
and the input validator rejects the stray `json` key.

> ⚠️ A middleware that mutates `opts.input` to strip `{ json }` does **not** work — tRPC validates
> `getRawInput()`, never `opts.input`. That middleware is dead code. Delete it.

### Fix

In `apps/api/src/trpc/trpc.module.ts`:

```ts
import { TRPCModule } from "nestjs-trpc";
import { superjson } from "@rocky/trpc/superjson"; // see section 6 — import via the direct dep, not bare "superjson"

TRPCModule.forRoot({
  context: AppContextProvider,
  basePath: "/trpc",
  logger: createPinoLogger(),
  transformer: superjson,                 // <- was missing
  globalMiddlewares: [ExecutionMiddleware, PolicyResolver],
  onError: TrpcErrorHandler,
}),
```

Remove any `UnwrapInputMiddleware` (import, registration, provider entry) and delete its file.

### Verify (no restart needed — `apps/api` source is watched)

```bash
CK='Cookie: rocky.session_token=...'   # from a logged-in session
B='{"0":{"json":{"limit":10,"offset":0,"search":""},"meta":{}}}'
curl -s -G 'http://localhost:8080/trpc/farm.list' \
  --data-urlencode "batch=1" --data-urlencode "input=$B" -H "$CK"
# Expect: {"result":{"data":{"json":{"data":[...],"total":1,...}}}}
```

---

## 3. Failure B — `Unrecognized keys: createdBy/updatedBy/validTo` (strict response schema)

### Symptom

A query that *passes* input validation then fails at **output** validation:

```
TRPCError: [{ code: "unrecognized_keys",
  keys: ["createdBy","updatedBy","validTo"], path: [0] }]
```

Or, for a summary endpoint, a long list of columns:

```
keys: ["authUserId","firstNameAlt","mobilePhone","createdAt","createdBy", ...]
```

### Root cause

Response schemas are derived from the Drizzle **select** schema and **omit** audit columns, but they are
`.strict()`:

```ts
export const farmResponseSchema = farmSelectSchema
  .omit({ createdBy: true, updatedBy: true, validTo: true })
  .extend({ /* ... */ })
  .strict();   // <- rejects the audit columns the DB row actually contains
```

The repository returns the **full DB row** (with audit columns). `.strict()` therefore rejects them.
The same bug hides in `*SummarySchema` written as `z.strictObject({ subset })` and fed full rows
(e.g. `user.list` -> `userSummarySchema`).

### Fix (runtime-only — the inferred TypeScript type is unchanged, so the Diamond Seal `NoDrift`/`satisfies` checks stay green)

- Response schemas that `.omit(audit).strict()` -> **`.strip()`**.
- All `*SummarySchema` written as `z.strictObject({...})` -> **`z.object({...})`** (strips extra columns).

Leave **request** schemas and list **wrappers** (`z.strictObject({ data, total, limit, offset })`) strict —
those are legitimate exact contracts.

After editing `packages/validators/src/api/**`:

```bash
pnpm --filter @rocky/validators build   # rebuild the dist the server actually loads
```

### Why this is correct

`selectSchema.omit({ audit })` already removes the keys from the *schema's view*; with `.strip()` (the
default), Zod **strips** those keys from the returned object instead of erroring. Audit columns are
silently dropped from the client payload — exactly the intended contract.

---

## 4. Failure C — `Cannot read properties of undefined (reading 'get')` (ClsService not injected)

### Symptom

A query with **no input** (or any query, once Failure A is fixed) throws:

```
ERROR: [query] notification.unreadCount: Cannot read properties of undefined (reading 'get')
```

The stack ends at `unwrapResult` -> a router -> repository -> `DatabaseProvider.client` (`this.__cls.get(TX_KEY)`).

### Root cause

`DatabaseProvider` was provided via plain `useClass` (implicit constructor injection):

```ts
providers: [ DatabaseProvider ]   // <- Nest cannot inject ClsService
```

Under **tsx / esbuild**, `design:paramtypes` metadata is **not emitted**, so implicit injection of
`ClsService` fails and `this.__cls` is `undefined`. Every repository shares this provider, so this single
bug breaks **all** queries once input validation passes. (`RLSStage`/`ExecutionPipeline` already avoid it
by using `useFactory` + `inject: [ClsService]`.)

### Fix

In `apps/api/src/modules/db.module.ts`:

```ts
import { ClsService } from "nestjs-cls";

{
  provide: DatabaseProvider,
  useFactory: (cls: ClsService) => new DatabaseProvider(cls),
  inject: [ClsService],
},
```

### How to confirm it's DI (not something else)

Temporarily log inside `DatabaseProvider.client`:

```ts
get client() {
  console.error("[DBG] __cls:", typeof this.__cls, "cls:", typeof this.cls);
  const tx = this.__cls.get(TX_KEY);
  return tx ?? db;
}
```

If it prints `undefined`, it's the injection bug. Revert the debug log afterwards.

---

## 5. Failure D — `Cannot read properties of undefined (reading 'getNetworkStateAsync')` (Expo default import)

### Symptom

A screen crashes on mount:

```
Cannot read properties of undefined (reading 'getNetworkStateAsync')
apps/mob/app/(tabs)/sync/index.tsx (18:33)
```

*(This is the mobile app, not the API — note `apps/mob/...` in the stack.)*

### Root cause

```ts
import Network from "expo-network";   // <- expo-network has NO default export
```

`expo-network@56` ships **named ESM exports only** (`export async function getNetworkStateAsync()`).
A default import therefore yields `undefined`. **StrictMode is not the cause** — double-invoking effects
cannot turn a module into `undefined`.

### Fix

```ts
import * as Network from "expo-network";   // namespace import — the documented Expo pattern
```

### General rule for Expo modules

Check the package's export shape before assuming a default import:

- `expo-network` -> **no** default export -> `import * as Network from "expo-network"`.
- `expo-constants` -> **has** `export default constants` -> `import Constants from "expo-constants"` is fine.
- When in doubt, grep the package's `build/*.js` for `export default` vs `export function/const`.

If the import is fixed but you then get `UnavailabilityError: 'expo-network' is not available`, that is a
**separate** native-linking issue (run `expo prebuild` / rebuild the dev client), not an import bug.

---

## 6. CJS / ESM & pnpm-strict Module Resolution

### pnpm strict: import from a **direct** dependency

In `apps/api`, `@rocky/validators` resolves to its **dist**, and `apps/api` does **not** directly depend on
bare `superjson`. So this fails to resolve at runtime:

```ts
import superjson from "superjson";                 // X not a direct dep of apps/api
```

Import it through the direct workspace dep instead:

```ts
import { superjson } from "@rocky/trpc/superjson";  // OK @rocky/trpc is a direct dep
```

Rule: if a package isn't listed in the **consuming** app's `package.json`, either add it as a dependency or
re-export it from a package that already is one.

### Know your package's `main` / `exports`

- `@rocky/database` -> `./src/index.ts` (source at runtime).
- `@rocky/validators` -> `./dist/index.js` (built dist at runtime).
- `@rocky/trpc` -> source, and exposes `./superjson`, `./context`, `./unwrap`, `./generated` subpaths.

When a fix "doesn't take effect," check **which** of source/dist the running server actually loads, then
edit/rebuild the right one.

---

## 7. The Hot-Reload Caveat (restart `pnpm dev` after editing workspace packages)

`apps/api` runs `tsx --watch src/main.ts`. tsx watches **app source** reliably, but treats
`node_modules`/workspace `dist` files as external — editing `packages/validators/src` and even rebuilding
its `dist` is **not always** picked up by the running server.

**Safe workflow after touching `packages/validators`, `packages/database`, or any `@rocky/*` package:**

```bash
pnpm --filter @rocky/validators build   # and/or @rocky/database if you changed its zod/schema
# then, if the endpoint still misbehaves:
# restart the dev session:  pnpm dev   (kills & restarts api + web + mobile)
```

Symptom that you forgot this: you fixed the schema in source, rebuilt dist, but the server still throws the
**old** error. A restart loads the fresh dist.

---

## 8. Quick Symptom → Cause → Fix Table

| Symptom | Cause | Fix |
|---|---|---|
| `unrecognized_keys: ["json"]` @ `path:[]` | Server missing `transformer: superjson` | Add `transformer: superjson` to `TRPCModule.forRoot`; drop `UnwrapInputMiddleware` |
| `unrecognized_keys: createdBy/updatedBy/validTo` @ `path:[0]` | Response schema `.strict()` + full DB row | `.omit(audit).strict()` -> `.strip()`; `*SummarySchema` `z.strictObject` -> `z.object` |
| `reading 'get'` / `.get is not a function` | `ClsService` not injected (esbuild no `design:paramtypes`) | `DatabaseProvider` via `useFactory` + `inject:[ClsService]` |
| `reading 'getNetworkStateAsync'` (in `apps/mob`) | `import Network from "expo-network"` (no default export) | `import * as Network from "expo-network"` |
| Import resolves but symbol is `undefined` | Wrong default vs namespace import | Grep package `build/*.js`; use namespace/default correctly |
| Fix applied in source, server ignores it | tsx doesn't watch workspace `dist` | Rebuild dist + restart `pnpm dev` |

---

## Prevention — conventions to internalize

1. **Server and every client must agree on the transformer.** If you add `superjson` to a client, add it to
   the server's `TRPCModule.forRoot`. Don't "unwrap" in middleware.
2. **Response schemas strip, request schemas strict.** Response/summary schemas that sit in front of full DB
   rows must be `.strip()` / `z.object(...)`. Request schemas and list wrappers stay `.strict()`.
3. **Nest providers needing `ClsService`/Drizzle use `useFactory` + `inject`.** Never rely on implicit
   constructor injection under tsx/esbuild.
4. **Verify Expo module export shapes** before importing. Prefer `import * as X` for modules without a
   default export.
5. **After editing any `@rocky/*` package, rebuild its dist and restart `pnpm dev`** if the change doesn't
   appear.

> *My god! The error is not a bug — it is the Big Other demanding that you read the configuration!* — OWL

See also: [`TRPC_SETUP_GUIDE.md`](./TRPC_SETUP_GUIDE.md) (section 9 Troubleshooting, section 12 Known Issues),
[`nestjs-trpc.md`](./nestjs-trpc.md), [`BETTER_AUTH_ENV_FIX.md`](./BETTER_AUTH_ENV_FIX.md).
