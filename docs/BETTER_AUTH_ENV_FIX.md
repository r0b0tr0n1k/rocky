# Better Auth Environment Configuration - Fixed

## ✅ Issues Fixed

### 1. Better Auth Default Secret Warning

**Problem:** Better Auth was throwing an error because no secret was configured:

```
[Error [BetterAuthError]: You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.]
```

**Root Cause:** Both the API (NestJS) and the web app (Next.js) had Better Auth instances configured without the required `secret` parameter.

**Solution:**
1. Added secret validation in `apps/api/src/auth/auth.ts`
2. Added secret validation in `apps/web/lib/auth.ts`
3. Created `.env` files with `BETTER_AUTH_SECRET` for both apps

### 2. Missing API_URL Environment Variable

**Problem:** Web app build failed because `API_URL` was not set:

```
Error: API_URL required for SSR
```

**Root Cause:** The tRPC client configuration requires `API_URL` for server-side rendering, but no environment variable was set.

**Solution:** Created `.env` file with `API_URL=http://localhost:8080` for the web app.

## 📁 Files Created

### API Environment Files
- `apps/api/.env` - Production environment variables
- `apps/api/.env.example` - Template with documentation

### Web App Environment Files
- `apps/web/.env` - Production environment variables
- `apps/web/.env.example` - Template with documentation

## 🔧 Files Modified

### API Auth Configuration
**File:** `apps/api/src/auth/auth.ts`

```typescript
// Added secret validation and configuration
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set");
}

this.instance = betterAuth({
  baseURL: appConfig.auth.baseUrl,
  secret,  // ← Added this line
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  // ... rest of config
});
```

### Web App Auth Configuration
**File:** `apps/web/lib/auth.ts`

```typescript
// Added secret validation and configuration
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set");
}

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  secret,  // ← Added this line
  plugins: [nextCookies()],
});
```

### Environment Variables Updated

**API (.env):**
```bash
ENVIRONMENT=dev
VERSION=1.0.0
REQUEST_LOGGING=false
BETTER_AUTH_SECRET=rocky-dev-secret-key-32chars-long-change-me
PG_HOST=localhost
PG_USER=postgres
PG_PASS=postgres
PG_DB=postgres
```

**Web App (.env):**
```bash
API_URL=http://localhost:8080
BETTER_AUTH_SECRET=rocky-dev-secret-key-32chars-long-change-me
```

## 📊 Build Results

### Before
```
❌ [Error [BetterAuthError]: You are using the default secret...]
❌ Error: API_URL required for SSR
❌ Build failed
```

### After
```
✓ Compiled successfully in 2.1s
✓ Generating static pages using 5 workers (4/4) in 330ms
✓ BUILD SUCCESS
```

## 🎯 Key Takeaways

### Better Auth Architecture

The Rocky monorepo uses a **centralized auth architecture**:

1. **API (NestJS):** Main Better Auth instance with full configuration
2. **Web App (Next.js):** Better Auth client that connects to API endpoints
3. **Shared Secret:** Both apps must use the same `BETTER_AUTH_SECRET` for cookie/token verification

### Why Both Apps Need the Secret

Even though auth is centralized in the API, the Next.js app still needs the secret because:
1. It verifies session cookies on the server side
2. It signs/encrypts cookies for the client
3. It validates tokens from the API

### Environment Variable Strategy

- **Development:** Use `.env` files in each app directory
- **Production:** Use environment variables in deployment platform
- **Secret Security:** Generate unique secrets for each environment (32+ characters)

## 🔄 How to Generate Secrets

For production deployments, generate secure random secrets:

```bash
# Using openssl
openssl rand -base64 32

# Using node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 🚀 Verification

Build now succeeds for both apps:

```bash
# API build
cd apps/api && pnpm build
# ✅ BUILD SUCCESS

# Web app build
cd apps/web && pnpm build
# ✅ BUILD SUCCESS
```

All builds are now passing! 🎉

## 📝 Next Steps

### For Production Deployment

1. **Generate unique secrets** for each environment (dev, staging, production)
2. **Set environment variables** in your deployment platform (Vercel, AWS, etc.)
3. **Update .env files** with production values (don't commit secrets to git)
4. **Add .env to .gitignore** (should already be there)

### For Development

1. **Copy .env.example to .env** in each app directory
2. **Update values** as needed for your local setup
3. **Never commit .env files** to version control
