# AIMCS — Animal Identification & Movement Control System

Modern monorepo for the national Animal Identification and Registration System, built with NestJS + tRPC + Drizzle ORM + better-auth.

## Technology choices

| Category | Choice | Where | Docs |
|---|---|---|---|
| Monorepo | Turbo + pnpm workspaces/catalog | repo root | `turbo.json` |
| Mobile | Expo + React Native | `apps/frontend/mobile` | `docs/mobile.md` |
| API | NestJS + tRPC (`nestjs-trpc-v2`) | `apps/backend/api` | `docs/trpc.md` |
| Auth | better-auth + Drizzle adapter + Global Identity Model | `apps/backend/api/src/auth/` | `docs/auth.md` |
| DB | PostgreSQL + Drizzle ORM | `packages/@prasici/database` | `docs/db.md` |
| Validation | Zod 4 — `@prasici/validators` (Diamond Seal) | `packages/@prasici/validators` | `docs/validators.md` |
| tRPC Middleware | `@prasici/trpc` (RLS context injection) | `packages/@prasici/trpc` | — |
| Schema/migrations | Drizzle Kit | `packages/@prasici/database` | `docs/db.md` |
| Errors | neverthrow | services | `docs/neverthrow.md` |
| Testing | Vitest + testcontainers | backend packages | `docs/testing.md` |
| Lint/format | Biome | repo root | `biome.json` |
| Logging | pino | backend apps | `docs/logging.md` |

## Repo structure

### Apps

| Path | Role |
|------|------|
| `apps/backend/api` | **NestJS API server** — tRPC endpoints, better-auth, Drizzle |
| `apps/frontend/mobile` | **Expo React Native** — mobile client (tRPC + React Query) |
| `apps/frontend/web` | Vite + React web app |
| `apps/frontend/landing` | Astro static landing site |

### Internal Packages

| Path | Role |
|------|------|
| `packages/@prasici/database` | **Drizzle ORM schemas** — SM, HK, AN, Auth (better-auth tables) |
| `packages/@prasici/validators` | **Zod 4 validation** — API schemas, enums, check-digit, type-bridge |
| `packages/@prasici/trpc` | **tRPC middleware** — RLS context injection for PostgreSQL |
| `packages/@prasici/types` | Shared types |
| `packages/backend/core` | Shared backend utilities — logger, validation helpers, test containers |
| `packages/frontend/web` | Shared UI library (shadcn) |
| `packages/shared/config` | Shared TypeScript configs |
| `packages/shared/hello` | Example shared package |

## Getting started (non-Devbox path)

### Prerequisites

- Node.js (targets Node 24+)
- pnpm (see the pinned version in root `package.json`)
- Docker (for Postgres)

### Setup

1) Install deps:

```bash
pnpm install
```

2) Environment variables

- root (docker compose): copy `.env.example` → `.env` (only used by `compose.yml`)
- backend: copy `apps/backend/api/.env.example` → `apps/backend/api/.env`
- mobile: copy `apps/frontend/mobile/.env.example` → `apps/frontend/mobile/.env`

3) Start Postgres:

```bash
docker compose up -d
```

4) Push Drizzle schema:

```bash
pnpm -C packages/@prasici/database push
```

5) Start dev:

```bash
pnpm dev
```

## Getting started (Devbox option)

Devbox is optional, but convenient (installs Node/pnpm):

```bash
devbox shell
```

Then run the same steps (`pnpm install`, `docker compose up -d`, `pnpm dev`).

## Worktree Workflow (Parallel Development)

This repo supports [Worktrunk](https://worktrunk.dev/) for parallel feature development using git worktrees. Each worktree gets its own working copy, dependencies, and environment.

**Quick Start:**

```bash
# Install worktrunk (macOS)
brew install worktrunk/tap/worktrunk

# Setup shell integration (required)
wt config shell install

# Configure worktree path (required for non-bare repos)
wt config create
# Add to ~/.config/worktrunk/config.toml:
#   worktree-path = "../{{ branch | sanitize }}"

# Create a new worktree
wt switch -c feature/my-feature
# Auto-runs: copies .env + node_modules, runs pnpm install

# Work on your feature
just setup && pnpm dev

# Merge and cleanup when done
wt merge  # Squashes, merges, removes worktree
```

See `docs/worktree.md` for full documentation.

## Useful commands

- `pnpm dev` / `pnpm typecheck` / `pnpm lint:check` / `pnpm format:check` / `pnpm test`
- `pnpm -C apps/backend/api dev`
- `pnpm -C apps/frontend/mobile ios` / `pnpm -C apps/frontend/mobile android`
- `pnpm -C packages/@prasici/database generate` (Drizzle schema -> SQL migration)
- `pnpm -C packages/@prasici/database push` (push schema to DB)
- `pnpm -C packages/@prasici/database studio` (Drizzle Studio GUI)
- Find improvement spots: `rg -n "TODO:" .`

## Architecture Overview

```
Mobile App (@trpc/react-query)
        |
    httpBatchLink (POST /trpc/*)
        |
NestJS API (nestjs-trpc-v2 generator)
        |
@Router / @Query / @Mutation decorators
        |
@prasici/validators (Zod 4 input validation)
        |
    Repository Layer
        |
@prasici/database (Drizzle ORM)
        |
    PostgreSQL 16
```

### Auth Flow

```
better-auth (Drizzle adapter)
    |
auth_user / auth_session / auth_account / auth_verification
    |
customSession plugin enriches session with AIMCS role + org
    |
sm.users linked via authUserId FK
    |
RLS policies enforce row-level security per role/org
```

### Key Design Decisions

- **Global Identity Model**: Auth tables have no `tenant_id`. Users are global.
- **Diamond Seal**: `@prasici/validators` Zod schemas are the validation SSOT. tRPC validates at the boundary, repositories trust validated input.
- **Generated Router**: `apps/backend/api/src/@generated/server.ts` is auto-generated by `nestjs-trpc-v2`. Commit to git for frontend type resolution.
- **RLS**: `@prasici/trpc` injects PostgreSQL session context for native row-level security policies.

## CI/CD

- **Local**: Husky runs `lint:check`, `format:check`, and `typecheck` on `pre-push`.
- **CI**: GitHub Actions runs those checks + `pnpm test` on every PR.
- Details: `docs/CICD.md`.

## Docs

- `docs/trpc.md` — tRPC architecture, router setup, frontend client
- `docs/db.md` — Drizzle schemas, migrations, RLS policies
- `docs/auth.md` — better-auth setup, Global Identity Model, social login
- `docs/validators.md` — Zod 4 Diamond Seal validation patterns
- `docs/neverthrow.md` — Result pattern
- `docs/tech-choices.md`
- `docs/testing.md`
- `docs/cicd.md`
- `docs/logging.md`
- `docs/mobile.md`
- `docs/worktree.md`
- `docs/skills.md`

## Skills (AI Workflows)

Move skills into appropriate folder on your system or repository. Since each provider requires a different location, see your LLM provider docs for relevant locations, eg. Codex can be placed inside `.codex/skills/` while Claude can be placed inside `./.claude/skills/`

This repo includes [Skills](docs/skills.md) — modular instruction sets that help AI agents work effectively in this codebase.

Skills live in `.agents/skills/` and work tracking lives in `.work/`. See `docs/skills.md` for details.

## OmniDev

We built OmniDev to stop reinventing AI tooling setups across providers and repos. It lets you package and share capabilities (skills, rules, hooks, commands) once, then load the right set for the task at hand.

Docs: `https://github.com/frmlabz/omnidev`

## Contributing

See `CONTRIBUTING.md` and `code-guidelines.md` (LLMs are fine, but you’re responsible for correctness/security/licensing).

## License

MIT (see `LICENCE.md`).
