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
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install -r --filter docs... --frozen-lockfile

# ---- build
FROM deps AS build
COPY apps/docs ./apps/docs
RUN pnpm -r --filter docs... build
# drop devDependencies from node_modules
RUN pnpm -r prune --prod

# ---- runtime (prod deps only, non-root)
FROM node:24.14.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/apps/docs ./apps/docs
COPY --from=build /app/apps/docs/.next ./apps/docs/.next
COPY --from=build /app/apps/docs/public ./apps/docs/public
RUN addgroup -S nodejs && adduser -S appuser -G nodejs && chown -R appuser:nodejs /app
USER appuser
WORKDIR /app/apps/docs
EXPOSE 3002
CMD ["npx", "next", "start", "--port", "3002"]
