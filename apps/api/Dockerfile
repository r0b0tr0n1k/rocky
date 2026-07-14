FROM node:24-alpine AS deps
# glibc NOT required: the API is NestJS (pure JS). @rocky/pdf renders via the
# typst.ts WASM compiler (libc-agnostic), so Alpine/musl is fine here — unlike
# the Next.js web/docs images, which need glibc for @parcel/watcher prebuilds.
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Install the exact pnpm version pinned in package.json's "packageManager" field.
# Uses npm (always present) instead of corepack, which is absent from
# node:24-slim / alpine images.
RUN PNPM_VER=$(node -p "require('./package.json').packageManager.replace('pnpm@','').split('+')[0]" 2>/dev/null || echo 11.13.0) \
    && for i in 1 2 3 4 5; do npm install -g "pnpm@${PNPM_VER}" && break || sleep 5; done
COPY packages ./packages
COPY apps ./apps
# Harden pnpm for flaky/slow registries: long per-request timeout, many
# retries, low concurrency (fewer simultaneous slow sockets = fewer drops).
RUN printf 'fetch-timeout=1200000\nstore-dir=/pnpm/store\nfetch-retries=10\nfetch-retry-mintimeout=10000\nfetch-retry-maxtimeout=120000\nnetwork-concurrency=4\n' >> .npmrc
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || sleep 15; done

# ---- build
FROM deps AS build
COPY apps/api ./apps/api
RUN pnpm -r --filter @rocky/api... build
# pnpm deploy: standalone deployment with only @rocky/api's production deps
# (no stale .pnpm store, no workspace package bloat, no symlinks)
RUN pnpm deploy --filter=@rocky/api --prod --legacy /deploy
# The NestJS SWC build emits CommonJS (dist/main.js uses `exports`), but the api
# package.json declares "type": "module". Without this override Node treats
# dist/main.js as ESM and crashes with "exports is not defined". Pin the compiled
# output folder to CommonJS so the entry runs as CJS.
RUN printf '{"type":"commonjs"}\n' > /deploy/dist/package.json

# ---- runtime (Alpine, prod deps only, non-root)
FROM node:24-alpine AS runtime
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy ./
# run as non-root
RUN addgroup -S nodejs && adduser -S appuser -G nodejs && chown -R appuser:nodejs /app
USER appuser
CMD ["node", "dist/main"]
