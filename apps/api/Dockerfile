FROM node:24-alpine AS deps
# glibc NOT required: the API is NestJS (pure JS). @rocky/pdf renders via the
# typst.ts WASM compiler (libc-agnostic), so Alpine/musl is fine here — unlike
# the Next.js web/docs images, which need glibc for @parcel/watcher prebuilds.
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Install the exact pnpm version pinned in package.json's "packageManager" field.
# Uses npm (always present) instead of corepack, which is absent from
# node:24-slim / alpine images.
RUN PNPM_VER=$(node -p "require('./package.json').packageManager.replace('pnpm@','').split('+')[0]" 2>/dev/null || echo 11.13.1) \
    && for i in 1 2 3 4 5; do npm install -g "pnpm@${PNPM_VER}" && break || sleep 5; done
COPY packages ./packages
COPY apps ./apps
# Harden pnpm for flaky/slow registries: long per-request timeout, many
# retries, low concurrency (fewer simultaneous slow sockets = fewer drops).
RUN printf 'fetch-timeout=1200000\nfetch-retries=10\nfetch-retry-mintimeout=10000\nfetch-retry-maxtimeout=120000\nnetwork-concurrency=4\n' >> .npmrc
RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || sleep 15; done

# ---- build
FROM deps AS build
COPY apps/api ./apps/api
RUN pnpm -r --filter @rocky/api... build
# pnpm deploy --legacy copies the full workspace store; prune the bloat that
# the compiled dist/ no longer imports (verified: zero @rocky/* requires in dist/).
# NOTE: @rocky/pdf needs TWO third-party packages at RUNTIME — keep them:
#   - @cantoo/pdf-lib       (PDF/A-3 wrap + PAdES; imported by document.service/pdfa3/pdf-embed)
#   - @myriaddreamin/typst* (Typst WASM render invoked at request time by DocumentService)
# The zero-@rocky/* check only covers workspace packages, not these runtime deps.
RUN pnpm deploy --filter=@rocky/api --prod --legacy /deploy \
    && echo "=== /deploy size after deploy ===" && du -sh /deploy \
    && echo "=== /deploy/node_modules top-level count ===" && ls /deploy/node_modules | wc -l \
    && rm -rf /deploy/apps /deploy/packages /deploy/scripts /deploy/{README.md,LICENSE,CHANGELOG.md} \
    && cd /deploy \
    && rm -rf node_modules/@biomejs \
       node_modules/@next \
       node_modules/@pagefind \
       node_modules/@react-native \
       node_modules/@turbo \
       node_modules/@types \
       node_modules/lucide-react-native \
       node_modules/maplibre-gl \
       node_modules/mathjax-full \
       node_modules/mermaid \
       node_modules/react-aria \
       node_modules/react-devtools-core \
       node_modules/drizzle-kit \
       node_modules/next \
       node_modules/expo-sqlite \
       node_modules/hermes-compiler \
       node_modules/expo-modules-core \
       node_modules/react-native \
       node_modules/@rolldown \
       node_modules/@expo \
       node_modules/@img \
       node_modules/sharp 2>/dev/null || true \
    && echo "=== /deploy/node_modules top-level count after prune ===" && ls /deploy/node_modules | wc -l \
    && echo "=== /deploy size after prune ===" && du -sh /deploy \
    && rm -rf node_modules/.pnpm/@biomejs+* \
       node_modules/.pnpm/@next+* \
       node_modules/.pnpm/@pagefind+* \
       node_modules/.pnpm/@react-native+* \
       node_modules/.pnpm/@turbo+* \
       node_modules/.pnpm/@types+* \
       node_modules/.pnpm/lucide-react-native@* \
       node_modules/.pnpm/maplibre-gl@* \
       node_modules/.pnpm/mathjax-full@* \
       node_modules/.pnpm/mermaid@* \
       node_modules/.pnpm/react-aria@* \
       node_modules/.pnpm/react-devtools-core@* \
       node_modules/.pnpm/drizzle-kit@* \
       node_modules/.pnpm/next@* \
       node_modules/.pnpm/expo-sqlite@* \
       node_modules/.pnpm/hermes-compiler@* \
       node_modules/.pnpm/expo-modules-core@* \
       node_modules/.pnpm/react-native@* \
       node_modules/.pnpm/@rolldown+* \
       node_modules/.pnpm/@expo+* \
       node_modules/.pnpm/@img+* \
       node_modules/.pnpm/sharp@* 2>/dev/null || true \
    && echo "=== /deploy size after .pnpm prune ===" && du -sh /deploy
# The NestJS SWC build emits CommonJS (dist/main.js uses `exports`), but the api
# package.json declares "type": "module". Without this override Node treats
# dist/main.js as ESM and crashes with "exports is not defined". Pin the compiled
# output folder to CommonJS so the entry runs as CJS.
RUN printf '{"type":"commonjs"}\n' > /deploy/dist/package.json

# ---- runtime (Alpine, prod deps only, non-root)
FROM node:24-alpine AS runtime
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy ./
# run as non-root
RUN addgroup -S nodejs && adduser -S appuser -G nodejs && chown -R appuser:nodejs /app
USER appuser
CMD ["node", "dist/main"]
