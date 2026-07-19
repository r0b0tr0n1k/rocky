# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS toolchain
WORKDIR /app
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-api-store,target=/pnpm/store,sharing=locked \
    pnpm fetch --frozen-lockfile

FROM toolchain AS workspace
COPY --chown=node:node . .
RUN --mount=type=cache,id=pnpm-api-store,target=/pnpm/store,sharing=locked \
    pnpm install --offline --frozen-lockfile

FROM workspace AS development
ENV NODE_ENV=development \
    HOST=0.0.0.0 \
    PORT=8000
USER node
EXPOSE 8000
CMD ["pnpm", "--filter", "@rocky/api", "dev"]

FROM workspace AS build
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm -r --filter @rocky/api... build \
    && pnpm deploy --legacy --filter=@rocky/api --prod /deploy \
    && rm -rf /deploy/apps /deploy/packages /deploy/scripts \
    && rm -f /deploy/README.md /deploy/LICENSE /deploy/CHANGELOG.md \
    && printf '{"type":"commonjs"}\n' > /deploy/dist/package.json \
    && find /deploy/dist -type f -name '*.map' -delete

FROM gcr.io/distroless/nodejs24-debian12:nonroot AS production
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8000
COPY --from=build --chown=65532:65532 /deploy ./
USER 65532:65532
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:8000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["dist/main.js"]
