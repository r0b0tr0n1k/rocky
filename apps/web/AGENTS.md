# Admin Bot — `apps/web/`

Next.js admin panel for CPC/VD back-office workflows.

## Scope

- `apps/web/app/**` — admin pages, queries, server components.
- Consumes the generated `AppRouter` (full type safety) via `@trpc/react-query`.

## Responsibilities

- Build admin UI with `@rocky/ui` (shared shadcn components) and `@rocky/validators` (Zod).
- Web-specific composition primitives live in `apps/web/components/shared/` (e.g. `validated-form`, `data-table`, `status-badge`, `form-fields`, `action-dialog`). Two lifecycle/ledger primitives were built for the **WO-123** web↔backend parity program (ADR-0055 / ADR-0060): `shared/stepper.tsx` — `Stepper` (horizontal + vertical) for order/status lifecycles (vs-contracts, farm-books, ear-tags Orders, passports); `shared/timeline.tsx` — `Timeline` for lineage/clinical records (movement-lineage, health clinical record). All parity admin pages (vs-contracts, farm-books, vs-assignments, sync, movement-lineage, ear-tags, health) consume these + enums imported from `@rocky/validators/enums`. Prefer these over hand-rolled markup.
- Wire tRPC queries/mutations to the NestJS backend.
- Owns the Web Admin ADRs (per ADR-0033) in `apps/docs/content/ADR/`.
- **ADR-0076** — Enterprise UX list-page law (Contain / Align / Control): `TableCard`, `SearchInput`, `appendRowActions`, `RowDetailsDialog`, `RowActionMenu`, `useDebounced` in `apps/web/components/shared/` + `apps/web/lib/`. Apply its canonical recipe to every admin list page.

## RobotFarm

Admin Bot is a node in the RobotFarm network (see root `../../AGENTS.md`). This file is the local contract; the root index is the rail.

## Documentation

This bot is maintained to the repo-wide standard (root `../../AGENTS.md` §Documentation Discipline):

- Architecture decisions → ADR (`cp apps/docs/content/ADR/ADR-TEMPLATE.md apps/docs/content/ADR/00NN-slug.md`), Proposed → Accepted. Validate `pnpm check:adrs`.
- Doc pages → correct Diátaxis quadrant per [ADR-0052](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/ADR/0052-documentation-architecture.md). Validate `pnpm check:md-links`.
- Recipes: [Write an ADR](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/write-an-adr.mdx) · [Add a doc page](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/add-a-doc-page.mdx) · [Run the Guardians](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/run-the-guardians.mdx).
- Gateway: `pnpm ci:checks` green before merge.
