FROM node:24.14.0-slim AS deps
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app
# root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# only the manifests to maximize install cache
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
# install only the API workspace and its deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install -r --filter @rocky/api... --frozen-lockfile

# ---- build
FROM deps AS build
# copy sources now (deps stage already has manifests and node_modules)
COPY apps/api ./apps/api
# build only API and its deps
RUN pnpm -r --filter @rocky/api... build

# ---- runtime
FROM node:24.14.0-slim AS runtime
# Install curl for health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
# copy built app and dependencies
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api
WORKDIR /app/apps/api
CMD ["npm", "start"]
