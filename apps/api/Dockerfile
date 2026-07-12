FROM node:24-alpine AS deps
# glibc NOT required: the API is NestJS (pure JS). @rocky/pdf renders via the
# typst.ts WASM compiler (libc-agnostic), so Alpine/musl is fine here — unlike
# the Next.js web/docs images, which need glibc for @parcel/watcher prebuilds.
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# all workspace manifests so pnpm can resolve the full graph
COPY packages ./packages
COPY apps ./apps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install -r --filter @rocky/api... --frozen-lockfile

# ---- build
FROM deps AS build
COPY apps/api ./apps/api
RUN pnpm -r --filter @rocky/api... build
# drop devDependencies from node_modules (drizzle-kit, tsx, typescript, vitest, @nestjs/cli, ...)
RUN pnpm -r prune --prod

# ---- runtime (Alpine, prod deps only, non-root)
FROM node:24-alpine AS runtime
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api
# run as non-root
RUN addgroup -S nodejs && adduser -S appuser -G nodejs && chown -R appuser:nodejs /app
USER appuser
WORKDIR /app/apps/api
CMD ["node", "dist/main"]
