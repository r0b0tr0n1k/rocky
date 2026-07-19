# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS toolchain
WORKDIR /app
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-docs-store,target=/pnpm/store,sharing=locked \
    pnpm fetch --frozen-lockfile

FROM toolchain AS workspace
COPY --chown=node:node . .
RUN --mount=type=cache,id=pnpm-docs-store,target=/pnpm/store,sharing=locked \
    pnpm install --offline --frozen-lockfile

FROM workspace AS development
ENV NODE_ENV=development \
    HOSTNAME=0.0.0.0 \
    PORT=3002
USER node
EXPOSE 3002
CMD ["pnpm", "--filter", "docs", "dev", "--", "--hostname", "0.0.0.0", "--port", "3002"]

FROM workspace AS build
RUN pnpm -r --filter docs... build

FROM gcr.io/distroless/nodejs24-debian12:nonroot AS production
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3002
COPY --from=build --chown=65532:65532 /app/apps/docs/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/apps/docs/.next/static ./apps/docs/.next/static
COPY --from=build --chown=65532:65532 /app/apps/docs/public ./apps/docs/public
USER 65532:65532
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3002/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["apps/docs/server.js"]
