# Rocky Monorepo Improvements

This document summarizes the architectural improvements made to the Rocky AIMCS monorepo based on the repomix.xml template patterns.

## ✅ Completed Improvements

### 1. Middleware Pattern Implementation

**Created:** `apps/api/src/trpc/middlewares/`

#### ProtectedMiddleware (`protected.middleware.ts`)

- **Purpose:** Reusable authentication check for all procedures
- **Features:**
  - Validates user is authenticated
  - Extends context with `ctx.auth` containing `userId`, `role`, and `permissions`
  - Throws `UNAUTHORIZED` if no session

**Before:**

```typescript
@Query({ output: TodoSchema })
async getTodo(@Ctx() ctx: AppContext) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return this.service.findById(ctx.user.id);
}
```

**After:**

```typescript
@Router({ alias: "todo" })
@UseMiddlewares(ProtectedMiddleware) // Applied once at router level
export class TodoRouter {
  @Query({ output: TodoSchema })
  async getTodo(@Ctx() ctx: ProtectedMiddlewareContext) {
    // ctx.auth.userId guaranteed to exist
    return this.service.findById(ctx.auth.userId);
  }
}
```

#### RLSMiddleware (`rls.middleware.ts`)

- **Purpose:** Enforces Row Level Security based on user roles
- **Features:**
  - Role-based access control (VD_ADMIN, VU_STAFF, FARMER, SYSTEM_ADMIN)
  - Adds `ctx.rls` with `organizationId`, `districtId`, and `accessLevel`
  - Supports district-level, organization-level, and own-data access

**Usage:**

```typescript
@Router({ alias: "animal" })
@UseMiddlewares(RLSMiddleware)
export class AnimalRouter {
  @Query({ output: AnimalListSchema })
  async getAnimals(@Ctx() ctx: RLSMiddlewareContext) {
    // ctx.rls.organizationId automatically filters results
    return this.animalService.findByOrganization(ctx.rls.organizationId);
  }
}
```

**Access Levels:**

- `VD_ADMIN`: District-level access (all farms in their district)
- `VU_STAFF`: Organization-level access (assigned farms)
- `FARMER`: Own data only
- `SYSTEM_ADMIN`: Full access (RLS bypassed)

#### LoggingMiddleware (`logging.middleware.ts`)

- **Purpose:** Request timing and error logging
- **Features:**
  - Logs all tRPC requests with timing information
  - Tracks OK vs error responses
  - Ready for integration with pino logger

**Usage:**

```typescript
@Router({ alias: "farm" })
@UseMiddlewares(LoggingMiddleware) // Logs all procedures
export class FarmRouter {
  // All queries/mutations automatically logged
}
```

### 2. Router Refactoring

**Updated Routers:**

- `apps/api/src/todo/todo.router.ts` - Now uses `ProtectedMiddleware`
- `apps/api/src/notification/notification.router.ts` - Now uses `ProtectedMiddleware`

**Benefits:**

- ✅ Eliminated manual `if (!ctx.user)` checks
- ✅ Type-safe context with `ProtectedMiddlewareContext`
- ✅ DRY principle - auth logic defined once
- ✅ Easier to test - mock middleware instead of auth logic

### 3. Subscription Support

**Created:** `apps/api/src/movement/movement-subscription.router.ts`

**Features:**

- Real-time movement updates via WebSocket
- Event types: `VERIFIED`, `REJECTED`, `COMPLETED`, `CANCELLED`
- Automatic reconnection with `tracked()` events
- User-specific filtering (farmers see their movements)

**Backend Usage:**

```typescript
@Injectable()
export class MovementService {
  @Inject(MovementSubscriptionRouter)
  private readonly movementSub: MovementSubscriptionRouter;

  async verifyMovement(movementId: string) {
    // ... verification logic ...

    // Notify farmer in real-time
    this.movementSub.emitMovementVerified({
      movementId,
      farmerId: movement.farmerId,
    });
  }
}
```

**Frontend Usage:**

```typescript
// Farmer gets live updates when VD officer verifies movement
trpc.movement.onMovementUpdate.useSubscription(
  { lastEventId: null },
  {
    onData: (notification) => {
      toast.success(notification.data.message);
    },
  },
);
```

### 4. Module Registration

**Updated:** `apps/api/src/trpc/trpc.module.ts`

All middlewares now registered as NestJS providers:

```typescript
@Module({
  imports: [TRPCModule.forRoot({...})],
  providers: [
    AppContextProvider,
    ProtectedMiddleware,
    RLSMiddleware,
    LoggingMiddleware,
  ],
  exports: [TRPCModule, ProtectedMiddleware, RLSMiddleware, LoggingMiddleware],
})
export class TrpcModule {}
```

### 5. Auth Architecture Verification

**Status:** ✅ Already centralized correctly

- **API (`apps/api/src/auth/auth.ts`):** Full better-auth instance with database adapter
- **Web (`apps/web/lib/auth-client.ts`):** React client pointing to API
- **No duplicate handlers:** Next.js doesn't mount `/api/auth/*` routes

Session flow:

1. User signs in via `authClient.signIn()` on web
2. Request goes to API at `NEXT_PUBLIC_API_URL`
3. API validates credentials and sets session cookie
4. Cookie flows back to web via `credentials: "include"`
5. All tRPC requests include session cookie automatically
6. `AppContextProvider` reads session and adds to `ctx.user`

## 📋 Usage Guidelines

### Creating a New Router

```typescript
import { Injectable, Inject } from "@nestjs/common";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { MyService } from "@rocky/domains-mydomain";

@Router({ alias: "mydomain" })
@UseMiddlewares(ProtectedMiddleware) // Apply to all procedures
@Injectable()
export class MyDomainRouter {
  constructor(@Inject(MyService) private readonly service: MyService) {}

  @Query({ output: MySchema })
  async getMyData(@Ctx() ctx: ProtectedMiddlewareContext) {
    // ctx.auth.userId is available
    return this.service.findByUserId(ctx.auth.userId);
  }

  @Mutation({ input: MyInputSchema, output: MySchema })
  async createMyData(@Input() input: MyInput) {
    return this.service.create(input);
  }
}
```

### Adding RLS to Existing Router

```typescript
import { RLSMiddleware, type RLSMiddlewareContext } from "../trpc/middlewares/rls.middleware.js";

@Router({ alias: "animal" })
@UseMiddlewares(RLSMiddleware) // Replaces ProtectedMiddleware for RLS
@Injectable()
export class AnimalRouter {
  @Query({ output: AnimalListSchema })
  async getAnimals(@Ctx() ctx: RLSMiddlewareContext) {
    // ctx.rls.organizationId, ctx.rls.districtId available
    return this.animalService.findByOrganization(ctx.rls.organizationId);
  }
}
```

### Procedure-Level Middleware

Apply middleware to individual procedures instead of entire router:

```typescript
@Router({ alias: "admin" })
@Injectable()
export class AdminRouter {
  @Query({ output: AdminStatsSchema })
  @UseMiddlewares(ProtectedMiddleware) // Only this procedure requires auth
  async getStats(@Ctx() ctx: ProtectedMiddlewareContext) {
    return this.adminService.getStats();
  }

  @Query({ output: PublicInfoSchema })
  // No middleware - public endpoint
  async getPublicInfo() {
    return this.adminService.getPublicInfo();
  }
}
```

### Middleware Composition

Stack multiple middlewares:

```typescript
@Router({ alias: "movement" })
@UseMiddlewares(LoggingMiddleware, ProtectedMiddleware, RLSMiddleware)
@Injectable()
export class MovementRouter {
  // Execution order: Logging → Protected → RLS → Procedure
}
```

## 🎯 Best Practices

1. **Use router-level middleware** when all procedures need same checks
2. **Use procedure-level middleware** for mixed auth/public endpoints
3. **Prefer RLSMiddleware** over ProtectedMiddleware for domain routers (farms, animals, movements)
4. **Add LoggingMiddleware** to all routers for observability
5. **Type context correctly** - use `ProtectedMiddlewareContext` or `RLSMiddlewareContext` in `@Ctx()` params

## 🔄 Migration Checklist

For existing routers:

- [ ] Import `UseMiddlewares` decorator
- [ ] Add `@UseMiddlewares(ProtectedMiddleware)` to router class
- [ ] Change `@Ctx() ctx: AppContext` to `@Ctx() ctx: ProtectedMiddlewareContext`
- [ ] Replace `ctx.user.id` with `ctx.auth.userId`
- [ ] Replace `ctx.user.role` with `ctx.auth.role`
- [ ] Remove all `if (!ctx.user)` checks
- [ ] Test procedures still work correctly

## 📚 Additional Resources

- nestjs-trpc docs: <https://nestjs-trpc.io>
- better-auth docs: <https://www.better-auth.com/docs>
- tRPC subscriptions: <https://trpc.io/docs/subscriptions>

## 🚀 Next Steps

Potential future improvements:

1. **Create RoleMiddleware** for role-based authorization (e.g., `@UseMiddlewares(RoleMiddleware("VD_ADMIN"))`)
2. **Add ValidationMiddleware** for Zod schema validation before procedures
3. **Implement CacheMiddleware** for query caching with Redis
4. **Add RateLimitMiddleware** for API rate limiting
5. **Create AuditMiddleware** for logging all mutations to audit table
6. **Implement PaginationMiddleware** for automatic query pagination
7. **Add TransactionMiddleware** for automatic database transaction management
