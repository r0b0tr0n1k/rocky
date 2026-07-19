# Todos — Frontend Ergonomics per the Repo's ISO-9241-* Skills (frontend-iso)

Each todo **loads its governing `iso-9241-*` skill** (read the SKILL.md or delegate to the
`iso-9241-*` subagent) — the skill is the standard text; we implement against it.
Builds on `2026-07-15-frontend-conformity` (T01–T16). Do NOT duplicate T06/T07/T08.
9241-500 (environments) is **out of scope** (rejected for a web dashboard).

## Wave A — a11y foundation

- [ ] **frontend-iso-1** Skip-link + landmark aria-labels in AdminShell
  - Loads: `iso-9241-151` (web nav) + `iso-9241-110` (self-descriptiveness) + `iso-9241-12` (presentation)
  - Files: `apps/web/components/admin-shell.tsx`
  - Acceptance: skip-link `<a href="#main-content">` first focusable; `<nav>`/`<aside>` carry `aria-label`;
    exactly one `<main id="main-content">`. Closes T06 browser gate.

- [ ] **frontend-iso-2** prefers-reduced-motion + custom scrollbar (G1)
  - Loads: `iso-9241-171` (WCAG 2.3.3 animations) + `iso-9241-12` (coding/contrast)
  - Files: `apps/web/app/globals.css`
  - Acceptance: `@media (prefers-reduced-motion: reduce)` disables transitions/animations; webkit scrollbar styled.

- [ ] **frontend-iso-3** UI primitive a11y pass (focus-visible + progressbar role)
  - Loads: `iso-9241-161` (visual elements) + `iso-9241-171` (accessibility)
  - Files: `packages/ui/src/components/progress.tsx` + primitive audit
  - Acceptance: interactive primitives expose `focus-visible`; progress usage sets `role="progressbar"` + `aria-valuenow`.

## Wave B — wire existing primitives

- [ ] **frontend-iso-4** Breadcrumbs wired into key pages (G4)
  - Loads: `iso-9241-110` (self-descriptiveness) + `iso-9241-151` (navigation/site map)
  - Files: dashboard + animals/farms/inspections pages; `breadcrumb.tsx`
  - Acceptance: `breadcrumb.tsx` renders a `section → page` trail on dashboard + 3–4 pages.

- [ ] **frontend-iso-5** Standardize PageHeader hero pattern (G5)
  - Loads: `iso-9241-110` (conformity) + `iso-9241-151` (web content) + `iso-9241-161` (visual elements)
  - Files: new `apps/web/components/shared/page-header.tsx`; dashboard + domain list pages
  - Acceptance: shared eyebrow + title + breadcrumb + primary action + status-badge replaces ad-hoc heroes.

## Wave C — individualization + error tolerance

- [ ] **frontend-iso-6** DataTable density toggle + saved views (G2)
  - Loads: `iso-9241-110` (suitability for individualization)
  - Files: `apps/web/components/shared/data-table.tsx` + density/saved-view store
  - Acceptance: sm/comfortable density + per-view saved filters persist (localStorage v1).

- [ ] **frontend-iso-7** High-risk action guard (consequence + Undo) (G3)
  - Loads: `iso-9241-110` (error tolerance, controllability) + `iso-9241-143` (forms)
  - Files: `apps/web/app/(admin)/rbac/*` + delete flows; `alert-dialog.tsx` + `sonner`
  - Acceptance: role change / record delete shows consequence dialog + sonner "Undo" (optimistic).

## Wave D — docs / governance

- [ ] **frontend-iso-8** Enrich ROCKY-FE-001: NAME + LINK the `iso-9241-*` skills
  - Files: `apps/docs/content/compliance/frontend-conformity.md`
  - Acceptance: benchmark list names `iso-9241-{110,12,143,151,161,171,210}` as the instruments
    (the §5 conformance-doc mechanism); 9241-500 noted out-of-scope; cross-link `ADR-0105`; G1–G5 noted closed.

- [ ] **frontend-iso-9** RobotFarm + guardian pass
  - Files: `apps/web/AGENTS.md`, `packages/ui/AGENTS.md`; run check:adrs/md-links/standards
  - Acceptance: AGENTS.md updated for new components/patterns; guardians green.
