# syntax=docker/dockerfile:1.7
# Docs (Nextra) — multi-stage, mirror apps/web. Docs does not use NEXT_PUBLIC_API_URL.
# glibc base required: Next.js uses @parcel/watcher, which ships no musl
# prebuilds, so Alpine breaks the build. Keep node:24-slim (glibc).
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
# drop devDependencies from node_modules
RUN CI=true pnpm install --prod --frozen-lockfile

# ---- runtime (prod deps only, non-root)
FROM node:24.14.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/apps/docs ./apps/docs
COPY --from=build /app/apps/docs/.next ./apps/docs/.next
COPY --from=build /app/apps/docs/public ./apps/docs/public
RUN addgroup --system nodejs && adduser --system --ingroup nodejs appuser && chown -R appuser:nodejs /app
USER appuser
WORKDIR /app/apps/docs
EXPOSE 3002
CMD ["npx", "next", "start", "--port", "3002"]
