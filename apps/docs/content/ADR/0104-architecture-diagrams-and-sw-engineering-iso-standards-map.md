# ADR-0104: Architecture Diagrams & Software-Engineering ISO Standards Map

> Make Rocky's architecture and its ISO engineering-baseline explicit, in one governed place, using
> Mermaid C4 + UML rendered to committed PNGs and a curated standards map. Resolves the symptom
> that architecture lived only in code and in ADR prose, with no shared visual spine.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Rocky's architecture is real (apps + packages + domains) but previously only *implicit* — read from code
or reconstructed from individual ADRs. The ISMS/PIMS posture (ADR-0067) and the documentation
taxonomy (ADR-0052) both need a visual anchor, and the user directed that the broader
ISO/IEC **software-engineering** standards (SQuaRE 25010/25012, lifecycle 12207/15288,
architecture 42010, testing 29119, UML 19505, SysML 19514, BPMN 19510, application security
27034, cloud 22123, AI 42001/23894/22989, governance 38500/20000-1, risk 31000, quality
9001/90003) be referenced "here and there" — not only the security/privacy pair (27001/27701)
plus GDPR. This ADR establishes the governed home for both the diagrams and a software-engineering
ISO standards map.

Backend dependencies: documentation taxonomy **ADR-0052**; ADR house standard **ADR-0033**;
ISMS/PIMS roadmap **ADR-0067**.

## Decision

1. **One diagram set, Mermaid-sourced.** Author architecture as Mermaid (`.mmd`) source committed
   alongside rendered `.png` (white background). C4 uses `C4Context` / `C4Container` /
   `C4Component`; UML uses `flowchart` (use-case, activity — high-contrast, Unicode actors),
   `classDiagram` (authorization domain), and `zenuml` (RLS request sequence, for clean
   `if/else`/`try/catch`). Re-render with `mmdc -i <f>.mmd -o <f>.png -b white`.
2. **Location.** Diagrams live under `apps/docs/content/explanation/system-architecture/`
   (`index.mdx` + 6 `.mmd`); rendered PNGs live under
   `apps/docs/public/diagrams/system-architecture/` (Nextra serves `public/` at `/`). The
   landing `index.mdx` embeds each PNG as a numbered **Figure** with a caption, per ISO/IEC
   Directive Part 2, Annex A (figure + cross-reference discipline).
3. **Software-engineering ISO Standards Map.** A curated, facts-only reference doc at
   `apps/docs/content/Standardization/iso-software-engineering-standards-map.md` maps each
   supplied engineering standard to the Rocky layer it informs, with authoritative ISO links and a
   bibliography. It is a *map*, not a management-system claim.
4. **Link-checker knows `public/`.** `scripts/check-md-links.mjs` now resolves `/`-leading
   links against `apps/docs/public` (standard Next.js/Nextra static-asset convention), so the
   diagram embeds validate.

## Consequences

### Positive

- Architecture is now explicit, version-controlled, and reviewable — not reconstructed from code.
- The standards layer threads software-engineering ISOs "here and there" as directed, tied to a map.
- Figures are numbered/captioned per ISO/IEC Directive Part 2, Annex A.

### Negative / Cost

- Rendered PNGs must be regenerated when a `.mmd` changes (no live render in CI by default).
- Extra committed binary assets under `public/`.

### Neutral

- Mermaid has no native use-case/activity types; these are expressed as `flowchart` (documented).

## Implementation

- Owning Bot: **Docs Bot** (scope `apps/docs/`) per the RobotFarm index.
- RobotFarm pass: no new Bot description needed; update this ADR's Related list when new diagrams land.
- The `index.mdx` + `.mmd` + `.png` + standards map are already committed; this ADR records the
  governing decision (Accepted).

## Verification (Definition of Done)

```bash
ls apps/docs/content/explanation/system-architecture/index.mdx        # landing exists
ls apps/docs/content/explanation/system-architecture/*.mmd            # 6 sources
ls apps/docs/public/diagrams/system-architecture/*.png                # 7 renders
ls apps/docs/content/Standardization/iso-software-engineering-standards-map.md
pnpm check:adrs        # 97 ADRs conform (this one included)
pnpm check:md-links    # no broken links (incl. /diagrams/... via public/)
```

## Anti-Patterns (do not repeat)

1. Do not embed diagrams as code blocks only — commit the rendered PNG and a numbered Figure.
2. Do not reference `ADR-0104` before this file exists (it must be linkable).
3. Do not reproduce full standard text — link authoritative ISO sources instead.

## Related ADRs

- **ADR-0052** — documentation taxonomy (Diátaxis); this set is `explanation/`.
- **ADR-0033** — ADR house standard; this ADR conforms to it.
- **ADR-0067** — ISMS/PIMS posture roadmap; diagrams make its controls explicit.
- **ADR-0092 / ADR-0084** — code-backed controls surfaced in the C4 component + SoA.
