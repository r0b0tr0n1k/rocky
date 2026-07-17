# syntax=docker/dockerfile:1.7
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN PNPM_VER=$(node -p "require('./package.json').packageManager.replace('pnpm@','').split('+')[0]" 2>/dev/null || echo 11.13.1) \
    && for i in 1 2 3 4 5; do npm install -g "pnpm@${PNPM_VER}" && break || sleep 5; done
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts
RUN printf 'fetch-timeout=1200000\nstore-dir=/pnpm/store\nfetch-retries=10\nfetch-retry-mintimeout=10000\nfetch-retry-maxtimeout=120000\nnetwork-concurrency=4\n' >> .npmrc
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || sleep 15; done

# ---- build
FROM deps AS build
# apps/docs is already copied in `deps` — no second COPY needed
RUN pnpm -r --filter docs... build

# ---- runtime
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3002
RUN addgroup --system nodejs && adduser --system --ingroup nodejs appuser
COPY --from=build --chown=appuser:nodejs /app/apps/docs/.next/standalone ./
COPY --from=build --chown=appuser:nodejs /app/apps/docs/.next/static ./apps/docs/.next/static
COPY --from=build --chown=appuser:nodejs /app/apps/docs/public ./apps/docs/public
USER appuser
EXPOSE 3002
CMD ["node", "apps/docs/server.js"]
