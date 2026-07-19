# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS toolchain
WORKDIR /app
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-web-store,target=/pnpm/store,sharing=locked \
    pnpm fetch --frozen-lockfile

FROM toolchain AS workspace
COPY --chown=node:node . .
RUN --mount=type=cache,id=pnpm-web-store,target=/pnpm/store,sharing=locked \
    pnpm install --offline --frozen-lockfile

FROM workspace AS development
ENV NODE_ENV=development \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    API_URL=http://api:8000
USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev", "--", "--hostname", "0.0.0.0"]

FROM workspace AS build
ARG NEXT_PUBLIC_API_URL
ARG API_URL
RUN test -n "${NEXT_PUBLIC_API_URL}" \
    && NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" pnpm -r --filter web... build

FROM gcr.io/distroless/nodejs24-debian12:nonroot AS production
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    API_URL=http://api:8000
COPY --from=build --chown=65532:65532 /app/apps/web/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=65532:65532 /app/apps/web/public ./apps/web/public
USER 65532:65532
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["apps/web/server.js"]
