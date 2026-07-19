# Action Plan — Frontend Ergonomics per the Repo's ISO-9241-* Skills

- **Plan ID:** 2026-07-19-frontend-iso-guidance
- **Date:** 2026-07-19
- **Tag:** frontend-iso
- **Status:** Draft for review (do NOT execute before user sign-off)
- **Governing anchors:** `ADR-0105` (Accepted) · `ROCKY-FE-001` (`compliance/frontend-conformity.md`) · `.agents/skills/iso-software-skills/skills/iso-9241-*` (the operational doctrine) · existing plan `2026-07-15-frontend-conformity` (T01–T16)

> **Canonical authority = the repo's ISO-9241-* skill suite**, not a parallel doc and not the hand-rolled
> `temp/iso-9241-dashboard-ui-guidance/` (that is only a *worked illustration* — it hand-rolls Tailwind
> classes; Rocky uses shadcn). The skills live at `.agents/skills/iso-software-skills/skills/iso-9241-{110,12,143,151,161,171,210,410,420,920}/`
> and are ALSO registered subagents. Each `frontend-iso-*` todo **loads its governing skill** (via the
> `read` tool on the SKILL.md, or by delegating to the `iso-9241-*` subagent) — the skill is the
> standard text; we implement against it. `ADR-0105` + `ROCKY-FE-001` stay the governance layer and
> must NAME these skills (the §5 "document which recommendations apply" instrument). 9241-**500**
> (environments) was considered and **rejected as out of scope** for a web dashboard.

---

## 1. Dialogue principles (ISO 9241-110) → governing skill + existing todo

| ISO 9241-110 principle | Governing skill(s) | Existing coverage (ADR-0105) | Status in code |
|---|---|---|---|
| Suitability for the task | `iso-9241-110` + `iso-9241-151` | T06 | PARTIAL (`<main>` exists) |
| Self-descriptiveness | `iso-9241-110` + `iso-9241-12` | T06 | PARTIAL (breadcrumbs unwired — G4) |
| Controllability | `iso-9241-110` | T12 | DONE (step-up) |
| Conformity with expectations | `iso-9241-110` + `iso-9241-151` + `iso-9241-161` | consistency pass | PARTIAL (no PageHeader — G5) |
| Error tolerance | `iso-9241-110` | T12/T14 | GAP (G3 undo/recovery) |
| Suitability for individualization | `iso-9241-110` | T08 | GAP (G2 views/density) |
| Suitability for learning | `iso-9241-110` + `iso-9241-143` | T08 | PARTIAL |

## 2. Already wired — DO NOT rebuild
- `apps/web/components/admin-shell.tsx` → `Sidebar` + `CommandPalette` (⌘K) + `ThemeToggle` (next-themes) + `Kbd` + `filterNavByPermissions` + `Dialog`.
- `apps/web/app/layout.tsx:31` → `<Toaster />` mounted (sonner notices work).
- `apps/web/app/(admin)/dashboard/page.tsx` → hero + locale date + "Live" badge + `DashboardAnalytics` + `DataTable` + `Card`.
- `packages/ui` ships every primitive the skills call for: `command`, `kbd`, `sonner`, `sidebar`, `breadcrumb`, `progress`, `dialog`, `alert-dialog`, `stat-card`, `card`, `badge`, `avatar`, `button`, `table`, `form`, `tabs` (per `iso-9241-161`/`iso-9241-143`).

## 3. Gaps the skills expose (new todos, each tagged with its governing skill)

- **G1 — reduced-motion + custom scrollbar** · `iso-9241-171` (WCAG 2.3.3 animations) + `iso-9241-12` (coding/contrast) · `globals.css`.
- **G2 — saved views + table density** (individualization) · `iso-9241-110` (suitability for individualization) · `DataTable`.
- **G3 — undo / draft / reversible recovery** (error tolerance) · `iso-9241-110` (error tolerance, controllability) · `alert-dialog` + `sonner` Undo on rbac/delete.
- **G4 — breadcrumbs wired into pages** (self-descriptiveness) · `iso-9241-110` + `iso-9241-151` (navigation/site map) + `iso-9241-12` · `breadcrumb.tsx`.
- **G5 — standardize PageHeader hero** (conformity/predictability) · `iso-9241-110` + `iso-9241-151` + `iso-9241-161` · new `PageHeader`.

## 4. Action plan (sequenced, worker-executable — each todo loads its skill)

> Builds on `2026-07-15-frontend-conformity` (T01–T16). New todos `frontend-iso-*`. RobotFarm pass on
> `apps/web/AGENTS.md` + `packages/ui/AGENTS.md` when files change.

**Wave A — a11y foundation (T06/T07 + G1)**
- `frontend-iso-1` — AdminShell skip-link + landmark `aria-label` · loads `iso-9241-151` + `iso-9241-110` + `iso-9241-12`. One `<main id="main-content">`; skip-link first focusable.
- `frontend-iso-2` — `globals.css` reduced-motion + scrollbar · loads `iso-9241-171` + `iso-9241-12` (G1).
- `frontend-iso-3` — UI primitive a11y pass · loads `iso-9241-161` + `iso-9241-171`: `focus-visible` rings; `role="progressbar"` on progress usage.

**Wave B — wire primitives (G4 + G5)**
- `frontend-iso-4` — Breadcrumbs into dashboard + 3–4 pages · loads `iso-9241-110` + `iso-9241-151` (G4).
- `frontend-iso-5` — Standardize `PageHeader` hero · loads `iso-9241-110` + `iso-9241-151` + `iso-9241-161` (G5).

**Wave C — individualization + error tolerance (G2 + G3)**
- `frontend-iso-6` — `DataTable` density + saved views · loads `iso-9241-110` (G2).
- `frontend-iso-7` — High-risk action guard (consequence + Undo) · loads `iso-9241-110` + `iso-9241-143` (G3).

**Wave D — docs / governance**
- `frontend-iso-8` — Enrich `ROCKY-FE-001`: NAME + LINK the `iso-9241-*` skills as the benchmark instruments (the §5 conformance-doc mechanism); note 9241-500 rejected as out-of-scope; cross-link `ADR-0105`. Note G1–G5 closed.
- `frontend-iso-9` — RobotFarm + guardian pass (`apps/web/AGENTS.md`, `packages/ui/AGENTS.md`); run `pnpm check:adrs` + `check:md-links` + `check:standards`.

## 5. Definition of Done
```
pnpm check:adrs        # ADR-0105 names the iso-9241-* skills
pnpm check:md-links    # ROCKY-FE-001 <-> ADR-0105 + skills resolve
pnpm check:standards  # SoA single-source
# Each frontend-iso-* todo cites its governing iso-9241-* skill in the commit body.
# Browser gate (authenticated admin): one <main>, <nav> aria-label, skip-link first focusable,
#   inputsNoLabel===0, full keyboard path, reduced-motion honored, progressbar role present.
```

## 6. Open questions for the user
1. **Scope:** web-only (`apps/web`) — recommend; the `iso-9241-151` (web) skill is the primary authority. Mobile has its own plan.
2. **Execute now?** Plan for review. Approve to spawn workers (Wave A→D) on `dev`, each loading its skill.
3. **G2 saved-views:** localStorage (v1) vs shared user-preference table?
4. **G3 undo:** client-side optimistic "Undo" (v1) vs true server-side revert (separate API task)?
