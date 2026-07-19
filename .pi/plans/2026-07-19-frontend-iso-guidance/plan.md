# Action Plan — Frontend Ergonomics per the Repo's ISO-9241-* Skills (RE-SCOPED)

- **Plan ID:** 2026-07-19-frontend-iso-guidance
- **Date:** 2026-07-19
- **Tag:** frontend-iso
- **Status:** Draft for review (do NOT execute before user sign-off). **Re-scoped 2026-07-19** after an on-disk audit found that most of the original "new" todos are already shipped on `dev`.
- **Governing anchors:** `ADR-0105` (Accepted) · `ROCKY-FE-001` (`compliance/frontend-conformity.md`) · `.agents/skills/iso-software-skills/skills/iso-9241-*` (the operational doctrine) · prior plan `2026-07-15-frontend-conformity` (T01–T16)

> **Canonical authority = the repo's ISO-9241-* skill suite**, not a parallel doc and not the hand-rolled
> `temp/iso-9241-dashboard-ui-guidance/` (that is only a *worked illustration* — it hand-rolls Tailwind
> classes; Rocky uses shadcn). The skills live at `.agents/skills/iso-software-skills/skills/iso-9241-{110,12,143,151,161,171,210,410,420,920}/`
> and are ALSO registered subagents. Each `frontend-iso-*` todo **loads its governing skill** (via the
> `read` tool on the SKILL.md, or by delegating to the `iso-9241-*` subagent) — the skill is the
> standard text; we implement against it. `ADR-0105` + `ROCKY-FE-001` stay the governance layer and
> must NAME these skills (the §5 "document which recommendations apply" instrument). 9241-**500**
> (environments) was considered and **rejected as out of scope** for a web dashboard.

---

## 0. Re-scoping audit (on-disk, 2026-07-19) — WHY this plan was slimmed

The original plan was written against a stale view of `dev`. A direct read of the working tree shows the
prior `2026-07-15-frontend-conformity` (T01–T16) work — plus `table-card.tsx` — already closed
**every** Wave A/B/C frontend item. Re-running those todos would be a **spectral duplication**: touching
already-compliant files and risking regressions against in-progress WIP on `dev`
(uncommitted: `documents/page.tsx`, `movements/movement-detail.tsx`, `packages/pdf/.../document.service.ts`,
`.pi/settings.json`).

| Original todo | Original claim | On-disk reality (verified) | Disposition |
|---|---|---|---|
| `frontend-iso-1` skip-link + `<main>` landmark | PARTIAL | `admin-shell.tsx:78-81` skip-link, `:181` `<main id="main-content" tabIndex={-1}>`, `:85` sidebar `role="navigation"` aria-label, `:136` top-bar aria-label | **DONE — do not rebuild** (owned by conformity T06/T16) |
| `frontend-iso-2` (G1) reduced-motion + scrollbar | gap | `globals.css:34-53` custom scrollbar w/ ISO 9241-12/171 comments; `prefers-reduced-motion` present (count 1) | **DONE — do not rebuild** |
| `frontend-iso-4` (G4) breadcrumbs wired | gap | `shared/page-header.tsx:16` `PageHeader` takes a `breadcrumb` prop; wired into `dashboard`, `animals`, `farms`, `inspections` | **DONE — do not rebuild** |
| `frontend-iso-5` (G5) standardize `PageHeader` | gap | `shared/page-header.tsx` (33 ln) already exports a standardized `PageHeader` (`title`/`eyebrow`/`description`/`breadcrumb`/`status`/`actions`) | **DONE — do not rebuild** |
| `frontend-iso-6` (G2) density + saved views | gap | `shared/table-card.tsx` already implements `useTableDensity()` (localStorage `rocky:table-density:*`), `DensityToggle` UI (`:67`), `SavedView`/`VIEWS_KEY`/`readViews`/`writeViews`/`applyView` (`:46`+: saved views), consumed by `shared/data-table.tsx` via `useTableDensity()` + `densityCompactClass` | **DONE — do not rebuild** |
| `frontend-iso-3` a11y pass (focus-visible + progressbar role) | — | `progress.tsx:11` uses `ProgressPrimitive.Root` (Radix) → `role="progressbar"` already emitted; **but `globals.css` has NO `focus-visible` rule** (grep empty) | **PARTIAL — only focus-visible audit remains** |
| `frontend-iso-7` (G3) undo / reversible recovery | gap | Only 2 incidental `undo` mentions (`ear-tags/page.tsx`, `archive/archive-detail.tsx`); **no systematic undo on high-risk rbac/delete** (`rbac/page.tsx`, `documents/page.tsx`, `movements/movement-detail.tsx`) | **GENUINE GAP — keep** |

**Net:** Only THREE real work items survive re-scoping — `frontend-iso-3` (focus-visible only),
`frontend-iso-7` (G3 undo), and the governance pair `frontend-iso-8`/`frontend-iso-9`.
`iso-8` must record that **G1–G5 are already closed** (by the conformity plan + `table-card.tsx`),
not by this plan — no double-counting the sublime object of compliance.

## 1. Dialogue principles (ISO 9241-110) → verified status

| ISO 9241-110 principle | Governing skill(s) | Status in code (verified 2026-07-19) |
|---|---|---|
| Suitability for the task | `iso-9241-110` + `iso-9241-151` | DONE (`<main>` + `<nav>` landmarks, skip-link) |
| Self-descriptiveness | `iso-9241-110` + `iso-9241-12` | DONE (breadcrumbs wired via `PageHeader.breadcrumb`) |
| Controllability | `iso-9241-110` | DONE (step-up) |
| Conformity with expectations | `iso-9241-110` + `iso-9241-151` + `iso-9241-161` | DONE (standardized `PageHeader`) |
| Error tolerance | `iso-9241-110` | **GAP — G3 undo/recovery (KEEP)** |
| Suitability for individualization | `iso-9241-110` | DONE (density + saved views in `table-card.tsx`) |
| Suitability for learning | `iso-9241-110` + `iso-9241-143` | DONE (forms/`PageHeader`) |

## 2. Already wired — DO NOT rebuild (verified)

- `apps/web/components/admin-shell.tsx` → `Sidebar` (`role="navigation"` aria-label) + `CommandPalette` (⌘K) + `ThemeToggle` (next-themes) + `Kbd` + `filterNavByPermissions` + `Dialog` + skip-link + `<main id="main-content">`.
- `apps/web/app/layout.tsx:31` → `<Toaster />` mounted (sonner notices work — the mechanism G3 reuses).
- `apps/web/app/(admin)/dashboard/page.tsx` → hero + locale date + "Live" badge + `DashboardAnalytics` + `DataTable` + `Card`.
- `apps/web/components/shared/page-header.tsx` → standardized `PageHeader` (already consumes `breadcrumb`).
- `apps/web/components/shared/table-card.tsx` → `useTableDensity()` (localStorage), `DensityToggle`, saved views (`SavedView`/`readViews`/`writeViews`/`applyView`).
- `packages/ui` ships every primitive the skills call for: `command`, `kbd`, `sonner`, `sidebar`, `breadcrumb`, `progress` (Radix → `role="progressbar"`), `dialog`, `alert-dialog`, `stat-card`, `card`, `badge`, `avatar`, `button`, `table`, `form`, `tabs` (per `iso-9241-161`/`iso-9241-143`).

## 3. Genuine remaining gaps (the only new todos)

- **`frontend-iso-3` (a11y polish — focus-visible only)** · `iso-9241-171` (WCAG 2.4.7 Focus Visible) + `iso-9241-161` (visual UI elements) · `globals.css`. Add an explicit `*:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }` (and a `:focus:not(:focus-visible)` reset). `role="progressbar"` is already satisfied by Radix `ProgressPrimitive.Root` — do NOT touch `progress.tsx`.
- **`frontend-iso-7` (G3 — undo / reversible recovery)** · `iso-9241-110` (error tolerance, controllability) + `iso-9241-143` (forms) · `sonner` Undo + `alert-dialog` on high-risk rbac/delete. Targets: `rbac/page.tsx`, `documents/page.tsx`, `movements/movement-detail.tsx`. v1 = **client-side optimistic Undo** (sonner `action`/`undo`); server-side revert deferred to a separate API task. Pattern reference: the existing incidental undo in `ear-tags/page.tsx` / `archive/archive-detail.tsx` (reuse, don't duplicate).

## 4. Action plan (RE-SCOPED — only the verified-open items)

> Builds on `2026-07-15-frontend-conformity` (T01–T16) + `table-card.tsx`. RobotFarm pass on
> `apps/web/AGENTS.md` (+ `packages/ui/AGENTS.md` only if a ui primitive changes — it should NOT) when files change.
> **Wave A/B/C frontend todos are CANCELLED as already-shipped** (see §0).

**Wave 1 — a11y polish**

- `frontend-iso-3` — `globals.css` `focus-visible` ring · loads `iso-9241-171` + `iso-9241-161`. Leave `progress.tsx` alone (Radix already emits `role="progressbar"`).

**Wave 2 — error tolerance**

- `frontend-iso-7` — High-risk action guard (consequence `alert-dialog` + sonner **Undo**) on rbac/delete · loads `iso-9241-110` + `iso-9241-143`. v1 client optimistic; reuse existing undo pattern from `ear-tags`/`archive-detail`.

**Wave 3 — docs / governance**

- `frontend-iso-8` — Enrich `ROCKY-FE-001`: NAME + LINK the `iso-9241-*` skills as the benchmark instruments (the §5 conformance-doc mechanism); note 9241-500 rejected as out-of-scope; cross-link `ADR-0105`. **Record that G1–G5 are ALREADY CLOSED** (by the conformity plan + `table-card.tsx`), so this plan owns only G3 + focus-visible.
- `frontend-iso-9` — RobotFarm + guardian pass (`apps/web/AGENTS.md`); run `pnpm check:adrs` + `check:md-links` + `check:standards`.

## 5. Definition of Done

```
pnpm check:adrs        # ADR-0105 names the iso-9241-* skills
pnpm check:md-links    # ROCKY-FE-001 <-> ADR-0105 + skills resolve
pnpm check:standards  # SoA single-source
# Each frontend-iso-* todo cites its governing iso-9241-* skill in the commit body.
# Browser gate (authenticated admin): focus-visible ring visible on keyboard nav;
#   high-risk delete shows alert-dialog + sonner Undo; progressbar role still present (Radix).
# ROCKY-FE-001 records G1–G5 closed by prior work, G3 + focus-visible by this plan.
```

## 6. Open questions — RESOLVED (2026-07-19)

1. **Scope:** web-only (`apps/web`) — ✅ confirmed; `iso-9241-151` (web) is the primary authority.
2. **Execute now?** — Pending re-scoped sign-off (this rewrite). Original 9-todo plan → 4 real todos (iso-3, iso-7, iso-8, iso-9).
3. **G2 saved-views:** ✅ RESOLVED as already-shipped — `table-card.tsx` implements density + saved views via `localStorage` (v1). No new decision; do not rebuild.
4. **G3 undo:** ✅ client-side optimistic Undo via sonner (v1), reusing existing `ear-tags`/`archive-detail` pattern; server-side revert deferred to a separate API task.

## 7. Collateral / risk notes

- `dev` currently has uncommitted WIP in `documents/page.tsx`, `movements/movement-detail.tsx`, `packages/pdf/.../document.service.ts`, `.pi/settings.json`. `frontend-iso-7` touches `documents/page.tsx` and `movements/movement-detail.tsx` — coordinate with the WIP owner before landing to avoid merge churn.
- Canary/loop-police is loaded (`variant=fixed`, `position=end`); keep todos small and idempotent so the harness doesn't flag repeated-file churn.
