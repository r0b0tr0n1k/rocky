# API Bot — NestJS + tRPC

Owns the NestJS backend, tRPC routers, service layer, and the `nestjs-trpc-v2` generator.

## Key Files

| File | Role |
|------|------|
| `src/main.ts` | NestJS bootstrap with CORS |
| `src/app.module.ts` | Root module (AuthCoreModule + TrpcModule) |
| `src/app.context.ts` | tRPC context (user, session, headers) |
| `src/trpc/trpc.module.ts` | `nestjs-trpc-v2` config |
| `src/auth/auth.ts` | better-auth instance |
| `src/auth/auth-core.module.ts` | `AUTH_INSTANCE` provider |
| `src/@generated/server.ts` | Auto-generated tRPC router |

## Router Pattern

```typescript
import { Router, Query, Mutation } from "nestjs-trpc-v2";

@Router()
export class FarmsRouter {
  @Query({ input: z.string(), output: farmResponseSchema })
  async getById(id: string) {
    return this.farmsService.findById(id);
  }
}
```

## Rules

- Every `@Query`/`@Mutation` uses Zod schemas from `@prasici/validators`
- Never edit `@generated/server.ts` directly
- Restart dev server to regenerate `@generated/server.ts`
- Commit `@generated/server.ts` alongside router changes
- Services use `@prasici/database` Drizzle instance
