# API Build Errors - Fixed

## ✅ Issues Fixed

### 1. Subscription Router Type Error

**Problem:** `TrackedEnvelope` type mismatch in `movement-subscription.router.ts:65`

```typescript
// ❌ BEFORE - Incorrect return type annotation
async *onMovementUpdate(): AsyncGenerator<MovementNotification> {
  yield tracked(notification.id, notification);
}
```

**Solution:** Removed explicit return type to let TypeScript infer the correct tracked type

```typescript
// ✅ AFTER - TypeScript infers correct type
async *onMovementUpdate() {
  const notif = notification as MovementNotification;
  yield tracked(notif.id, notif);
}
```

**File Fixed:**
- `apps/api/src/movement/movement-subscription.router.ts`

### 2. Middleware Import Errors

**Problem:** Wrong type name imported from nestjs-trpc-v2

```typescript
// ❌ BEFORE - TRPCMiddlewareOptions doesn't exist
import { TRPCMiddleware, TRPCMiddlewareOptions } from "nestjs-trpc-v2";
async use(opts: TRPCMiddlewareOptions) { ... }
```

**Solution:** Use correct MiddlewareOptions type

```typescript
// ✅ AFTER - Correct type name
import { TRPCMiddleware, MiddlewareOptions } from "nestjs-trpc-v2";
async use(opts: MiddlewareOptions) { ... }
```

**Files Fixed:**
- `apps/api/src/trpc/middlewares/protected.middleware.ts`
- `apps/api/src/trpc/middlewares/rls.middleware.ts`
- `apps/api/src/trpc/middlewares/logging.middleware.ts`

### 3. Context Import Path Errors

**Problem:** Wrong relative path for AppContext import

```typescript
// ❌ BEFORE - Path doesn't exist
import type { AppContext } from "../../../context";
```

**Solution:** Import from workspace package

```typescript
// ✅ AFTER - Correct workspace import
import type { AppContext } from "@rocky/trpc/context.js";
```

**Files Fixed:**
- `apps/api/src/trpc/middlewares/protected.middleware.ts`
- `apps/api/src/trpc/middlewares/rls.middleware.ts`
- `apps/api/src/trpc/middlewares/logging.middleware.ts`

## 🔧 Type System Notes

### nestjs-trpc-v2 Middleware Types

The correct types for middleware are:

```typescript
import { TRPCMiddleware, MiddlewareOptions } from "nestjs-trpc-v2";

@Injectable()
export class MyMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions) {
    const { ctx, next, path, type } = opts;
    return next();
  }
}
```

### Context Types

**AppContext** is exported from `@rocky/trpc/context.js`:

```typescript
import type { AppContext } from "@rocky/trpc/context.js";

interface AppContext {
  headers: Headers;
  user: User | null;
  session: Session | null;
  [key: string]: unknown;
}
```

**Extended Context Types:**

- **ProtectedMiddlewareContext** - Adds `auth` property
- **RLSMiddlewareContext** - Adds `rls` property

## 📊 Build Results

### Before
```
❌ 7 TypeScript errors
❌ Type 'TrackedEnvelope<...>' is not assignable
❌ 'TRPCMiddlewareOptions' does not exist
❌ Cannot find module '../../../context'
❌ Build failed
```

### After
```
✓ Compiled successfully
✓ All type errors resolved
✓ API build successful
✓ Full monorepo build successful
```

## 🚀 Verified Working

**Middleware Stack:**
- ✅ ProtectedMiddleware - Authentication checks
- ✅ RLSMiddleware - Row Level Security
- ✅ LoggingMiddleware - Request timing

**Subscription:**
- ✅ MovementSubscriptionRouter - Real-time updates

**Routers Using Middlewares:**
- ✅ TodoRouter - Uses ProtectedMiddleware
- ✅ NotificationRouter - Uses ProtectedMiddleware

## 🎯 Key Takeaways

1. **Use correct nestjs-trpc-v2 types:**
   - ❌ `TRPCMiddlewareOptions`
   - ✅ `MiddlewareOptions`

2. **Import from workspace packages:**
   - ❌ Relative paths: `../../../context`
   - ✅ Workspace imports: `@rocky/trpc/context.js`

3. **Let TypeScript infer generator types:**
   - ❌ Explicit: `AsyncGenerator<MovementNotification>`
   - ✅ Implicit: Let TypeScript infer from `yield tracked()`

4. **Type casting in middlewares:**
   ```typescript
   // Safe pattern for context typing
   async use(opts: MiddlewareOptions) {
     const { ctx, next } = opts as { ctx: AppContext; next: Function };
   }
   ```

## 📝 Verification

Build commands now succeed:

```bash
# Build API only
pnpm --filter @rocky/api build
# ✅ SUCCESS

# Build full monorepo
pnpm build
# ✅ SUCCESS
```

All API build errors are now resolved! 🎉
