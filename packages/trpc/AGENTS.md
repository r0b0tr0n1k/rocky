# tRPC Transport Package

**Scope:** `packages/trpc/` — AppRouter types, AppContext, superjson, result unwrapper
**Source spec:** `docs/AUTH_ARCHITECTURE.md` §Canonical Context, §Refinement 9: Transport Adapters
**Last verified:** 2026-07-05 — 14 routers, 93 procedures generated

## Overview

Transport-layer package. Owns the shared tRPC types consumed by both server (apps/api) and clients (apps/web, apps/mob). The `AppRouter` type is generated from NestJS routers and provides full type safety to frontends.

## Key Files

| File                    | Purpose                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `context.ts`            | `AppContext` — server-side context type. `execution?: ExecutionContext` is the canonical actor. `user`/`session` are deprecated.    |
| `generated/server.ts`   | AUTO-GENERATED. Run `npx nestjs-trpc generate` in `apps/api` to regenerate. Contains `appRouter` runtime object + `AppRouter` type. |
| `generated/index.ts`    | Re-exports `AppRouter` type from server.ts                                                                                          |
| `index.ts`              | Public API: exports `AppRouter`, `AppContext`, helper functions                                                                     |
| `superjson.ts`          | SuperJSON transformer config for tRPC                                                                                               |
| `unwrap.ts`             | `createResultUnwrapper()` — maps Neverthrow Results to tRPC output                                                                  |
| `middleware/withRls.ts` | RLS context injection helper (legacy, replaced by ExecutionPipeline)                                                                |

## Frontend Consumption

```typescript
// Web (apps/web/lib/trpc.ts)
import { createTRPCReact } from "@trpc/react-query";
export const trpc = createTRPCReact<AppRouter>();

// Mobile (apps/mob/src/providers/trpc-provider.tsx)
export const trpc = createTRPCReact<AppRouter>();
```

## Type Safety Chain

```txt
NestJS routers (apps/api/src/routers/)
  → nestjs-trpc generate
  → packages/trpc/src/generated/server.ts  (AppRouter = typeof appRouter)
  → packages/trpc/src/index.ts              (re-exports AppRouter)
  → apps/web/lib/trpc.ts                    (createTRPCReact<AppRouter>())
  → apps/mob/src/providers/trpc-provider.tsx (createTRPCReact<AppRouter>())
```

## Regeneration

When routers change, regenerate types:

```bash
cd apps/api
npx nestjs-trpc generate --entrypoint src/app.module.ts --output ../../packages/trpc/src/generated
```

## Critical Constraints

1. **NEVER edit `generated/server.ts` manually.** It is auto-generated. Changes are overwritten on the next `generate`.
2. **`AppContext` changes must be synced** between `packages/trpc/src/context.ts` and `apps/api/src/app.context.ts`.
3. **`createResultUnwrapper`** is the standard way to convert Neverthrow Results to tRPC output. Every router method: `return result.unwrap()`.
