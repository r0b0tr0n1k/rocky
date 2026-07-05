# ── Next.js Admin Panel Dockerfile ──
#
# Build:  docker build -f apps/web/Dockerfile -t rocky-web .
# Run:    docker run -e API_URL=http://api:8080 -p 3000:3000 rocky-web
#
# Requires the NestJS API to be running at the URL specified by API_URL.

FROM node:24.14.0-slim AS deps
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

# root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# only the manifests needed by web and its workspace deps
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json

# install only the web workspace and its dependencies
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install -r --filter web... --frozen-lockfile

# ---- build
FROM deps AS build
COPY apps/web ./apps/web
RUN pnpm -r --filter web... build

# ---- runtime
FROM node:24.14.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and dependencies
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public

# The API_URL tells Next.js where to find the NestJS backend.
# In Docker Compose, this is the service name (e.g., "http://api:8080").
ENV API_URL=http://api:8080

WORKDIR /app/apps/web
EXPOSE 3000

# Start Next.js in production mode
CMD ["npx", "next", "start", "--port", "3000"]
