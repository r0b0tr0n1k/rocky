# syntax=docker/dockerfile:1.7

# ---- deps (manifests only → cache survives source edits)
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps ./apps

# Install pinned pnpm (npm is always present on node images)
RUN PNPM_VER=$(node -p "require('./package.json').packageManager.replace('pnpm@','').split('+')[0]" 2>/dev/null || echo 11.13.1) \
    && npm install -g "pnpm@${PNPM_VER}"

# Harden for flaky registries
RUN printf '%s\n' \
      'fetch-timeout=1200000' \
      'store-dir=/pnpm/store' \
      'fetch-retries=10' \
      'fetch-retry-mintimeout=10000' \
      'fetch-retry-maxtimeout=120000' \
      'network-concurrency=4' >> .npmrc

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build
FROM deps AS build
# Real source now (busts cache only when sources change, not on lockfile edits)
COPY apps/api ./apps/api
COPY packages ./packages

RUN NODE_OPTIONS='--max-old-space-size=4096' pnpm -r --filter @rocky/api... build \
    && NODE_OPTIONS='--max-old-space-size=4096' pnpm deploy --legacy --filter=@rocky/api --prod /deploy \
    && rm -rf /deploy/apps /deploy/packages /deploy/scripts \
    && rm -f /deploy/README.md /deploy/LICENSE /deploy/CHANGELOG.md \
    # NestJS SWC emits CJS (dist/main.js uses `exports`) but api package.json
    # has "type":"module". Pin the dist folder to CJS so node loads it correctly.
    && printf '{"type":"commonjs"}\n' > /deploy/dist/package.json

# ---- runtime (distroless, prod deps only, non-root)
# No shell, no curl — minimal attack surface. Use gRPC or HTTP health from orchestrator.
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8000

COPY --from=build /deploy ./

EXPOSE 8000
CMD ["dist/main"]
