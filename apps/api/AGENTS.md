# API Bot — `apps/api/`

NestJS tRPC server: builds the routers that become the generated `AppRouter`.

## Scope

- `apps/api/src/routers/*` — `@Router()` / `@Query` / `@Mutation` decorators.
- `apps/api/src/app.module.ts` — the `nestjs-trpc` entrypoint.
- Generates `packages/trpc/src/generated/server.ts` (the `AppRouter` surface).

## Responsibilities

- Implement tRPC routers; map domain `Result<T,E>` → `TRPCError` via `createResultUnwrapper(map)`.
- Enforce the tRPC layer boundary: routers return `result.unwrap()`, never leak server types.
- Gate procedures with `@Policy({ action })` + `@RegisterPolicy("alias")` (order matters).
- Reads `@rocky/validators` (API Zod); writes routers/services only.

## RobotFarm

API Bot is a node in the RobotFarm network (see root `../../AGENTS.md`). This file is the local contract; the root index is the rail.

## Documentation

This bot is maintained to the repo-wide standard (root `../../AGENTS.md` §Documentation Discipline):

- Architecture decisions → ADR (`cp apps/docs/content/ADR/ADR-TEMPLATE.md apps/docs/content/ADR/00NN-slug.md`), Proposed → Accepted. Validate `pnpm check:adrs`.
- Doc pages → correct Diátaxis quadrant per [ADR-0052](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/ADR/0052-documentation-architecture.md). Validate `pnpm check:md-links`.
- Recipes: [Write an ADR](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/write-an-adr.mdx) · [Add a doc page](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/add-a-doc-page.mdx) · [Run the Guardians](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/run-the-guardians.mdx).
- Gateway: `pnpm ci:checks` green before merge (enforces tRPC boundary, ADRs, links, agents, tests).
