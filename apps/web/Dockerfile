# ── Next.js Admin Panel Dockerfile ──
#
# NEXT_PUBLIC_* variables are inlined at BUILD time by Next.js.
# Pass the API URL as a build arg:
#
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
#     -t rocky-web .
#
#   docker run -e API_URL=http://api:8080 -p 3000:3000 rocky-web

# glibc base required: Next.js uses @parcel/watcher, which ships no musl
# prebuilds, so Alpine breaks the build. Keep node:24-slim (glibc).
FROM node:slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Install the exact pnpm version pinned in package.json's "packageManager" field.
# Uses npm (always present) instead of corepack, which is absent from
# node:24-slim / alpine images.
RUN PNPM_VER=$(node -p "require('./package.json').packageManager.replace('pnpm@','').split('+')[0]" 2>/dev/null || echo 11.13.0) \
    && for i in 1 2 3 4 5; do npm install -g "pnpm@${PNPM_VER}" && break || sleep 5; done
COPY packages ./packages
COPY apps ./apps
RUN printf 'fetch-timeout=1200000\nstore-dir=/pnpm/store\nfetch-retries=10\nfetch-retry-mintimeout=10000\nfetch-retry-maxtimeout=120000\nnetwork-concurrency=4\n' >> .npmrc
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || sleep 15; done

# ---- build
FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY apps/web ./apps/web
RUN pnpm -r --filter web... build
# pnpm deploy: standalone deployment with only web's production deps
# (no stale .pnpm store, no recharts/maplibre/expo/nestjs bloat)
RUN pnpm deploy --filter=web --prod --legacy /deploy
# pnpm deploy EXCLUDES gitignored build output (.next). Copy the production
# build + static assets explicitly so `next start` finds them at runtime.
RUN rm -rf /deploy/.next && cp -r apps/web/.next /deploy/.next
RUN rm -rf /deploy/public && cp -r apps/web/public /deploy/public 2>/dev/null || true

# ---- runtime (prod deps only, non-root)
FROM node:slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy ./
RUN addgroup --system nodejs && adduser --system --ingroup nodejs appuser && chown -R appuser:nodejs /app
USER appuser
EXPOSE 3000
CMD ["npx", "next", "start"]
