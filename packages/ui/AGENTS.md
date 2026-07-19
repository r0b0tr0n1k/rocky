# UI Bot — `packages/ui/`

Shared shadcn/ui component library consumed by every app.

## Scope

- `packages/ui/` — shadcn components, design tokens, hooks, styles.
- Published as `@rocky/ui`; apps import via `@rocky/ui/components/*`.

## Responsibilities

- Follow the official shadcn monorepo pattern: `components.json`, `package.json#imports`, workspace `exports`.
- Keep components framework-agnostic (React Native + web where feasible); no app-specific logic.
- Coordinate new primitives with the app consumers (web + mobile).
- **Primitive hygiene:** `@rocky/ui/components/*` is the single source of truth for shadcn primitives. Apps MUST NOT hand-roll a primitive that already ships here — consume it via the `#components/shared/*` passthroughs in `apps/web` (or `@rocky/ui/components/*` directly). `scripts/check-shadcn-primitives.mjs` (run via `pnpm check:shadcn`, wired into `ci:checks`) fails the build on a duplicate.

## RobotFarm

UI Bot is a node in the RobotFarm network (see root `../../AGENTS.md`). This file is the local contract; the root index is the rail.

## Documentation

This bot is maintained to the repo-wide standard (root `../../AGENTS.md` §Documentation Discipline):

- Architecture decisions → ADR (`cp apps/docs/content/ADR/ADR-TEMPLATE.md apps/docs/content/ADR/00NN-slug.md`), Proposed → Accepted. Validate `pnpm check:adrs`.
- Doc pages → correct Diátaxis quadrant per [ADR-0052](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/ADR/0052-documentation-architecture.md). Validate `pnpm check:md-links`.
- Recipes: [Write an ADR](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/write-an-adr.mdx) · [Add a doc page](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/add-a-doc-page.mdx) · [Run the Guardians](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/run-the-guardians.mdx).
- Gateway: `pnpm ci:checks` green before merge.
