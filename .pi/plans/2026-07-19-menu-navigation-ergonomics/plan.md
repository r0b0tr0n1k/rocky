# Plan — Menu & Navigation Ergonomics (Rocky Web Admin)

- **Plan ID:** 2026-07-19-menu-navigation-ergonomics
- **Governing ADR:** ADR-0105 (Accepted) — this plan raises sub-ADR **ADR-0106**
- **Posture paper:** ROCKY-FE-001 `compliance/frontend-conformity.md`
- **Canonical SoA:** ROCKY-ISMS-001 `compliance/isms-policy.md`
- **Date:** 2026-07-19
- **Mode:** Draft for execution (sequential workers)
- **Benchmarks:** repo `iso-9241-*` skills (`.agents/skills/iso-software-skills/skills/iso-9241-{110,12,143,151,161,171,210,410,420}/`)
- **Visual reference:** `DESIGN.vercel.md` (Vercel/Geist lineage, scoped subset — visual tokens only, NON-governing)

---

## 1. Executive summary

ADR-0105 established ergonomics (ISO 9241 / WCAG 2.1 AA) as a first-class web-admin
workstream and closed the generic posture gaps (landmarks, skip-link, focus-visible,
high-risk-action Undo on RBAC). The **navigation & menu surfaces** were deliberately left
out of that pass. This plan closes them, benchmarked against the repo's `iso-9241-*` skills.

Two findings ground the work (verified in-tree, 2026-07-19):

1. **Two divergent kebab implementations** — `RowActions` (`components/shared/row-actions.tsx`)
   and `RowActionMenu` (`components/shared/action-dialog.tsx`) — with inconsistent
   item ordering, labels, and iconography across ~11 table-column files. (ISO 9241-143
   consistency; ISO 9241-110 §4.4 self-descriptiveness.)
2. **The 29-item shadcn `Sidebar`** (`components/admin-shell.tsx`, `collapsible="icon"`)
   hides text labels in collapsed mode, leaving icon-only navigation that fails
   self-descriptiveness for 10 sections. (ISO 9241-151 web UI; ISO 9241-110 §4.4.)

## 2. Current state (verified)

| Surface | File | State | Governing skill | Gap |
| --- | --- | --- | --- | --- |
| Sidebar nav | `components/admin-shell.tsx` | 29 items / ~10 sections, `collapsible="icon"` | 9241-151, 9241-110 §4.4 | Labels vanish when collapsed → non-self-descriptive |
| Sidebar item states | `packages/ui/.../sidebar.tsx` | `isActive` only | 9241-161 §6, 9241-12 | No explicit state matrix (rest/hover/focus/current/disabled) |
| Row kebab (nav) | `components/shared/row-actions.tsx` | icon-only trigger, `aria-label="Actions"` | 9241-110 §4.4, 9241-161 §6 | Generic label; no per-row meaning |
| Row kebab (actions) | `components/shared/action-dialog.tsx` | different impl from `RowActions` | 9241-143, 9241-110 §4.8 | Duplicated; inconsistent across pages |
| Top user menu | `components/admin-shell.tsx` | sign-out immediate | 9241-110 §4.7 | Low-risk; acceptable as-is |
| Command palette | `components/command-palette.tsx` | ⌘K deep-nav | 9241-151, 9241-110 §4.6 | Present; to be leaned on as primary deep-nav |

Already satisfied by earlier work (do **not** re-litigate): skip-link + `<main>`/`<nav>`
landmarks (F-06), global `:focus-visible` ring (globals.css), destructive confirmation
- sonner Undo on RBAC revoke (iso-7).

## 3. Scope & boundaries

- **In scope:** `apps/web` menu/navigation surfaces — sidebar nav, row kebab menus,
  top user menu, command-palette linkage, and the `@rocky/ui` primitives they consume
  (`sidebar.tsx`, `dropdown-menu.tsx`). `apps/mob` is OUT OF SCOPE (separate navigation
  model; tracked separately).
- **Law:** none new. This is ergonomics (ISO), not GDPR/MK-LPDP.
- **ISO/IEC:** benchmarked and strived toward (9241-110/12/143/151/161/171/210/410/420);
  **never claimed as certified conformity**, no certification mark.
- **9241-500 (environments):** OUT OF SCOPE (no physical workplace surface in web admin).

## 4. Guiding principles

1. Every menu item state must be distinguishable by **more than color alone** (9241-161 §6, 9241-12).
2. Labels are never hidden by default; collapse is an **opt-in, reversible user control** (9241-110 §4.4, §4.7).
3. **One** kebab implementation, with an explicit `kind` so coding/consistency is enforced in code (9241-143, 9241-12).
4. High-risk actions flow through **one** destructive path (confirm + Undo) — no bare mutation (9241-110 §4.8, 9241-143 §6.5).
5. Menus are **keyboard-first**; no mouse-only path (9241-171, 9241-410/420).

## 5. Design rules (the six moves)

- **M1 — Labels never hidden (9241-110 §4.4, 9241-151).** Default expanded labels; icon
  collapse is opt-in + exposes labels on hover/focus (peek), not permanently icon-only.
- **M2 — State matrix (9241-161 §6, 9241-12).** `resting / hover / focus-visible /
  current / disabled` each visually distinct via icon + weight + left-accent (current),
  not color alone.
- **M3 — One canonical `RowMenu` (9241-143, 9241-110 §4.4, 9241-12).** Replaces
  `RowActions` + `RowActionMenu`; `kind: "navigation" | "action" | "destructive"`,
  stable ordering (primary first), **real per-row label**, consistent iconography map
  (destructive → `AlertTriangle` + destructive variant).
- **M4 — Destructive via one path (9241-110 §4.8, 9241-143 §6.5).** `destructive` items
  use the existing `ActionDialog` `alert` + sonner Undo (iso-7) — unified, no exceptions.
- **M5 — Keyboard-first (9241-171, 9241-410/420).** Arrow-key traversal of sidebar + menus,
  `Escape` to close, focus restore; visible focus (global `:focus-visible` already present).
- **M6 — Suitability / load (9241-110 §4.2, 9241-151).** Regroup 29 items by *workflow*;
  lean on ⌘K palette as primary deep-nav; optional "Recent" + section collapse.

### 5.1 Visual reference — `DESIGN.vercel.md` (scoped subset, non-governing)

`DESIGN.vercel.md` is the Vercel/Geist visual-language spec our `@rocky/ui` (shadcn) already
descends from. It is a **visual token vocabulary, not an ergonomics authority** — it specifies
*look*, not keyboard/focus/error-tolerance behaviour (those stay with the ISO-9241-* skills).
Harvest only the subset that applies to a dense admin app:

- **Active-state indicator (M2):** "active state uses brand primary as a left-edge indicator
  bar" → the *more than color* distinguishability 9241-161 §6 demands.
- **Destructive color steps (M3/M4):** `error` (#ee0000) / `error-soft` (#f7d4d6) /
  `error-deep` (#c50000, pressed) → destructive item + pressed-state coding.
- **Dropdown surface + elevation (M2/M3):** `canvas-soft-2` (#f5f5f5) surface, Level-5 shadow
  for dropdown menus.
- **Touch-target floor (M5 / 9241-410):** 44 × 44 px minimum — already met by shadcn `size="icon"`.

**Explicitly OUT OF SCOPE** (marketing-surface only, alien to a gov admin shell): the mesh
brand gradient, 100 px pill marketing CTAs, hero stacking, and "Ask AI" nav CTA. Importing
those would be fetishistic — the symptom, not the cure.

## 6. Governance

- Raise **ADR-0106** (Menu & Navigation Ergonomics), Proposed → Accepted; it links from
  ROCKY-FE-001 (satisfies `check:standards` invariant a) and stays single-source (invariant b).
- ROCKY-FE-001 gains a **Menu & Navigation ergonomics** section + control rows M-01…M-06
  mapping each move to its ISO clause and current status.
- **Visual reference:** `DESIGN.vercel.md` is cited in ADR-0106 as the *visual token* source (scoped subset, §5.1) — ISO-9241-* skills remain the governing
  benchmark; `@rocky/ui` remains the primitive source (satisfies `check:shadcn`). No new design authority is introduced.
- RobotFarm pass on `apps/web/AGENTS.md`: extend the ADR-0105 ergonomics note to cite ADR-0106.
- `check:adrs`, `check:md-links`, `check:standards` remain green.

## 7. Waves

### Wave 1 — v1 (contained, high value)

- **T01** Raise ADR-0106 + ROCKY-FE-001 menu section (M-01…M-06).
- **T02** Menu item state matrix (M2) in `@rocky/ui` + apply to sidebar & dropdown items.
- **T03** Unified `RowMenu` (M3) replacing `RowActions` + `RowActionMenu`; adopt across columns.
- **T04** Route destructive items through Undo path (M4).

### Wave 2 — v2 (structural)

- **T05** Nav labels never-hidden default + collapse peek (M1).
- **T06** Keyboard-first navigation hardening (M5).
- **T07** Workflow regroup + "Recent" + lean on ⌘K (M6).
