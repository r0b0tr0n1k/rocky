# ── Next.js Admin Panel Dockerfile ──
#
# NEXT_PUBLIC_* variables are inlined at BUILD time by Next.js.
# Pass the API URL as a build arg:
#
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
#     -t rocky-web .
#
#   docker run -e API_URL=http://api:8080 -p 3000:3000 rocky-web

# glibc base required: native deps (e.g. @parcel/watcher) ship no musl prebuilds, so Alpine breaks Next.js builds.
FROM node:24.14.0-slim AS deps
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /app

# root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# only the manifests needed by web and its workspace deps
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install -r --filter web... --frozen-lockfile

# ---- build ----
FROM deps AS build

# NEXT_PUBLIC_* is inlined by Next.js at BUILD time
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY apps/web ./apps/web
RUN pnpm -r --filter web... build

# ---- runtime ----
FROM node:24.14.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Runtime env (NOT inlined — available to SSR only)
ENV API_URL=http://api:8080

# Copy built app and dependencies
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["npx", "next", "start", "--port", "3000"]
