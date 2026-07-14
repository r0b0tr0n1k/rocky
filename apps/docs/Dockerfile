# syntax=docker/dockerfile:1.7
# Docs (Nextra) — minimal image. Theme tokens inlined (no @rocky/ui dep).
# glibc base required: Next.js uses @parcel/watcher (no musl prebuilds).
FROM node:24.14.0-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Install the exact pnpm version pinned in package.json's "packageManager" field.
# Uses npm (always present) instead of corepack, which is absent from
# node:24-slim / alpine images.
RUN PNPM_VER=$(node -p "require('./package.json').packageManager.replace('pnpm@','').split('+')[0]" 2>/dev/null || echo 11.13.0) \
    && for i in 1 2 3 4 5; do npm install -g "pnpm@${PNPM_VER}" && break || sleep 5; done
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts
RUN printf 'fetch-timeout=1200000\nstore-dir=/pnpm/store\nfetch-retries=10\nfetch-retry-mintimeout=10000\nfetch-retry-maxtimeout=120000\nnetwork-concurrency=4\n' >> .npmrc
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || sleep 15; done

# ---- build
FROM deps AS build
COPY apps/docs ./apps/docs
RUN pnpm -r --filter docs... build
# pnpm deploy: standalone deployment with docs' production deps.
RUN pnpm deploy --filter=docs --prod --legacy /deploy
# IMPORTANT: do NOT prune @swc/* or @babel/* here — Next.js requires
# @swc/helpers at RUNTIME (`next start`). A prior aggressive rm removed it and
# crashed with "Cannot find module '@swc/helpers/_/_interop_require_default'".
# (The other rm targets — expo, react-native, drizzle, @nestjs, maplibre,
# better-auth, trpc, mermaid — are not in docs' dependency tree anyway.)
# pnpm deploy also EXCLUDES gitignored build output (.next, public), so copy
# the prebuilt production build + static assets explicitly.
RUN rm -rf /deploy/.next && cp -r apps/docs/.next /deploy/.next
RUN rm -rf /deploy/public && cp -r apps/docs/public /deploy/public 2>/dev/null || true

# ---- runtime (prod deps only, non-root)
FROM node:24.14.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy ./
RUN addgroup --system nodejs && adduser --system --ingroup nodejs appuser && chown -R appuser:nodejs /app
USER appuser
EXPOSE 3002
CMD ["npx", "next", "start", "--port", "3002"]
