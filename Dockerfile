# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

# Shared Debian/glibc base keeps native dependencies compatible with distroless.
FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install the complete, lockfile-pinned dependency graph once.
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund

# Local development image: build with --target development.
FROM base AS development
ENV NODE_ENV=development \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN install -d -o node -g node /app/.next
USER node
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# Compile the standalone production server.
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# A syntactically valid placeholder is scoped to the build process only. Runtime
# DATABASE_URL is injected by the orchestrator and is never baked into a layer.
RUN --mount=type=cache,id=next-cache,target=/app/.next/cache,sharing=locked \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    npm run build

# Shell-less, non-root production image. It contains no package manager, source,
# compiler, lockfile, or development dependencies.
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS production
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=65532:65532 /app/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=build --chown=65532:65532 /app/public ./public
USER 65532:65532
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["server.js"]
