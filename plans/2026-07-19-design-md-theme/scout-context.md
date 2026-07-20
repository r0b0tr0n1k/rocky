# Scout Context — DESIGN.md → Docs Theme Convention

> Compiled directly from repository reconnaissance (the `scout` subagent could not
> persist to `.pi/` — that path is write-protected in this session). Citation-rich;
> paths + line numbers included.

## 1. File-path inventory

**DESIGN.md family (repo root, 7 files, `@google/design.md` front-matter format):**

- `DESIGN.sentry.md` (read fully) — violet-midnight + electric-lime design system.
- `DESIGN.wise.md` (read head) — Wise fintech; SAME schema, but token scales differ (`rounded: none/sm/md/lg/xl/pill/full`, `spacing: xxs..3xl`).
- `DESIGN.vercel.md` — cited by ADR-0108 as "visual-token reference, not a governing standard".
- `DESIGN.opencode.md`, `DESIGN.clay.md`, `DESIGN.posthog.md`, `DESIGN.neobrutalsm.md` — same family.

**Docs theme wiring (`apps/docs`):**

- `app/layout.tsx` — `nextra-theme-docs` `<Layout>`/`<Head color={hue:152 green}>`; loads **Rubik** via `next/font/google`; custom `Navbar` (rocky-goat.svg) / `Footer` / `Banner`.
- `app/mdx-components.tsx` — extends theme components + adds `Steps`/`Tabs`. No element overrides.
- `app/theme.css` — Tailwind v4 token layer (`:root`/`.dark` oklch tokens → `@theme inline` → `@layer base`). Carries `--sentry-violet` / `--sentry-violet-deep` with comments citing `DESIGN.sentry.md`; explicit comment: *"Rocky green stays primary; violet only as a secondary accent (docs banner) — never as primary."*
- `app/globals.css` — also references `DESIGN.sentry.md` in a comment.
- `postcss.config.mjs` — `@tailwindcss/postcss` only. **Tailwind v4 CSS-first, no `tailwind.config.js`.**

**ADR process:**

- `apps/docs/content/ADR/` — 110 `.md` files, **NO `_meta.ts`** (Nextra auto-indexes by filename).
- `apps/docs/content/ADR/ADR-TEMPLATE.md` — required sections (ADR-0033).
- `scripts/check-adrs.mjs` — guardian enforcing ADR-0033.
- `apps/docs/content/_meta.ts` — top-level grouping; `ADR` listed as `'ADR': 'Decision Records (ADR)'`.

**Docs taxonomy (ADR-0052 / Diátaxis):** `ADR/`, `tutorials/`, `explanation/`, `how-to/`, `reference/`, `runbooks/`, `Standardization/`, `compliance/`.

- `apps/docs/content/how-to/index.mdx` — lists how-to guides (grouped). New page must be added here.
- `apps/docs/content/how-to/add-a-doc-page.mdx` — recipe for adding a page.

**Governance:**

- `apps/docs/AGENTS.md` — Docs Bot contract. Critical rule: repo-root source docs referenced by **inline-code path, never markdown links** (else `check:md-links` fails). Documents the `data-rc-*` hydration phantom = stale `.next` cache (delete cache, not code).
- `DESIGN.vercel.md` precedent: `apps/docs/content/ADR/0108-menu-navigation-ergonomics.md` cites it inline-code and states it is "a visual-token reference, not a governing standard."

## 2. DESIGN.md schema summary (`@google/design.md` format)

Front-matter YAML block with keys: `version`, `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, `components`. Component entries use token interpolation: `backgroundColor: "{colors.primary}"`, `typography: "{typography.button-md}"`, `rounded: "{rounded.md}"`, `padding: "{spacing.md} {spacing.lg}"`.

**Iteration Guide** (in DESIGN.sentry.md) references:

```
npx @google/design.md lint DESIGN.md
```

with checks: `broken-ref`, `contrast-ratio`, `orphaned-tokens`.

**Cross-file inconsistency (mapping gap):** token scale NAMES differ between files.

- Sentry: `rounded: xs/sm/md/lg/xl/xxl/full`; `spacing: xxs/xs/sm/md/lg/xl/xxl/section`.
- Wise: `rounded: none/sm/md/lg/xl/pill/full`; `spacing: xxs/xs/sm/md/lg/xl/2xl/3xl`.
A theme mapping cannot blindly rename; must be per-file and explicit.

## 3. Theme-token mapping gap

`DESIGN.md` → `theme.css` is currently **manual + partial**: only Sentry's violet tokens are mirrored as `--sentry-violet` / `--sentry-violet-deep`; the rest of Sentry's palette, all typography, spacing, and components are NOT in `theme.css`. There is **no automated transform**. The `@google/design.md lint` (which could catch `broken-ref`/`orphaned-tokens`) is **not installed**.

## 4. ADR / guardian constraints (hard)

From `scripts/check-adrs.mjs` (enforced in `pnpm ci:checks`):

1. H1 must be `# ADR-<nnnn>: <title>`; number matches filename.
2. Header table must declare: `Status`, `Date`, `Author`, `Supersedes`, `Superseded`.
3. `Status` ∈ {Proposed, Accepted, Deprecated, Superseded}.
4. Required sections: `## Context`, `## Decision`, `## Consequences`.
Plus `ADR-TEMPLATE.md` adds: Consequences (Positive/Negative/Neutral), Implementation (owning Bot + RobotFarm pass), Verification (runnable checks), Anti-Patterns, Related ADRs. Client-surface ADRs must cite ≥1 backend ADR.

**Filename rule:** `^\d{4}-.*\.md$` (4-digit). Repo uses a NON-sequential scheme — numbers up to 6059 exist (2700/2770/6059 seen), alongside 0108. New ADR needs an unused 4-digit number.

**`check:md-links`**: resolves every `[text](url)` against filesystem; rejects `../` escapes and links to files outside `content/`. ⇒ A how-to page MUST cite DESIGN files as **inline-code** (`` `DESIGN.sentry.md` ``), never as `[text](/DESIGN.sentry.md)`. Confirmed: zero internal markdown links to DESIGN files exist today.

**`check:standards`**: enforces governing-ADR back-links on `compliance/` + `Standardization/`. A DESIGN.md→theme ADR is a regular ADR, so this does not force back-links on it — but it must still pass `check:adrs` + `check:md-links`.

## 5. Recommended artifact locations

- **ADR**: `apps/docs/content/ADR/<nnnn>-design-md-theme-workflow.md` — establishes `DESIGN*.md` are *non-governing visual-token references* (codifying ADR-0108), the harvest→`theme.css` flow, the inline-code citation rule, and the lint/CI hook. Cite ADR-0052 + ADR-0108 + ADR-0033. Auto-indexed.
- **How-to**: `apps/docs/content/how-to/use-design-md-theme.mdx` — step-by-step author→harvest→apply→lint→validate. Add a bullet to `how-to/index.mdx`. Cite DESIGN files by inline-code only.
- **Optional CI hook**: add `@google/design.md` as a devDependency + a `lint:design` script, OR document the `npx` one-liner as manual.

## 6. RobotFarm / AGENTS.md pass

- `apps/docs/AGENTS.md` is the owning contract. Adding a new theme-workflow convention + how-to is an operational-procedure documentation change → **requires updating `apps/docs/AGENTS.md`** in the same commit. Add a "Design tokens (DESIGN.md)" subsection noting non-governing reference + harvest flow + inline-code citation rule, and reference the new how-to + ADR.
- Root `AGENTS.md` does NOT need changing.
- The mermaid how-to (prior turn) is separate; can be bundled or separate.

## 7. Open questions / risks for the planner

1. **Governance stance** (resolves earlier A/B/C): Recommend **B — non-governing visual reference** (consistent with ADR-0108 + `theme.css` comments). Full rebrand (A) needs its own ADR; scoped section (C) optional.
2. **Lint tooling**: install `@google/design.md` (adds dep + CI step) vs. document `npx` as manual. Lean: manual `npx` documented; install later if desired.
3. **Token-scale inconsistency**: mapping must be explicit per DESIGN file.
4. **Hydration warning**: real fix is `rm -rf apps/docs/.next` (stale antd-cache phantom per `docs/AGENTS.md`), not code edits. Note as a "do not edit layout.tsx" guardrail.
5. **Next ADR number**: pick an unused 4-digit; repo scheme is non-sequential.
6. **Scope**: (a) ADR, (b) how-to page, (c) `apps/docs/AGENTS.md` update, (d) optional `lint:design` script. Do NOT rebuild the whole theme.
