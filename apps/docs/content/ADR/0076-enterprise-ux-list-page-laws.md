# ADR-0076: Enterprise UX — List-Page Containment, Action Alignment & Control Theater

> The admin list pages were a lawless sprawl: create actions drifted in page headers, tables floated bare, kebabs were inconsistent, search was ad hoc. This ADR codifies the list page as a contained, command-aligned, controllably-illusive surface — the Red Diamond Seal for the back office.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (RobotFarm) |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Every admin list page (`/admin/*`) is a surface where a human *governs* livestock-regulation data. Before this ADR the pages diverged: primary create buttons sat in `PageHeader`/`PageHero` `actions`, tables were unbordered, row kebabs existed on some pages (`RowActions`) and not others, and search/filter toolbars were inconsistent or absent. The symptom: the user could not *see* the system as contained or *feel* command over it. The Real pressing: 20 list pages, 20 ad-hoc layouts.

Backend dependencies (ADR-0033 §D4): design system & theming → ADR-0037; forms & validation → ADR-0038; permission-aware UI → ADR-0042; error/empty/loading UX → ADR-0041; frontend architecture → ADR-0017; tRPC contract → ADR-0032; validators / Diamond Seal → ADR-0018 / ADR-0019; web admin parity → ADR-0055; web UI tiers → ADR-0056–ADR-0060.

## Decision

The list page is governed by **three laws**, realized through a shared component contract in `apps/web/components/shared/` + `apps/web/lib/`.

### Law I — Contain data

Wrap every `<DataTable>` in `<TableCard bordered={false}>`. The `Card` is the frame; the table surrenders its own outer border. Data is bounded, surveilled, complete.

### Law II — Align actions

The primary create verb moves from the page header into `TableCard` `action` (top-right). Filters / search occupy `toolbarLeft`. Left = query, right = command.

### Law III — The illusion of absolute control (control theater)

Search, filter, and the row kebab are honest affordances that *convince* the user they command the dataset:

- `SearchInput` (debounced via `useDebounced`) wired to a real `search` param — **only where the backend supports it** (e.g. `device.list`, `archive.list`). A fake search box is counter-revolutionary.
- `Select` filters in `toolbarLeft` (status, type, region, farm).
- **Every row gets a kebab** (`RowActionMenu`): an Edit link to `/[entity]/[id]/edit` (only where the route exists) + a **View details** `RowDetailsDialog`. No row escapes the gaze.

### Canonical recipe

```tsx
<TableCard
  toolbarLeft={<SearchInput value={q} onChange={setQ} placeholder="Search…" />}
  action={<Button onClick={() => router.push("/x/new")}><Plus /> New X</Button>}
>
  <DataTable
    columns={appendRowActions(xColumns, (row) => (
      <RowActionMenu items={[
        { type: "link", label: "Edit", icon: PencilIcon, href: `/x/${row.id}/edit` },
        { type: "dialog", dialog: <XDetails x={row} /> },
      ]} />
    ))}
    data={rows} total={total} isLoading={loading} page={page} pageSize={PAGE_SIZE}
    onPageChange={setPage}
    bordered={false}
    tableClassName={tableDensityClass}
  />
</TableCard>
```

### Shared component contract

| Export | File | Role |
| --- | --- | --- |
| `TableCard` | `#components/shared/table-card` | Card + `toolbarLeft` / top-right `action` |
| `SearchInput` | `#components/shared/table-card` | debounced search box |
| `appendRowActions` | `#components/shared/table-card` | appends the right-pinned kebab column |
| `tableDensityClass` | `#components/shared/table-card` | taller rows (`[&_td]:!py-3 [&_th]:!py-3`) |
| `RowDetailsDialog` | `#components/shared/row-details-dialog` | read-only View-details dialog |
| `RowActionMenu` | `#components/shared/action-dialog` | kebab host (`link` / `dialog` / `action` items) |
| `useDebounced` | `#lib/use-debounced` | search debounce |

### Sub-ordinances

- **Single kebab:** when a column factory already renders an `id:"actions"` kebab (domain actions: Seize/Reprint, Review/Resolve, Unassign, View), fold **View details** into *that* kebab via a `type:"dialog"` item — never `appendRowActions` on top, or a duplicate `actions` column renders.
- **No dead buttons:** every affordance wires to a real mutation or a real route.
- **Fixed widths / alignment:** column `meta: { width, align }` (Health uses it) keeps the grid determinate.

## Consequences

### Positive

- 20 list pages share one law; new pages are built by recipe, not reinvented.
- Green `tsc` + `next build` across the admin; the kebab / View-details pattern is reusable.
- The user perceives containment, command alignment, and control — the Enterprise UX affect.

### Negative / Cost

- Column files that own a domain kebab must absorb View details (a small, deliberate edit) rather than receive a second actions column.
- Search is gated on backend `search` support; pages without it intentionally omit it.

### Neutral

- `dashboard` is excluded (it is a dashboard, not a CRUD register).

## Implementation

Owning Bot: **Admin Bot** (`apps/web`), with the **Docs Bot** (`apps/docs`) hosting this record. RobotFarm pass: reference this ADR from `apps/web/AGENTS.md` (Admin Bot owns the Web Admin ADRs). Roll out by applying the canonical recipe to any new or refactored list page.

Ring 2 — admin form / create / edit pages: contain the form in a `Card` (`CardContent p-6`); retain the top-right `Back` action in `PageHeader` (the form's own `Save` submit stays inside the contained card — standard Enterprise form pattern). Read-only detail pages (`inspections/[id]/edit`, `movements/[id]/edit`) already self-contain via their detail components, so they need no wrapper.

Ring 3 — non-list admin pages: apply the laws with restraint, per-page, never by blanket wrapper. `dashboard` recent-animals table → contained in `Card` (hero + analytics already self-contain). `sync` filter + snapshot-results → one `Card`. `movement-lineage` timeline → `Card`. `feature-flags`, `notifications`, `documents` already self-contain in `Card`s and were left as-is. `auth/[...path]` is a NextAuth route handler (no UI surface) and is excluded.

Ring 4 — visual identity (the Red Diamond Seal). The Enterprise UX laws needed a *signature* — one bold element per the frontend-design discipline. The codebase's own recurring metaphor (the "Red Diamond Seal" = an official, contained record) became that mark. `apps/web/components/shared/seal.tsx` renders a diamond (`filled` = sealed/official, `open` = pending/offline) driven by a new `--seal` / `--brass` semantic token pair in `packages/ui/src/styles/globals.css` (Tailwind v4 `@theme inline`). Realized first on the admin **dashboard**: a ledger-style registry header (Seal + title + semantic `Live` pill, no gradient), metric tiles (`DashboardStat`) each bearing a Seal corner with **IBM Plex Mono** figures (the project's existing `--font-mono`), and a sealed mark on the "Recently registered" `Card` — making the Containment law *literal*. Mobile (ADR-0077) follows.

## Verification (Definition of Done)

```bash
pnpm check:adrs                                          # this ADR conforms to ADR-0033
ls apps/docs/content/ADR/0076-enterprise-ux-list-page-laws.md
rg -n "TableCard" "apps/web/app/(admin)"                 # list pages use the Card
rg -n "appendRowActions|RowActionMenu" "apps/web/app/(admin)"   # kebabs present
npx tsc --noEmit -p apps/web/tsconfig.json               # 0 errors (excl. pre-existing)
```

## Anti-Patterns (do not repeat)

1. A create `ActionDialog` living in the page header while the table floats bare.
2. `appendRowActions` on a column file that already has an `id:"actions"` kebab (duplicate column).
3. A `SearchInput` wired to a list input with no `search` param (fake control).
4. A row with no kebab, or a kebab whose Edit link targets a route that does not exist (404).
5. Dead buttons — affordances that do not call a real mutation or route.

## Related ADRs

- **ADR-0033** — Frontend & Mobile ADR standard (this record's form).
- **ADR-0037** — design system & theming; **ADR-0038** — forms & validation; **ADR-0042** — permission-aware UI; **ADR-0041** — error/empty/loading UX.
- **ADR-0017** — frontend architecture; **ADR-0032** — tRPC; **ADR-0018** / **ADR-0019** — validators / two-type contracts.
- **ADR-0055** / **ADR-0056**–**ADR-0060** — web admin parity & UI tiers.
