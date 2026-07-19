# Todos — Menu & Navigation Ergonomics (ADR-0106)

Sequential, worker-executable. Each todo: id, title, owner bot, files, acceptance.

## Wave 1 — v1 (contained, high value)

- [ ] **T01** Raise ADR-0106 + ROCKY-FE-001 menu section
  - Owner: Admin Bot + Docs Bot
  - Files: `apps/docs/content/ADR/0106-menu-navigation-ergonomics.md` (new, ADR-0033 header,
    Proposed->Accepted), `apps/docs/content/compliance/frontend-conformity.md`
  - Acceptance: ADR-0106 validates under `pnpm check:adrs`; ROCKY-FE-001 gains a
    "Menu & Navigation ergonomics" section + control rows M-01..M-06 (each move -> ISO clause
    - status). `pnpm check:standards` green (invariant a: ADR back-link present).

- [ ] **T02** Menu item state matrix (M2)
  - Owner: UI Bot
  - Files: `packages/ui/src/components/sidebar.tsx`, `packages/ui/src/components/dropdown-menu.tsx`,
    `apps/web/components/admin-shell.tsx` (SidebarMenuButton usage)
  - Acceptance: `resting / hover / focus-visible / current / disabled` each visually distinct
    via **more than color alone** (left-accent bar + font-weight for `current`; ring for
    focus-visible). Browser gate: focus a nav item -> visible `:focus-visible` ring;
    current page shows accent + weight, not color-only.

- [ ] **T03** Unified `RowMenu` (M3) — collapse the two kebab impls
  - Owner: Admin Bot
  - Files: `apps/web/components/shared/row-menu.tsx` (new), `apps/web/components/shared/row-actions.tsx`
    (delete/replace), `apps/web/components/shared/action-dialog.tsx` (drop `RowActionMenu` kebab
    or re-export from `row-menu`), adopt in columns: `animals/columns.tsx`, `archive/columns.tsx`,
    `corrections/columns.tsx`, `devices/columns.tsx`, and pages `audit`, `ear-tags`, `health`,
    `iot`, `organizations`, `rbac`, `subjects`
  - Acceptance: exactly **one** kebab component; `RowMenu` items carry `kind:
    "navigation" | "action" | "destructive"`; stable ordering (primary first); **real per-row
    label** replaces generic "Actions"; destructive items render `AlertTriangle` + destructive
    variant. No page defines its own kebab markup.

- [ ] **T04** Destructive items via one path (M4)
  - Owner: Admin Bot
  - Files: `apps/web/components/shared/row-menu.tsx`, `apps/web/components/shared/action-dialog.tsx`
  - Acceptance: any `destructive` `RowMenu` item shows the `ActionDialog` `alert` confirmation
    AND a sonner **Undo** toast (reuse iso-7 pattern). No bare destructive mutation from a menu.
    `pnpm check:layers` green (no new import-boundary violation).

## Wave 2 — v2 (structural)

- [ ] **T05** Nav labels never-hidden by default (M1)
  - Owner: UI Bot + Admin Bot
  - Files: `apps/web/components/admin-shell.tsx`, `apps/web/lib/nav-config.ts`
  - Acceptance: at default width all nav labels visible; `collapsible="icon"` becomes opt-in +
    exposes labels on hover/focus (peek). Browser gate: collapse the rail -> labels reachable via
    keyboard focus without leaving the nav.

- [ ] **T06** Keyboard-first navigation (M5)
  - Owner: Admin Bot
  - Files: `apps/web/components/admin-shell.tsx`, `apps/web/components/shared/row-menu.tsx`
  - Acceptance: full arrow-key traversal of sidebar + every menu; `Escape` closes; focus returns
    to trigger. Browser gate: operate the entire nav + a row kebab with keyboard only.

- [ ] **T07** Workflow regroup + lean on ⌘K (M6)
  - Owner: Admin Bot
  - Files: `apps/web/lib/nav-config.ts`, `apps/web/components/admin-shell.tsx`,
    `apps/web/components/command-palette.tsx`
  - Acceptance: 29 items regrouped by *workflow*; optional "Recent" section; command palette
    documented as primary deep-nav entry (hint in shell). No item count increase in the rail.

## RobotFarm pass (all waves)

- `apps/web/AGENTS.md`: extend the ADR-0105 ergonomics note to cite ADR-0106 (menu ergonomics).
- `pnpm check:adrs` + `pnpm check:md-links` + `pnpm check:standards` green after each wave.
