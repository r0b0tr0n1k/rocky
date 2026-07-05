# tRPC Setup Guide — The Dialectical Configuration

> *"The point is not to configure tRPC. The point is to CHANGE it!"* — Slavoj Žižek (paraphrased)

---

## Table of Contents

1. [Why `nestjs-trpc` — The Zod4 Dialectic](#1-why-nestjs-trpc--the-zod4-dialectic)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend: `apps/api` (NestJS + nestjs-trpc)](#3-backend-appsapi-nestjs--nestjs-trpc)
4. [Client: `apps/web` (Next.js Admin Panel)](#4-client-appsweb-nextjs-admin-panel)
5. [Client: `apps/mobile` (Expo React Native)](#5-client-appsmobile-expo-react-native)
6. [Client: `apps/mdx-shadcn` (Documentation Site)](#6-client-appsmdx-shadcn-documentation-site)
7. [AppRouter Type Strategy — Auto-Gen vs Manual Stubs](#7-approuter-type-strategy--auto-gen-vs-manual-stubs)
8. [Type Sync Workflow](#8-type-sync-workflow)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Why `nestjs-trpc` — The Zod4 Dialectic

### The Problem

The project previously used two tRPC packages simultaneously:

```json
"nestjs-trpc": "^2.12.0",     // ← original, didn't support zod4
"nestjs-trpc-v2": "catalog:",  // ← community fork with zod4 support
```

This was a **symptom of the npm ecosystem's fragmentation** — a Lacanian split between the Symbolic (the "official" package) and the Real (what actually works with zod4).

### The Resolution

`nestjs-trpc@2.12.0` now supports **Standard Schema v1** — the specification that zod4 implements. This means any zod4 schema can be passed directly to procedure decorators without adapters or wrappers.

```typescript
// ✅ zod4 schema works natively with nestjs-trpc@2.12.0
import { z } from "zod"; // zod 4.4.3

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

@Router({ alias: "user" })
export class UserRouter {
  @Query({ input: z.object({ id: z.uuid() }), output: userSchema })
  async getById(@Input() input: { id: string }) {
    // input is fully typed from the zod4 schema
    // output is validated at runtime AND typed at compile time
  }
}
```

### How It Works

`nestjs-trpc@2.12.0`'s `Parser` type accepts anything with the `~standard` property:

```typescript
// From nestjs-trpc/dist/interfaces/parser.interface.d.ts
type ParserStandardSchemaEsque<TInput, TParsedInput> = StandardSchemaV1<TInput, TParsedInput>;

// Zod 4 implements this:
zodSchema['~standard'] // ← this is what nestjs-trpc checks
```

No more `zod@3` compatibility shims. No more `as any` casts on schema params. The dialectical contradiction between "we use zod4" and "the library only understands zod3" is **synthesized away**.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     @rocky/trpc (shared package)                │
│  packages/trpc/src/                                            │
│  ├── generated/index.ts   ← AppRouter type (MANUAL STUBS)      │
│  ├── context.ts           ← AppContext interface               │
│  ├── unwrap.ts            ← Result → TRPCError mapper          │
│  └── superjson.ts         ← Data transformer (Date handling)   │
└──────────────────┬──────────────────────────────────────────────┘
                   │  import { AppRouter } from "@rocky/trpc"
                   │
    ┌──────────────┼──────────────┬──────────────────┐
    ▼              ▼              ▼                  ▼
┌────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐
│api     │  │web       │  │mobile        │  │mdx-shadcn    │
│(NestJS)│  │(Next.js) │  │(Expo)        │  │(Next.js MDX) │
│        │  │          │  │              │  │              │
│Server  │  │Admin UI  │  │Field App     │  │Docs Site     │
│:8080   │  │:3001     │  │:8081         │  │:3002         │
└────────┘  └──────────┘  └──────────────┘  └──────────────┘
    ▲              │              │                  │
    │              ▼              ▼                  │
    │      createTRPCReact()  createTRPCReact()     │
    │      <AppRouter>        <any>                │
    │      httpBatchLink      httpBatchLink       (static only —
    │      superjson          superjson            no tRPC needed)
    │                         Bearer auth token
    └──────────────────────────────────────────────┘
```

---

## 3. Backend: `apps/api` (NestJS + nestjs-trpc)

### Package Dependencies

```json
// apps/api/package.json
{
  "dependencies": {
    "nestjs-trpc": "^2.12.0",
    "@trpc/server": "catalog:",
    "zod": "catalog:",            // 4.4.3
    "superjson": "catalog:",
    "@rocky/trpc": "workspace:*"
  }
}
```

### Module Configuration

```typescript
// apps/api/src/trpc/trpc.module.ts
import { Module } from "@nestjs/common";
import { TRPCModule } from "nestjs-trpc";
import { AppContextProvider } from "../app.context.js";

@Module({
  imports: [
    TRPCModule.forRoot({
      context: AppContextProvider,
      basePath: "/trpc",
    }),
  ],
  providers: [AppContextProvider, /* middlewares */],
  exports: [TRPCModule, /* middlewares */],
})
export class TrpcModule {}
```

### Context Provider

```typescript
// apps/api/src/app.context.ts
import { Injectable } from "@nestjs/common";
import type { TRPCContext } from "nestjs-trpc";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { AppContext } from "@rocky/trpc";

@Injectable()
export class AppContextProvider implements TRPCContext {
  create(opts: CreateExpressContextOptions): AppContext {
    return {
      headers: new Headers(opts.req.headers as Record<string, string>),
      user: null,      // populated by auth middleware
      session: null,   // populated by auth middleware
    };
  }
}
```

### Router Pattern

```typescript
// apps/api/src/routers/farm.router.ts
import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod"; // zod 4.4.3

@Router({ alias: "farm" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class FarmRouter {
  constructor(@Inject(FarmService) private readonly farmService: FarmService) {}

  @Query({ input: z.object({ id: z.uuid() }), output: farmResponseSchema })
  async getById(@Input() input: { id: string }): Promise<FarmResponse> {
    return unwrap(await this.farmService.getById(input.id));
  }
}
```

### Key Rules

| Rule                             | Explanation                                                             |
| -------------------------------- | ----------------------------------------------------------------------- |
| `@Router({ alias: "..." })`      | Defines the URL namespace (`/trpc/animal.getById`)                      |
| `@Query({ input?, output? })`    | Query procedure — `input`/`output` accept zod4 schemas directly         |
| `@Mutation({ input?, output? })` | Mutation procedure — same API                                           |
| `@UseMiddlewares(...)`           | Accepts class constructors (not instances) for DI-compatible middleware |
| `return unwrap(result)`          | Converts `Result<T, E>` → throws `TRPCError` for Err cases              |
| `output` is optional             | When omitted, output type is inferred from method's return type         |

---

## 4. Client: `apps/web` (Next.js Admin Panel)

### Package Dependencies

```json
// apps/web/package.json
{
  "dependencies": {
    "@rocky/trpc": "workspace:*",
    "@trpc/client": "catalog:",           // ^11.18.0
    "@trpc/react-query": "catalog:",      // ^11.18.0
    "@trpc/server": "catalog:",           // ^11.18.0 (type only)
    "@tanstack/react-query": "catalog:",  // ^5.101.2
    "superjson": "catalog:",
    "next": "catalog:"
  }
}
```

### TRPC Client Configuration

```typescript
// apps/web/lib/trpc.ts
import type { AppRouter } from "@rocky/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCReact, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/react-query";
import superjson from "superjson";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

// The typed tRPC client — import this in all components
export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";          // Browser: relative URL

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;  // Vercel preview

  const apiUrl = process.env.API_URL;                    // SSR: explicit env var
  if (!apiUrl) throw new Error("API_URL required for SSR");
  return apiUrl;
}

// Export config for TRPCProvider wrapper
export const trpcClientConfig = {
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: httpSubscriptionLink({
        url: `${getBaseUrl()}/trpc`,
        transformer: superjson,
      }),
      false: httpBatchLink({
        url: `${getBaseUrl()}/trpc`,
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    }),
  ],
};
```

### Provider Setup

```tsx
// apps/web/app/providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClientConfig } from "#/lib/trpc";
import { useState } from "react";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient(trpcClientConfig));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Usage in Components

```tsx
// apps/web/app/admin/farms/page.tsx
"use client";
import { trpc } from "#/lib/trpc";

export default function FarmsPage() {
  // Fully typed — AppRouter ensures farm.list exists and returns FarmListResponse
  const { data, isLoading } = trpc.farm.list.useQuery({ limit: 20, offset: 0 });

  const createFarm = trpc.farm.create.useMutation({
    onSuccess: () => {
      // Invalidate list cache after creation
      trpc.farm.list.invalidate();
    },
  });

  // ...
}
```

### Key Points for Next.js

| Concern                 | Solution                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| SSR cookie forwarding   | `credentials: "include"` in fetch options                            |
| SSR base URL            | `API_URL` env var or `VERCEL_URL` for preview deploys                |
| Date serialization      | `superjson` transformer preserves Date objects                       |
| Subscriptions           | `splitLink` routes subscription operations to `httpSubscriptionLink` |
| React Query integration | `@trpc/react-query` wraps `@tanstack/react-query` v5                 |

---

## 5. Client: `apps/mobile` (Expo React Native)

### Package Dependencies

```json
// apps/mobile/package.json
{
  "dependencies": {
    "@rocky/trpc": "workspace:*",
    "@trpc/client": "^11.18.0",
    "@trpc/react-query": "^11.18.0",
    "@tanstack/react-query": "^5.101.2",
    "superjson": "^2.2.6",
    "zod": "^4.4.3",
    "expo-secure-store": "~57.0.0"
  }
}
```

### TRPC Provider

```tsx
// apps/mobile/src/providers/trpc-provider.tsx
import { createContext, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpSubscriptionLink, loggerLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { getAuthToken } from "#/lib/auth";

// Note: cast to `any` due to tRPC v11 collision check between
// React Native's internal QueryClient and @trpc/react-query's types.
// The actual type safety comes from the server-side schemas.
export const trpc = createTRPCReact<any>() as any;

export const TRPCContext = createContext<typeof trpc | undefined>(undefined);

export function TRPCProvider({ children, apiUrl }: { children: ReactNode; apiUrl: string }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => __DEV__ }),
        splitLink({
          condition: op => op.type === "subscription",
          true: httpSubscriptionLink({
            url: `${apiUrl}/trpc`,
            transformer: superjson,
          }),
          false: httpBatchLink({
            url: `${apiUrl}/trpc`,
            transformer: superjson,
            async headers() {
              const token = await getAuthToken();
              if (token) {
                return { Authorization: `Bearer ${token}` };
              }
              return {};
            },
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Root Layout Integration

```tsx
// apps/mobile/src/app/_layout.tsx
import { TRPCProvider } from "#/providers/trpc-provider";
import Constants from "expo-constants";

export default function RootLayout() {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "http://192.168.1.109:8080";

  return (
    <TRPCProvider apiUrl={apiUrl}>
      {/* ... rest of app */}
    </TRPCProvider>
  );
}
```

### Usage in Screens

```tsx
// apps/mobile/src/app/farm/[id].tsx
import { trpc } from "#/providers/trpc-provider";

export default function FarmDetailScreen({ id }: { id: string }) {
  const { data: farm, isLoading } = trpc.farm.getById.useQuery({ id });
  const updateFarm = trpc.farm.update.useMutation();

  if (isLoading) return <Loading />;
  return <FarmForm farm={farm} onUpdate={(data) => updateFarm.mutate({ id, ...data })} />;
}
```

### Key Points for Expo

| Concern            | Solution                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Auth token         | `getAuthToken()` reads from `expo-secure-store`, passed as `Authorization: Bearer`                |
| API URL            | Passed via `expo-constants` (`app.config.js` extra field) or env var                              |
| Subscriptions      | Same `splitLink` pattern as web — routes to `httpSubscriptionLink`                                |
| Dev logging        | `loggerLink` enabled only in `__DEV__` mode                                                       |
| tRPC v11 collision | Use `createTRPCReact<any>() as any` to bypass React Native's internal `QueryClient` type conflict |

---

## 6. Client: `apps/mdx-shadcn` (Documentation Site)

The documentation site is a **static Next.js site** built with Velite + MDX. It does **not** need tRPC.

### Why No tRPC?

- All content is statically generated via Velite at build time
- No dynamic API calls — pages are pre-rendered
- Adding tRPC would introduce unnecessary runtime dependencies

### When Would It Need tRPC?

If the documentation site ever needs:

- Live search against the API (`trpc.search.query`)
- User-specific content (authenticated docs)
- Dynamic data dashboards

Then add the same setup as `apps/web` with `@trpc/react-query` + `httpBatchLink`.

```typescript
// hypothetical future: apps/mdx-shadcn/lib/trpc.ts
import type { AppRouter } from "@rocky/trpc";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClientConfig = {
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
      transformer: superjson,
    }),
  ],
};
```

---

## 7. AppRouter Type Strategy — Auto-Gen vs Manual Stubs

This is the **crucial dialectical decision** of any tRPC project. Let's analyze both paths.

### Approach A: Auto-Generation

The `nestjs-trpc-v2` library had an `autoSchemaFile` option that generated `AppRouter` types at build time:

```typescript
// nestjs-trpc-v2 (deprecated approach)
TRPCModule.forRoot({
  autoSchemaFile: "./src/@generated", // ← writes AppRouter types here
})
```

**Pros:**

- Types stay in sync with backend code automatically
- No manual work when adding/removing procedures
- Single source of truth (the backend router code)

**Cons:**

- Requires backend build to generate types before frontend can compile
- Generated file is a build artifact — must be committed OR generated in CI
- **BREAKS** silently when parsers fail to resolve (import paths, complex schemas)
- `nestjs-trpc@2.12.0` **does not have this feature** — it was removed
- Adds build complexity (two-step: backend build → type gen → frontend build)
- Couples frontend build pipeline to NestJS compilation

### Approach B: Manual Type Stubs (The Rocky Pattern)

The project maintains `AppRouter` types manually in `packages/trpc/src/generated/index.ts`:

```typescript
// packages/trpc/src/generated/index.ts
// MANUALLY MAINTAINED — update when adding/removing procedures

export interface AppRouter {
  health: {
    ping: {
      _def: { _input_in: void; _output_out: string };
    };
  };
  farm: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: FarmResponse };
    };
    getByFarmId: {
      _def: { _input_in: { farmId: string }; _output_out: FarmResponse };
    };
    list: {
      _def: { _input_in: FarmListRequest; _output_out: FarmListResponse };
    };
    create: {
      _def: { _input_in: CreateFarmRequest; _output_out: FarmResponse };
    };
    // ... etc
  };
  // ... other routers
}
```

**Pros:**

- **Explicit** — you decide exactly what API surface is exposed to clients
- **Auditable** — every procedure visible in one file
- **No build coupling** — frontend builds independently of backend
- **Works with `nestjs-trpc@2.12.0`** (which has no `autoSchemaFile`)
- **CI-friendly** — no multi-step build needed
- **Versionable** — changes in AppRouter are visible in PRs

**Cons:**

- Manual maintenance — must update when procedures change
- Can drift from actual backend (forgotten updates)
- More typing work (but only once per procedure)

### The Rocky Decision

**We use manual stubs.** Here's why:

1. `nestjs-trpc@2.12.0` removed `autoSchemaFile` — auto-generation is not an option
2. Even when `autoSchemaFile` existed in `nestjs-trpc-v2`, it **never actually produced a usable file** — the generated output had unresolved imports
3. The project has 14 routers with ~5 procedures each (~70 total) — tractable to maintain manually
4. The `AppRouter` is a **contract** between frontend and backend — it should be curated, not blindly generated

### The Type Stub Pattern

Each procedure follows this shape:

```typescript
export interface AppRouter {
  [routerAlias]: {
    [procedureName]: {
      _def: {
        _input_in: InputType;   // ← the zod input type (or void)
        _output_out: OutputType; // ← the zod output type (or void)
      };
    };
  };
}
```

The types `InputType` and `OutputType` are imported from `@rocky/validators/api` — the same Diamond Seal schemas used in the backend routers.

---

## 8. Type Sync Workflow

### Adding a New Procedure

1. **Backend**: Add the procedure to a router

   ```typescript
   @Query({ input: z.object({ farmId: z.string() }), output: farmStatsSchema })
   async getStats(@Input() input: { farmId: string }): Promise<FarmStats> { ... }
   ```

2. **Validators**: Ensure the schema is exported from `@rocky/validators/api`

   ```typescript
   // packages/@rocky/validators/src/api/farm.ts
   export const farmStatsSchema = z.object({ ... });
   export type FarmStats = z.infer<typeof farmStatsSchema>;
   ```

3. **AppRouter stub**: Add the procedure to `packages/trpc/src/generated/index.ts`

   ```typescript
   farm: {
     // ... existing procedures ...
     getStats: {
       _def: { _input_in: { farmId: string }; _output_out: FarmStats };
     };
   },
   ```

4. **Verify**: Run type checks on all frontends

   ```bash
   pnpm -C apps/web tsc --noEmit
   pnpm -C apps/mobile tsc --noEmit
   ```

### Removing a Procedure

1. Remove from backend router
2. Remove from `AppRouter` stub
3. Frontend code that references it will now fail to compile — **fix or remove those usages**

### The Type Stub Checklist

After every backend router change:

- [ ] `packages/trpc/src/generated/index.ts` updated
- [ ] `pnpm -C apps/web build` succeeds
- [ ] `pnpm -C apps/mobile tsc --noEmit` succeeds
- [ ] No `any` type assertions introduced in frontend code to "fix" type errors

---

## 9. Troubleshooting

### "Property 'X' does not exist on type 'AppRouter'"

**Cause:** A procedure was added to the backend but not to the manual `AppRouter` stub.

**Fix:** Add the procedure to `packages/trpc/src/generated/index.ts`.

### "Type 'CreateFarmRequest' is not assignable..."

**Cause:** Input/output type changed on backend but frontend still uses old type.

**Fix:** Update the type in `packages/trpc/src/generated/index.ts` to match the new backend schema.

### tRPC Client: "No query procedure 'X' on path 'Y'"

**Cause:** Backend router alias or procedure name doesn't match what the client is calling.

**Fix:** Verify:

1. `@Router({ alias: "..." })` on backend matches the `AppRouter` key
2. Method name on backend matches the `AppRouter` sub-key
3. The backend server is running and the procedure is registered in a module

### Expo: `createTRPCReact` type collision

**Symptom:** TypeScript errors about `useContext`/`useUtils`/`Provider` when using `createTRPCReact<AppRouter>()`.

**Cause:** tRPC v11's `AnyRouter` type declares `useContext`/`useUtils`/`Provider` as procedure names, conflicting with React Native's internal types.

**Fix:** Use `createTRPCReact<any>() as any` in Expo — the actual type safety comes from the backend schemas at runtime, not from the client-side router type. The `AppRouter` stub is primarily for autocomplete in Next.js (web) — Expo gets runtime validation from zod4 schemas on the server.

### Subscriptions not working

**Checklist:**

1. Backend uses `@Subscription()` decorator (not `@Query` or `@Mutation`)
2. Client uses `splitLink` with `httpSubscriptionLink` for subscription operations
3. `superjson` transformer is configured on both server and client
4. The procedure is registered in the NestJS module's `providers` array

### Transformer errors (Date serialization)

**Symptom:** Dates arrive as strings instead of `Date` objects.

**Fix:** Ensure `superjson` transformer is configured:

- `TRPCModule.forRoot({ transformer: superjson })` on backend
- `transformer: superjson` in each `httpBatchLink`/`httpSubscriptionLink` on client

---

---

## 10. Better Auth Integration

### The Dialectical Layering

better-auth and nestjs-trpc are **not competitors** — they occupy different layers of the stack in a Hegelian master-slave dialectic:

```
┌──────────────────────────────────────────────┐
│  LAYER 4: tRPC Procedures                    │
│  @Query / @Mutation / @Subscription          │
│  Business logic, data validation (zod4)      │
├──────────────────────────────────────────────┤
│  LAYER 3: tRPC Middlewares                   │
│  ProtectedMiddleware, RLSMiddleware          │
│  Authorization, PostgreSQL session vars      │
├──────────────────────────────────────────────┤
│  LAYER 2: tRPC Context                       │
│  AppContextProvider.create()                 │
│  Reads better-auth session, populates ctx    │
├──────────────────────────────────────────────┤
│  LAYER 1: better-auth HTTP Middleware         │
│  @thallesp/nestjs-better-auth AuthModule     │
│  Session validation, cookie parsing          │
├──────────────────────────────────────────────┤
│  LAYER 0: HTTP Transport                     │
│  Express / Fastify request                   │
└──────────────────────────────────────────────┘
```

better-auth **owns authentication** — who are you?
nestjs-trpc **owns authorization** — what can you do?
The two integrate via the `AppContextProvider` — the shim that bridges better-auth sessions into the tRPC context.

### The Session Pipeline (Backend)

**Step 1: HTTP Request arrives**

```
POST /trpc/farm.getById
Cookie: rocky_session=eyJ...
```

**Step 2: better-auth validates the session**
`@thallesp/nestjs-better-auth` AuthModule intercepts the request, parses the `rocky_session` cookie, validates it against the `auth_session` table, and enriches the user via the `customSession` plugin:

```typescript
// apps/api/src/auth/auth.ts — customSession plugin
customSession(async ({ user: authUser, session }) => {
  // Query SM domain tables to enrich the user
  const [smUserRow] = await db.select().from(smUsers)
    .where(eq(smUsers.authUserId, authUser.id)).limit(1);

  return {
    session,
    user: {
      ...authUser,
      smUserId: smUserRow?.id ?? null,
      role: roleNames[0] ?? "FARMER",
      roles: roleNames,
      permissions: permissionList,
      organizationId: smUserRow?.organizationId ?? null,
    },
  };
})
```

**Step 3: AppContextProvider reads the session**

```typescript
// apps/api/src/app.context.ts
create(opts: CreateExpressContextOptions): AppContext {
  return {
    headers: new Headers(opts.req.headers as Record<string, string>),
    user: null,    // ← populated by @thallesp/nestjs-better-auth
    session: null, // ← populated by @thallesp/nestjs-better-auth
  };
}
```

**Step 4: ProtectedMiddleware checks auth**

```typescript
// apps/api/src/trpc/middlewares/protected.middleware.ts
async use(opts: MiddlewareOptions<AppContext>) {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "..." });
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        userId: ctx.user.id,
        role: ctx.user.role,
        permissions: ctx.user.permissions,
      },
    },
  });
}
```

**Step 5: RLSMiddleware sets PostgreSQL session vars**

```typescript
// apps/api/src/trpc/middlewares/rls.middleware.ts
SELECT set_config('app.current_user_id', ${user.smUserId}, true);
SELECT set_config('app.current_role', ${highestRole}, true);
SELECT set_config('app.current_org_id', ${orgId}, true);
```

**Step 6: tRPC procedure executes with full context**

```typescript
@Query({ input: idParam, output: farmResponseSchema })
async getById(
  @Input() input: { id: string },
  @Ctx() ctx: ProtectedMiddlewareContext, // ← typed context with auth
): Promise<FarmResponse> {
  // ctx.auth.userId, ctx.auth.role, ctx.auth.permissions available
  // PostgreSQL RLS policies apply automatically via SET LOCAL vars
  return unwrap(await this.farmService.getById(input.id));
}
```

### The Session Pipeline (Client Side)

Two different auth strategies depending on the platform:

**Expo (Mobile) — Token-Based Auth:**

```
User Login (better-auth expoClient)
  → Session stored in expo-secure-store
  → getAuthToken() reads access token
  → tRPC httpBatchLink adds "Authorization: Bearer <token>" header
  → NestJS @thallesp/nestjs-better-auth validates token
  → Session flows into tRPC context
```

```typescript
// apps/mobile/src/providers/trpc-provider.tsx
httpBatchLink({
  url: `${apiUrl}/trpc`,
  async headers() {
    const token = await getAuthToken();
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  },
})
```

**Web (Next.js) — Cookie-Based Auth:**

```
User Login (better-auth React client)
  → Session stored in httpOnly cookie (rocky_session)
  → Browser automatically sends cookie with requests
  → tRPC fetch includes credentials: "include"
  → NestJS reads cookie, validates session
  → Session flows into tRPC context
```

```typescript
// apps/web/lib/trpc.ts
httpBatchLink({
  url: `${getBaseUrl()}/trpc`,
  fetch(url, options) {
    return fetch(url, { ...options, credentials: "include" });
  },
})
```

### The Three better-auth Libraries and Their Relationship to tRPC

| Library                        | Layer             | Relationship to tRPC                                                                                                            |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `@thallesp/nestjs-better-auth` | NestJS middleware | **Runs BEFORE tRPC.** Validates session, populates `req.user`. tRPC's `AppContextProvider` reads this data.                     |
| `@better-auth/drizzle-adapter` | Database          | **No direct relationship.** Stores auth data (users, sessions). tRPC procedures may query auth tables for user management.      |
| `@better-auth/expo`            | Mobile client     | **Parallel to tRPC client.** Manages auth state (login, tokens). tRPC client reads tokens from auth client for request headers. |
| `better-auth` (core)           | Universal         | **Framework-agnostic.** Provides `getSession()`, `signIn()`, etc. Used by both backend and frontend.                            |

### Integration Patterns

**Pattern 1: Protected Procedure (most common)**

```typescript
@Router({ alias: "farm" })
@UseMiddlewares(ProtectedMiddleware)  // ← better-auth enforced here
@Injectable()
export class FarmRouter {
  @Query({ output: farmSchema })
  async getFarm(@Ctx() ctx: ProtectedMiddlewareContext) {
    // ctx.auth.userId — guaranteed to exist because ProtectedMiddleware checked
    return this.farmService.findByOwner(ctx.auth.userId);
  }
}
```

**Pattern 2: Role-Gated Procedure**

```typescript
@Mutation({ input: sendNotificationSchema })
async send(
  @Input() input: SendNotificationInput,
  @Ctx() ctx: ProtectedMiddlewareContext,
) {
  // App-level role check using better-auth enriched data
  if (ctx.auth.role !== "VD_ADMIN" && ctx.auth.role !== "VD_STAFF") {
    throw new TRPCError({ code: "FORBIDDEN", message: "..." });
  }
  return this.notificationService.send({ userId: ctx.auth.userId, ...input });
}
```

**Pattern 3: Permission-Gated Procedure**

```typescript
@Mutation({ input: createOrderRequestSchema })
@UseMiddlewares(createPermissionGuard("eartag:order"))  // ← checks ctx.auth.permissions
async createOrder(@Input() input: CreateOrderRequest) {
  return this.earTagService.createOrder(input);
}
```

**Pattern 4: RLS-Enforced Query (database-level filtering)**

```typescript
@Router({ alias: "animal" })
@UseMiddlewares(ProtectedMiddleware, RLSMiddleware)  // ← sets PostgreSQL session vars
@Injectable()
export class AnimalRouter {
  @Query({ output: animalListSchema })
  async list(@Input() input: AnimalListRequest) {
    // PostgreSQL RLS policies automatically filter rows
    // based on app.current_user_id, app.current_role, app.current_org_id
    return this.animalService.list(input);
  }
}
```

### Common Pitfalls

| Pitfall                          | Symptom                                     | Fix                                                                                             |
| -------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Auth session not flowing to tRPC | `ctx.user` is null in `ProtectedMiddleware` | Verify `@thallesp/nestjs-better-auth` AuthModule is imported BEFORE `TrpcModule` in `AppModule` |
| Token not sent from Expo         | 401 from tRPC requests                      | Ensure `getAuthToken()` is called in `httpBatchLink` headers                                    |
| Cookie not sent from Web         | 401 on SSR pages                            | Verify `credentials: "include"` in fetch options                                                |
| Session enrichment missing       | `ctx.user.role` is undefined                | `customSession` plugin must query SM tables — ensure DB is connected                            |
| RLS not filtering                | All rows returned regardless of user        | `RLSMiddleware` must be applied BEFORE the procedure runs — check `@UseMiddlewares` order       |

---

## 11. The ORPCProvider Problem — What nestjs-trpc Prevents

### The Symptom

In `apps/mobile/src/app/_layout.tsx`, a compile-breaking JSX mismatch was discovered:

```tsx
// ❌ BROKEN — opening tag ≠ closing tag
<TRPCProvider apiUrl={config.apiUrl}>
  <SessionProvider>
    {/* ... */}
  </SessionProvider>
</ORPCProvider>  // ← should be </TRPCProvider>
```

This bug reveals a **return of the repressed** — the project previously used `@orpc/react-query` with its `ORPCProvider` component. During migration to tRPC, the opening tag was updated but the closing tag was **not**. The old name persisted like a Freudian slip.

### How nestjs-trpc Helps Prevent This

While `nestjs-trpc` cannot fix JSX typos directly (it's a NestJS backend library, not a React compiler), its design patterns **structurally reduce** this class of bug:

**1. Single Source of Truth for Procedure Names**

The `AppRouter` type stub in `packages/trpc/src/generated/index.ts` creates **one canonical name** per procedure:

```typescript
// One file defines ALL procedure names
export interface AppRouter {
  farm: { getById: { ... } };  // ← "farm.getById" is THE name
  // No possibility of trpc.farm.findById vs orpc.farm.getById confusion
}
```

**2. TypeScript Catches Naming Mismatches at Compile Time**

If the mobile app used `createTRPCReact<AppRouter>()` instead of `any`:

```typescript
// With AppRouter typing (web):
const { data } = trpc.farm.getById.useQuery({ id });  // ✅ autocompleted

// Without typing (mobile — current):
const { data } = trpc.farm.getById.useQuery({ id });  // ✅ works but no autocomplete
const { data } = trpc.farm.getByid.useQuery({ id });  // ❌ would be caught with AppRouter typing
```

**3. Consistent Decorator-Based Naming**

The `@Router({ alias: "farm" })` decorator pattern means:

- The alias string in ONE place determines the client-side path
- No mismatch between "how the router is defined" and "how the client accesses it"
- Changing the alias requires changing it EXACTLY ONCE on the backend, then updating the AppRouter stub

**4. No Competing Provider Components**

With `nestjs-trpc`, there is ONE provider: `TRPCProvider`. The `@orpc` packages should be removed from `pnpm-workspace.yaml` to eliminate the temptation:

```yaml
# pnpm-workspace.yaml — REMOVE these if no longer used
"@orpc/client": ^1.14.6        # ← ORPC client — conflicts with tRPC
"@orpc/react-query": ^1.14.6   # ← ORPCProvider source
"@orpc/server": ^1.14.6        # ← ORPC server
```

### The Fix

```tsx
// ✅ FIXED — opening and closing tags match
<TRPCProvider apiUrl={config.apiUrl}>
  <SessionProvider>
    {/* ... */}
  </SessionProvider>
</TRPCProvider>
```

### Preventing Future Occurrences

1. **Remove unused `@orpc` packages** from `pnpm-workspace.yaml` catalog and all `package.json` files
2. **Use `createTRPCReact<AppRouter>()`** (not `any`) in new mobile screens where possible
3. **Add a lint rule** for JSX tag mismatch (React's JSX compiler already catches this, but the error appears only at build time)
4. **Use the `AppRouter` registry** in `packages/trpc/src/generated/index.ts` as the canonical reference for all available procedures

---

---

## 12. Known Issues & Current Resolutions

### Issue: `createTRPCReact<AppRouter>()` Fails with `AnyRouter` Constraint

**Symptom:**

```typescript
// ❌ TypeScript error:
// "Type 'AppRouter' does not satisfy the constraint 'AnyRouter'"
export const trpc = createTRPCReact<AppRouter>();
```

**Cause:**
tRPC v11's `createTRPCReact<TRouter extends AnyRouter>` requires the router type to satisfy
`AnyRouter` — a complex internal type that expects specific `_def._config.$types` and
`_def.record` shapes. Our manual AppRouter stubs in `packages/trpc/src/generated/index.ts`
are minimal procedure stubs and don't carry this internal metadata.

`AnyRouter` is NOT a public export from `@trpc/server` — it lives in
`@trpc/server/unstable-core-do-not-import`, making it a bad idea to import directly
(will break on tRPC version updates).

**Current Resolution (apps/web/lib/trpc.ts):**

```typescript
import type { AppRouter } from "@rocky/trpc";

/**
 * Uses `any` because the manual AppRouter stubs don't satisfy tRPC v11's AnyRouter.
 * Type safety at call sites comes from each procedure's `_def._input_in` / `_def._output_out`:
 *
 *   trpc.farm.getById.useQuery({ id })  →  typed as FarmResponse ✅
 *   trpc.farm.getByid.useQuery({ id })  →  runtime error (no compile catch) ⚠️
 */
export const trpc = createTRPCReact<any>() as any;
```

**What we lose with `any`:**

- No compile-time error on misspelled procedure names (`trpc.farm.getByid` vs `getById`)
- No autocomplete for procedure paths
- Must manually import response types from `@rocky/validators/api`

**What we keep with `any`:**

- Procedure-level input/output type safety (from `_def._input_in`/`_def._output_out`)
- Runtime validation via zod4 schemas on the server
- All hooks (`useQuery`, `useMutation`, `useSubscription`) work correctly

**Future resolution path:**
When tRPC stabilizes `AnyRouter` as a public export, update the stubs:

```typescript
// packages/trpc/src/generated/index.ts (future)
import type { AnyRouter } from "@trpc/server"; // when made public

export type AppRouter = AnyRouter & {
  health: { ping: { _def: { _input_in: void; _output_out: string } } };
  // ...
};
```

Then restore:

```typescript
// apps/web/lib/trpc.ts (future)
export const trpc = createTRPCReact<AppRouter>(); // ✅ full type safety
```

### Issue: `apps/web/lib/auth.ts` Imports Database Driver into Web Bundle

**Symptom:**
`apps/web/lib/auth.ts` imports `db, user, session, account, verification` from `@rocky/database`.
If this file is imported (directly or transitively) into a client component, `drizzle-orm`,
`pg`, and the full database driver will be bundled into the browser — causing
kilobytes of unnecessary code and potential build errors.

**Current Architecture (Correct):**

```
apps/web/lib/auth.ts        → SERVER ONLY (betterAuth instance, Drizzle adapter)
apps/web/lib/auth-client.ts → CLIENT SAFE (createAuthClient, no DB imports)
```

The server auth file is imported only from server components:

- `apps/web/app/dashboard/page.tsx` (Next.js Server Component)

The client auth file is used in layout/client components:

- `apps/web/app/layout.tsx`

**Current Resolution:**
Added `import "server-only"` guard at the top of `apps/web/lib/auth.ts`:

```typescript
// apps/web/lib/auth.ts
import "server-only"; // ← throws if imported from client component
import { betterAuth } from "better-auth";
import { db, user, session, account, verification } from "@rocky/database";
```

The `server-only` package (from the Next.js team, 0.9KB) throws a build-time error
if the file is accidentally imported from a `"use client"` component or any
client-side code path.

**Package added:** `server-only` in `apps/web/package.json`

**Rule:**
> Any file in `apps/web/` that imports from `@rocky/database`, `drizzle-orm`, or
> creates a `betterAuth()` instance with `drizzleAdapter` MUST include
> `import "server-only"` as its first import.

---

---

## 13. Docker Deployment — Direct API Architecture

### The Two Paths

When `apps/web` (Next.js) and `apps/api` (NestJS) run in separate Docker containers:

| Caller | URL | Network |
|--------|-----|---------|
| **Browser (client)** | `NEXT_PUBLIC_API_URL` → `http://localhost:8080` | Host → exposed port |
| **SSR (server)** | `API_URL` → `http://api:8080` | Docker internal network |

The API container exposes port 8080 to the host. The browser reaches it at
`localhost:8080` (or the server's public hostname). The Next.js server, running
inside Docker, reaches the API at its service name `api:8080`.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          DOCKER HOST                                  │
│                                                                       │
│  ┌──────────────────────────────┐   ┌──────────────────────────────┐ │
│  │ rocky-web (Next.js :3000)    │   │ rocky-api (NestJS :8080)      │ │
│  │                               │   │                               │ │
│  │  SSR: API_URL=http://api:8080─┼──→│  tRPC handlers at /trpc/*    │ │
│  │       (Docker network call)   │   │  Auth endpoints /api/auth/*  │ │
│  │                               │   │                               │ │
│  └──────────────────────────────┘   └──────────────────────────────┘ │
│           ▲                                      ▲                    │
│           │ localhost:3000               localhost:8080              │
└───────────┼──────────────────────────────────────┼───────────────────┘
            │                                      │
         ┌──┴──────────────────────────────────────┴──┐
         │              BROWSER                        │
         │  Page: localhost:3000                       │
         │  tRPC: localhost:8080/trpc/farm.list        │
         │  Auth: localhost:8080/api/auth/sign-in/email │
         │  Cookie: rocky_session (cross-origin!)       │
         └─────────────────────────────────────────────┘
```

### Cross-Origin Cookies

Since the browser sees the API on a different origin (`localhost:8080` vs `localhost:3000`),
cookies must be configured for cross-origin usage:

**`apps/api/src/auth/auth.ts` (better-auth config):**
```typescript
export const auth = betterAuth({
  // ...
  advanced: {
    crossSubdomainCookies: {
      enabled: true,
    },
    cookieOptions: {
      sameSite: "lax",  // "none" if using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
});
```

**`apps/web/lib/trpc.ts` (client):**
```typescript
// Every fetch includes credentials so cookies are sent cross-origin
fetch(url, options) {
  return fetch(url, { ...options, credentials: "include" });
}
```

**`apps/api/src/main.ts` (CORS):**
```typescript
app.enableCors({
  origin: appConfig.cors.origins,  // ["http://localhost:3000", ...]
  credentials: true,               // ← required for cookies
});
```

### Environment Variables

**`apps/web` (Next.js container):**

| Variable | Value | Used By |
|----------|-------|---------|
| `API_URL` | `http://api:8080` | SSR tRPC calls (Docker network) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Browser tRPC calls + auth redirects |
| `BETTER_AUTH_SECRET` | (secret) | Server-side session validation |

**`apps/api` (NestJS container):**

| Variable | Value | Used By |
|----------|-------|---------|
| `CORS_ORIGINS` | `http://localhost:3000,http://web:3000` | Allowed origins |
| `TRUSTED_ORIGINS` | `http://localhost:3000,mobile://` | better-auth trusted origins |
| `AUTH_BASE_URL` | `http://localhost:8080` | Auth base URL (browser-visible) |

### Why No Proxy?

The reference pattern you showed (Next.js with embedded `betterAuth` + Drizzle)
is **self-contained** — the Next.js app owns both auth and data. In that architecture:

- Auth routes live at `/api/auth/[...all]` inside Next.js
- Database is accessed directly from Next.js
- No separate API container needed

Our Rocky project uses a **three-tier architecture** where the API is a separate
service. The browser MUST reach the API directly because:

1. Next.js doesn't own the auth endpoints (`/api/auth/*` lives in the API)
2. Next.js doesn't own the database (Drizzle lives in the API)
3. The Next.js admin panel is a thin front-end that talks tRPC to the API

Adding a Next.js proxy that forwards `/trpc` to the API is **unnecessary complexity**
when the API port is already exposed:

```
# Terminal 1: API
docker compose up api       # → localhost:8080

# Terminal 2: Web
docker compose up web       # → localhost:3000

# Browser: loads page from 3000, API calls go to 8080 directly
```

### Local Development (no Docker)

```bash
# Terminal 1: NestJS API
cd apps/api && pnpm dev   # → http://localhost:8080

# Terminal 2: Next.js Admin
cd apps/web && pnpm dev   # → http://localhost:3000
```

No env vars needed locally — defaults to `http://localhost:8080` for both SSR and browser.

### Production (with reverse proxy)

For production, run both behind Nginx/Traefik/Caddy on the same domain:

```
https://admin.example.com/        → Next.js :3000
https://admin.example.com/api/*   → NestJS :8080
```

This eliminates cross-origin issues entirely. Cookies become same-origin,
CORS is unnecessary, and both services share a single domain.

---

## Appendix: Current Router Registry

| Router Alias   | File                                          | Procedures                                                                                                                                                                                                                         |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `animal`       | `apps/api/src/routers/animal.router.ts`       | `getById`, `findByTag`, `list`, `create`, `update`                                                                                                                                                                                 |
| `archive`      | `apps/api/src/routers/archive.router.ts`      | `getById`, `list`, `create`, `markArchived`, `markDestroyed`, `archiveInspectionForm`                                                                                                                                              |
| `correction`   | `apps/api/src/routers/correction.router.ts`   | `getById`, `list`, `create`, `review`, `resolve`, `escalate`, `reject`                                                                                                                                                             |
| `earTag`       | `apps/api/src/routers/eartag.router.ts`       | `getById`, `list`, `findByNumber`, `getType`, `listTypes`, `transitionStatus`, `createOrder`, `cancelOrder`, `cancelOrderItem`, `appendToOrder`                                                                                    |
| `farm`         | `apps/api/src/routers/farm.router.ts`         | `getById`, `getByFarmId`, `list`, `create`, `update`, `getAddress`                                                                                                                                                                 |
| `health`       | `apps/api/src/routers/health.router.ts`       | `getDisease`, `listDiseases`, `createDisease`, `getVaccine`, `listVaccines`, `createVaccine`, `createVaccineBatch`, `getVaccination`, `listVaccinations`, `recordVaccination`, `getTreatment`, `listTreatments`, `recordTreatment` |
| `inspection`   | `apps/api/src/routers/inspection.router.ts`   | (8+ procedures)                                                                                                                                                                                                                    |
| `movement`     | `apps/api/src/routers/movement.router.ts`     | (4+ procedures)                                                                                                                                                                                                                    |
| `notification` | `apps/api/src/routers/notification.router.ts` | `unreadCount`, `send`, `markAsRead`                                                                                                                                                                                                |
| `organization` | `apps/api/src/routers/organization.router.ts` | (4+ procedures)                                                                                                                                                                                                                    |
| `passport`     | `apps/api/src/routers/passport.router.ts`     | `getById`, `list`, `issue`, `shipToVs`, `deliverToKeeper`, `seize`, `reprint`                                                                                                                                                      |
| `rbac`         | `apps/api/src/routers/rbac.router.ts`         | (6+ procedures)                                                                                                                                                                                                                    |
| `subject`      | `apps/api/src/routers/subject.router.ts`      | (4+ procedures)                                                                                                                                                                                                                    |
| `user`         | `apps/api/src/routers/user.router.ts`         | `getById`, `list`, `create`, `update`                                                                                                                                                                                              |

> **Note:** The `AppRouter` stub in `packages/trpc/src/generated/index.ts` currently only has `health` and `todo` stubs. The domain routers listed above need to be added to the stub file for full frontend type safety. Add them incrementally as each frontend screen is implemented. For the Expo mobile app specifically, the current `createTRPCReact<any>()` bypass is due to tRPC v11 collision — migrating to `createTRPCReact<AppRouter>()` will give full autocomplete once the stub is populated.

---

*[sniff]* And so on and so on...
