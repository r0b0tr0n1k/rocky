# ADR-0108: Menu & Navigation Ergonomics (Web Admin)

> Make the web-admin navigation & menu surfaces ISO-9241-aligned — benchmarking
> behaviour against the repo's `iso-9241-*` skills, with `DESIGN.vercel.md` as a
> scoped, non-governing visual-token reference. Resolves the symptom of two divergent
> kebab implementations and an icon-collapse nav that hides labels. (standard: ADR-0033)

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-19 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The web admin (`apps/web`, Admin Bot) ships navigation & menu surfaces that the initial
ergonomics pass (ADR-0105 / ROCKY-FE-001) deliberately left out:

- **Two divergent row-kebab implementations** — `RowActions` (`components/shared/row-actions.tsx`)
  and `RowActionMenu` (`components/shared/action-dialog.tsx`) — with inconsistent item ordering,
  labels, and iconography across ~11 table-column files. Violates ISO 9241-143 (consistency) and
  9241-110 §4.4 (self-descriptiveness).
- **A 29-item shadcn `Sidebar`** (`components/admin-shell.tsx`, `collapsible="icon"`) that hides
  text labels in collapsed mode, leaving icon-only navigation. Violates 9241-151 (web UI) and
  9241-110 §4.4: a user must *recall* what each icon means.

Already satisfied (do not re-litigate): skip-link + `<main>`/`<nav>` landmarks (F-06), global
`:focus-visible` ring (globals.css), destructive confirmation + sonner Undo on RBAC revoke.

Backend / client dependencies (ADR-0033 §D4): web navigation/routing **ADR-0039**; permission-aware
UI **ADR-0022**; web admin shell / DataTable **ADR-0017**; design-system primitives **UI Bot
(`@rocky/ui`)**; house standard **ADR-0033**; umbrella program **ADR-0105** (ROCKY-FE-001).
Benchmarks: repo `iso-9241-*` skills (110/12/143/151/161/171/210/410/420); visual tokens:
`DESIGN.vercel.md` (scoped subset).

## Decision

1. **One menu ergonomics standard, governed here.** `apps/web` navigation & menu surfaces (sidebar
   nav, row kebab menus, top user menu, command-palette linkage) are benchmarked against the
   `iso-9241-*` skills; the canonical control rows live in ROCKY-FE-001 (M-01…M-06).
2. **Six moves (M1–M6).** M1 labels never hidden (9241-110 §4.4 / 9241-151); M2 menu item state
   matrix — resting/hover/focus-visible/current/disabled, distinguishable beyond color
   (9241-161 §6 / 9241-12); M3 one canonical `RowMenu` replacing `RowActions`+`RowActionMenu` with
   an explicit `kind: navigation|action|destructive` and a real per-row label (9241-143 / 9241-110 §4.4 /
   9241-12); M4 destructive items through one path — `ActionDialog` `alert` + sonner Undo, reusing
   the RBAC revoke pattern (9241-110 §4.8 / 9241-143 §6.5); M5 keyboard-first navigation (9241-171 /
   9241-410/420); M6 workflow regroup + lean on the ⌘K command palette (9241-110 §4.2 / 9241-151).
3. **`DESIGN.vercel.md` is a visual-token reference, not a governing standard.** Harvest only the
   subset that applies to a dense admin app: active-state left-edge indicator bar (M2), destructive
   `error`/`error-soft`/`error-deep` color steps (M3/M4), `canvas-soft-2` dropdown surface + Level-5
   elevation (M2/M3), 44×44 px touch floor (M5). Explicitly exclude its marketing-only surfaces
   (mesh gradient, 100 px pill CTAs, hero stacking, "Ask AI" nav).
4. **Reuse, do not reimplement.** Compose on `@rocky/ui` (shadcn/Geist lineage) primitives; satisfy
   the `check:shadcn` guardian. No second design authority is introduced — ISO-9241-* stay the
   benchmark, `@rocky/ui` stays the primitive source.
5. **Scope.** `apps/web` only; `apps/mob` has a separate navigation model and is tracked elsewhere.
   Law = none new (ergonomics, not GDPR/MK-LPDP). 9241-500 (environments) out of scope.

## Consequences

### Positive

- Removes the two-kebab duplication; consistent, coded menu items across all admin tables.
- Icon-only collapse no longer hides meaning; keyboard operability is explicit.
- Single destructive-action path (confirm + Undo) reduces high-risk action errors.
- Visual tokens are sourced from an existing, reviewed system (Vercel/Geist) — not invented.

### Negative / Cost

- v2 (M1/M5/M6) restructures nav grouping + collapse behaviour — needs browser-verified acceptance.
- `RowMenu` migration touches ~11 column files; mechanical but broad.

### Neutral

- No new design-system authority; `@rocky/ui` and `check:shadcn` unchanged in principle.

## Implementation

- Owning Bot: **Admin Bot** (scope `apps/web/`) + **UI Bot** (scope `packages/ui/`, primitives),
  per the RobotFarm index and ADR-0033 §D5.
- RobotFarm pass: update ROCKY-FE-001 (add M-01…M-06 rows + ADR-0108 link); extend
  `apps/web/AGENTS.md` ergonomics note to cite ADR-0108; track build-out in the WORKORDER.
- Plan: `2026-07-19-menu-navigation-ergonomics` (Wave 1 T01–T04, Wave 2 T05–T07).

## Verification (Definition of Done)

```bash
pnpm check:adrs        # 108 ADRs conform (this one included)
pnpm check:md-links    # no broken links (incl. ROCKY-FE-001 <-> ADR-0108)
pnpm check:standards  # ROCKY-FE-001 carries ADR-0108 back-link; SoA single-source
# Browser-verified (admin session):
#   - collapsed sidebar still exposes item labels on focus/hover (M1)
#   - every menu item state visible beyond color; current page has accent+weight (M2)
#   - exactly one kebab component; destructive items show confirm + Undo (M3/M4)
#   - full keyboard path reaches every nav item + row action (M5)
```

## Anti-Patterns (do not repeat)

1. Do not make `DESIGN.vercel.md` the governing standard — it specifies look, not behaviour.
2. Do not ship a second kebab implementation; `RowMenu` is the one.
3. Do not fire a destructive mutation from a menu without confirm + Undo.
4. Do not hide nav labels by default; collapse is opt-in + peeks.

## Related ADRs

- **ADR-0105** — Frontend Conformity & UX Controls (umbrella program, ROCKY-FE-001).
- **ADR-0033** — ADR house standard; this ADR conforms to it.
- **ADR-0039** — web navigation / routing (menu surfaces live here).
- **ADR-0022** — permission-aware UI the menus consume.
- **ADR-0017** — web admin shell / DataTable (founding client ADR).
