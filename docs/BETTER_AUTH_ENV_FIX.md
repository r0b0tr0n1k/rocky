# Better Auth Environment Configuration — Historical Reference

> ⚠️ **This document records an early fix from 2026-07-03. The architecture has since evolved.**
> Current architecture: `apps/api` delegates to `@rocky/auth`'s `Auth.getInstance()` singleton.
> `apps/web` has **no server-side Better Auth instance** — it uses `createRockyAuthClient()` from `@rocky/auth/client`.

## Historical Context

The issues documented below (missing `BETTER_AUTH_SECRET`, missing `API_URL`) were fixed in the initial setup. They are kept here as reference for anyone setting up a new environment.

## ✅ Issues Fixed

### 1. Better Auth Default Secret Warning

**Problem:** Better Auth was throwing an error because no secret was configured:

```
[Error [BetterAuthError]: You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.]
```

**Current Architecture:** The API uses `Auth.getInstance()` from `@rocky/auth`, which validates `BETTER_AUTH_SECRET` at construction time. The web app has no server-side Better Auth instance.

### 2. Missing API_URL Environment Variable

**Problem:** Web app build failed because `API_URL` was not set.

**Current State:** `apps/web/.env` contains `API_URL=http://localhost:8080`. The tRPC client in `apps/web/lib/trpc.ts` falls back to `http://localhost:8080` if `API_URL` is not set.

## 📁 Files

| File                    | Status                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `apps/api/.env`         | ✅ Exists (600 permissions) — contains `BETTER_AUTH_SECRET`, DB config                                       |
| `apps/web/.env`         | ✅ Exists (600 permissions) — contains `API_URL`, `BETTER_AUTH_SECRET` (historical — unused by current code) |
| `apps/api/.env.example` | ✅ Exists (644 permissions) — template for new environments                                                  |
| `apps/web/.env.example` | ✅ Exists — template for new environments                                                                    |

## 🔧 Current Architecture

### API Auth Configuration (`apps/api/src/auth/auth.ts`)

**Delegates to `@rocky/auth`'s singleton — does NOT call `betterAuth()` directly:**

```typescript
import { Auth, type AuthConfig } from "@rocky/auth";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set");
}

export const authConfig: AuthConfig = {
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.BASE_SERVICE_URL ?? "http://localhost:8080",
  secret,
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",") ?? ["http://localhost:4000", "mobile://"],
};

// Auth.getInstance() is idempotent — same config returns same instance
export const auth = Auth.getInstance(authConfig);
```

### Web App Auth Client (`apps/web/lib/auth-client.ts`)

**No server-side Better Auth instance. Pure client-side proxy:**

```typescript
import { createRockyAuthClient } from "@rocky/auth/client";

export const authClient = createRockyAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
```

### Shared Auth Client Factory (`packages/auth/src/client.ts`)

Both web and mobile consume `createRockyAuthClient()` from `@rocky/auth/client`.

### Why `apps/web/.env` Still Has `BETTER_AUTH_SECRET`

This is a **historical artifact** from the initial fix. The web app no longer initializes its own Better Auth instance, so the secret in `apps/web/.env` is **unused** by the current codebase. It can be removed when the `.env` is next updated.

### Key Changes Since This Doc Was Written

| Change                             | Old (doc)                                | Current                                           |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `apps/api` auth                    | Direct `betterAuth({...})` call          | `Auth.getInstance()` from `@rocky/auth`           |
| `apps/web` auth                    | Server-side `betterAuth({...})` instance | Client-side `createRockyAuthClient()` only        |
| `@thallesp/nestjs-better-auth`     | Used for session middleware              | **Removed** — zero references in code             |
| web server-side session validation | Own better-auth instance                 | Proxied to API via Next.js rewrite                |
| "rocky-dev-secret" in `.env`       | Dev placeholder                          | `apps/api/.env` has a generated secret            |
| `apps/web/lib/auth.ts`             | Existed with server auth                 | **Does not exist** — replaced by `auth-client.ts` |
