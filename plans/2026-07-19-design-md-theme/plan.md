# Plan — DESIGN.md → Docs Theme Convention (ADR-0109)

> Authoritative plan for the permanent convention. Scout context: `./scout-context.md`.

## Decision (resolves prior A/B/C)

**Option B — `DESIGN*.md` are non-governing visual-token references.** Codifies the stance
ADR-0108 already took for `DESIGN.vercel.md` ("a visual-token reference, not a governing
standard. Harvest only the [tokens].") across ALL seven design files. Rocky green (hue 152)
stays primary; a DESIGN accent is allowed only as a secondary accent (docs banner). The full
Sentry rebrand (Option A) is explicitly deferred to a separate future ADR.

## Deliverables (documentation / governance only — no theme rebuild)

1. **ADR** `apps/docs/content/ADR/0109-design-md-theme-workflow.md` — permanent DECISION.
2. **How-to** `apps/docs/content/how-to/use-design-md-theme.mdx` — the "do / change it" recipe.
3. **RobotFarm pass** — update `apps/docs/AGENTS.md` (repo-root source docs subsection + counts).
4. **Convenience script** — `lint:design` in `apps/docs/package.json`.
5. **Mermaid how-to** `apps/docs/content/how-to/use-mermaid-diagrams.mdx` (separate, low-risk).
6. Link both how-tos from `apps/docs/content/how-to/index.mdx`.

## File-by-file changes

- `content/ADR/0109-design-md-theme-workflow.md` — H1 `# ADR-0109: ...`; header table
  (Status/Date/Author/Supersedes/Superseded); sections Context/Decision/Consequences
  (+Pos/Neg/Neut)/Implementation/Verification/Anti-Patterns/Related ADRs. Cites ADR-0052,
  ADR-0033, ADR-0108. Includes a small mermaid flowchart (validated by eye; native mermaid on).
- `content/how-to/use-design-md-theme.mdx` — author → lint (`npx @google/design.md lint`) →
  harvest into `app/theme.css` `@theme` → apply via `layout.tsx`/`mdx-components.tsx` →
  validate (`pnpm check:md-links`) → cite-by-inline-code rule → change flow →
  hydration guardrail (`rm -rf apps/docs/.next`). DESIGN files cited by inline-code ONLY.
- `content/how-to/use-mermaid-diagrams.mdx` — native `@theguild/remark-mermaid` usage.
- `apps/docs/AGENTS.md` — add `DESIGN*.md` bullet to "Repo-root source documents"; fix
  stale `52/52` → `109/109`; simplify "(51 + this ADR)" count line.
- `apps/docs/package.json` — add `"lint:design": "npx @google/design.md lint 'DESIGN*.md'"`.
- `apps/docs/content/how-to/index.mdx` — add two bullets under "Operate the docs system".

## ADR skeleton (key points)

- **Context**: 7 `@google/design.md`-format files at root; no permanent convention; Sentry
  scaffold in `theme.css` hand-mirrors only `--sentry-violet*`; risk of rebrand drift or
  ad-hoc token copying.
- **Decision**: (1) non-governing reference, harvest only; (2) harvest→`theme.css` flow,
  green primary / accent-only; (3) inline-code citation (link fails `check:md-links`);
  (4) `npx @google/design.md lint`; (5) per-file token scales (Sentry `xxl/section`,
  Wise `2xl/3xl`) — no blind rename; (6) hydration = stale `.next`, not `layout.tsx`.
- **Consequences**: + documented / prevents drift / keeps green; − manual harvest, `npx`
  needs network; ± no change to `@rocky/ui`/Nextra.
- **Implementation**: owning Bot = Docs Bot; RobotFarm pass on `apps/docs/AGENTS.md`.
- **Verification**: `ls` ADR exists; `pnpm check:adrs` 109/109; `pnpm check:md-links` 0
  broken; `rg` confirms DESIGN cited inline-code in how-to.
- **Anti-Patterns**: don't govern; don't link DESIGN; don't rebrand primary; don't edit
  `layout.tsx`; don't assume uniform scales.
- **Related**: ADR-0052, ADR-0033, ADR-0108.

## Verification commands

```bash
pnpm --filter docs exec check:adrs        # expect: ✓ 109 ADRs conform to ADR-0033.
pnpm check:md-links                        # expect: 0 broken
pnpm --filter docs exec lint:design       # optional, best-effort (npx fetch)
```

## Premortem / risks

- **ADR H1 mismatch** → filename `0109-*` must equal H1 `ADR-0109:`. Kept in sync.
- **Missing header key** → all 5 keys present (`**Status**` etc.).
- **Markdown-linking a DESIGN file** → `check:md-links` fails. Mitigation: cite ONLY by
  inline-code (`` `DESIGN.sentry.md` ``). Verified: zero existing internal DESIGN links.
- **ADR number collision** → verified 0109 free (108 conforming ADRs today).
- **Broken internal links in new docs** → create all files BEFORE running `check:md-links`
  (the how-to/index/AGENTS links point at the new ADR+how-to which must exist first).
- **Mermaid render error at build** → keep flowchart minimal + valid; native mermaid on.
- **`npx @google/design.md` network** → script is best-effort (not in `ci:checks`); how-to
  documents the manual command.

## Todos (tag: design-md-theme)

1. Write ADR-0109 (all required sections, cites 0052/0033/0108, mermaid flowchart).
2. Write `use-design-md-theme.mdx` how-to (inline-code DESIGN citations only).
3. Write `use-mermaid-diagrams.mdx` how-to.
4. Update `apps/docs/AGENTS.md` (DESIGN bullet + counts).
5. Add `lint:design` script to `apps/docs/package.json`.
6. Link both how-tos from `how-to/index.mdx`.
7. Verify guardians green (`check:adrs` 109/109, `check:md-links` 0 broken).
