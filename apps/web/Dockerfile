# syntax=docker/dockerfile:1.7
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN PNPM_VER=$(node -p "require('./package.json').packageManager.replace('pnpm@','').split('+')[0]" 2>/dev/null || echo 11.13.1) \
    && for i in 1 2 3 4 5; do npm install -g "pnpm@${PNPM_VER}" && break || sleep 5; done
COPY packages ./packages
COPY apps ./apps
RUN printf 'fetch-timeout=1200000\nstore-dir=/pnpm/store\nfetch-retries=10\nfetch-retry-mintimeout=10000\nfetch-retry-maxtimeout=120000\nnetwork-concurrency=4\n' >> .npmrc
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || sleep 15; done
# ---- build
FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm -r --filter web... build
# ---- runtime
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup --system nodejs && adduser --system --ingroup nodejs appuser
COPY --from=build --chown=appuser:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=appuser:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=appuser:nodejs /app/apps/web/public ./apps/web/public
USER appuser
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
