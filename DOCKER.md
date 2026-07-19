# Docker workflow

ROCKY ships three production images — `api` (NestJS), `web` (Next.js admin),
`docs` (Nextra) — built from `apps/{api,web,docs}/Dockerfile`, plus the
`docker-compose.yml` orchestration (PostGIS `db`, Cloudflare-tunnelled
networking, `drizzle-studio`). This document explains the *why* behind the
Dockerfiles so the choices stay correct as the stack evolves.

## Targets

Every service Dockerfile has the same stage model and two selectable targets:

- `production` (default) — distroless, non-root, no shell, no dev tooling.
- `development` — full graph + dev script, for hot reload via the compose override.

```sh
# Production images (used by docker-compose.yml)
docker build -t rocky-api  -f apps/api/Dockerfile .
docker build -t rocky-web  -f apps/web/Dockerfile  \
    --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .
docker build -t rocky-docs -f apps/docs/Dockerfile .

# Development images
docker build --target development -t rocky-api:dev -f apps/api/Dockerfile .
```

## Local development (hot reload)

`docker-compose.override.yml` is auto-merged by `docker compose up` (no `-f`
needed). It selects the `development` target for each service and bind-mounts
the source tree, so edits reload without a rebuild:

```sh
docker compose up --build
# api  → http://localhost:8080   (db must be up; api waits on it)
# web  → http://localhost:3050
# docs → http://localhost:3041
```

`node_modules` live in named volumes (`api_node_modules`, `web_node_modules`,
`docs_node_modules`) so the container-installed deps (locked to the lockfile)
are not clobbered by the host tree. After a dependency change, refresh them:

```sh
docker compose down -v && docker compose up --build
```

Production behaviour is unchanged — build with `-f docker-compose.yml` only, or
build the images explicitly, to skip the override.

## Why the images are built the way they are

### Glibc build base, not Alpine

The runtime is `gcr.io/distroless/nodejs24-debian12:nonroot` — a **glibc**
image. The build base is therefore `node:24-bookworm-slim` (also glibc), never
Alpine/musl. If the build base were Alpine, any native module that ends up in
the runtime image (for example `@img/sharp-*`, which Next.js traces into
`.next/standalone` for image optimization, or a bcrypt/argon2 binding) would be
compiled for **musl** and then crash under the **glibc** runtime with an
`ERR_MODULE` / `cannot open shared object` error. Debian/glibc build → glibc
runtime keeps the ABI consistent.

### `pnpm fetch` → offline install

The `toolchain` stage copies only the root manifests and runs
`pnpm fetch --frozen-lockfile` with a BuildKit cache mount. The `workspace`
stage then runs `pnpm install --offline --frozen-lockfile`. This makes installs
**deterministic** (an offline install that fails means a real lockfile/registry
problem, not a transient blip), **fast** (registry downloads are cached
separately from the install layer), and **air-gap-able**. There is deliberately
**no retry loop** around install: retries mask deterministic failures and cause
long CI stalls. Bounded retries belong in `.npmrc`; once exhausted, fail.

`corepack enable` pins pnpm to the root `packageManager` field, so the image
toolchain can never drift from the repo's declared version.

### Distroless, non-root runtime

The final stage receives only the artefacts the process needs:

- `api`: the `pnpm deploy --prod` output (`dist/` + production `node_modules`).
- `web` / `docs`: `.next/standalone`, `.next/static`, `public`.

Source, lockfiles, compilers, caches, and dev dependencies stay in earlier
stages. Files are copied `chown 65532:65532` and the container runs as the
distroless `nonroot` user (uid 65532) — no shell, no package manager, smallest
attack surface. Use `node:24-bookworm-slim` as the final image only when a shell
or native OS package is an explicit operational requirement.

### Health model

Each image ships a `HEALTHCHECK` that probes via Node's built-in `fetch` (no
shell/curl/wget added to the image):

- `api` → `GET /health`
- `web` → `GET /`   (root page)
- `docs` → `GET /`

Disable the baked-in probe with `HEALTHCHECK NONE` only when the orchestrator
(Kubernetes, Nomad, ECS) provides its own liveness/readiness probes.

## Public vs secret build arguments

- `NEXT_PUBLIC_API_URL` is compiled into the browser bundle, so it is a
  **build-time, public** value — not a secret. It is passed as a build `--arg`.
- `API_URL` (server-to-server, e.g. `http://api:8000` over the bridge network)
  and `DATABASE_URL` / auth secrets are **server-only** and injected at runtime
  by `docker-compose.yml`. They are **never** persisted as `ARG` → `ENV`.

## Production controls outside the Dockerfile

A Dockerfile alone is not an enterprise supply-chain policy. The deployment
platform / CI should also:

- **Pin base images by immutable digest** (`FROM node:24-bookworm-slim@sha256:…`)
  and roll them via a dependency bot. (Tag pinning is documented here; the digest
  is applied in CI to keep the Dockerfiles readable.)
- **Build once per commit and promote the same digest** between environments;
  never rebuild for staging/production.
- **Attach SBOM + provenance**: `docker buildx build --sbom=true --provenance=mode=max`.
- **Scan** the final image with a maintained scanner (Trivy/Grype) and enforce a
  severity/exception policy.
- **Sign** the digest with keyless Cosign and verify at admission.
- **Run tests, type checks, lint, and migration checks** before publishing.
- **Inject secrets** from the orchestrator / secret manager; never as build args.
- **Set runtime policy**: `read_only: true` + `tmpfs`, `cap_drop: [ALL]`,
  `no-new-privileges`, `pids_limit`, `mem_limit`, `cpus`, `restart`, and publish
  only the reverse proxy / ingress — not PostgreSQL.
- **TLS termination** in front of the public hosts; the internal
  `api`/`web`/`docs` service names stay on the private bridge network.

## Layout

```
docker-compose.yml          # production orchestration (PostGIS, tunnel, secrets)
docker-compose.override.yml # dev: development target + source bind-mounts
docker/initdb/              # PostGIS init scripts (mounted into db)
apps/api/Dockerfile         # NestJS → distroless
apps/web/Dockerfile         # Next.js admin → distroless
apps/docs/Dockerfile        # Nextra docs → distroless
.dockerignore               # build-context exclusions (keeps *.md for docs)
```

The docs content is Markdown, so `.dockerignore` deliberately does **not**
exclude `*.md` — excluding it (as some upstream examples do) would break the
Nextra build.
