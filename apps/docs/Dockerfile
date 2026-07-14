# syntax=docker/dockerfile:1.7
# Docs (Nextra) — minimal image. Theme tokens inlined (no @rocky/ui dep).
# glibc base required: Next.js uses @parcel/watcher (no musl prebuilds).
FROM node:24.14.0-slim AS deps
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts
RUN printf 'fetch-timeout=1200000\nstore-dir=/pnpm/store\nfetch-retries=10\nfetch-retry-mintimeout=10000\nfetch-retry-maxtimeout=120000\nnetwork-concurrency=4\n' >> .npmrc
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || sleep 15; done

# ---- build
FROM deps AS build
COPY apps/docs ./apps/docs
RUN pnpm -r --filter docs... build
# pnpm deploy with --legacy pulls workspace-wide prod deps; prune the bloat
RUN pnpm deploy --filter=docs --prod --legacy /deploy
RUN rm -rf /deploy/node_modules/.pnpm/@biomejs* \
           /deploy/node_modules/.pnpm/expo-* \
           /deploy/node_modules/.pnpm/hermes-* \
           /deploy/node_modules/.pnpm/react-native* \
           /deploy/node_modules/.pnpm/@react-native* \
           /deploy/node_modules/.pnpm/drizzle-orm* \
           /deploy/node_modules/.pnpm/@nestjs* \
           /deploy/node_modules/.pnpm/maplibre* \
           /deploy/node_modules/.pnpm/better-auth* \
           /deploy/node_modules/.pnpm/@better-auth* \
           /deploy/node_modules/.pnpm/@trpc* \
           /deploy/node_modules/.pnpm/mermaid* \
           /deploy/node_modules/.pnpm/@mermaid* \
           /deploy/node_modules/.pnpm/mathjax* \
           /deploy/node_modules/.pnpm/react-aria* \
           /deploy/node_modules/.pnpm/esbuild* \
           /deploy/node_modules/.pnpm/@esbuild* \
           /deploy/node_modules/.pnpm/sharp* \
           /deploy/node_modules/.pnpm/@img* \
           /deploy/node_modules/.pnpm/@swc* \
           /deploy/node_modules/.pnpm/@babel* \
    && rm -rf /deploy/node_modules/@biomejs \
              /deploy/node_modules/expo \
              /deploy/node_modules/react-native \
              /deploy/node_modules/drizzle-orm \
              /deploy/node_modules/maplibre-gl

# ---- runtime (prod deps only, non-root)
FROM node:24.14.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy ./
RUN addgroup --system nodejs && adduser --system --ingroup nodejs appuser && chown -R appuser:nodejs /app
USER appuser
EXPOSE 3002
CMD ["npx", "next", "start", "--port", "3002"]
