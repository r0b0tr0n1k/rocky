# ADR-0052: Documentation Architecture (Diátaxis + Audience)

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

## Context

The repository accumulated **51 ADRs** (decision records) plus a scattering of
explanation/doctrine prose (`offline-architecture`, `diamond-seal-audit`,
`result-monad-and-error-sovereignty`, `router-design`, `router-patterns`,
`TESTING_DOCTRINE`, `workorder`) — all flat in `apps/docs/content/`, with a
single onboarding tutorial (`get-started`). The ADR corpus was normalized to the
ADR-0033 house standard and closed (no redundant overlap, all grounded in
verified code). Two guardians (`check:adrs`, `check:md-links`) enforce the
decision corpus in `ci:checks`.

The symptom after closure: the docs over-document the **exception** (the
decision/cut — 51 ADRs) and the **why** (explanation prose), but have **no
genre separation** for the everyday work — zero `how-to`, `reference`, or
`tutorial` structure. The daily task (how to *do* the work) is repressed into
the Real, while the fascinating object (the ADR) is lavished upon.

## Decision
```mermaid
flowchart LR
  subgraph LRN[📘 Learn]
    TUT["Tutorials<br/>(guided lessons)"]
  end
  subgraph ARC[🏛️ Architecture]
    ADR["ADRs<br/>(decisions)"]
    EXP["Explanation<br/>(concepts)"]
  end
  subgraph OPS[🛠️ Build & Operate]
    HOW["How-To<br/>(task recipes)"]
    REF["Reference<br/>(catalogs)"]
    RUN["Runbooks<br/>(ops procedures)"]
  end
  subgraph PRJ[📂 Project]
    FLAT["Flat Prose<br/>(workorder, doctrine)"]
  end
  TUT --> HOW
  ADR --> EXP
  EXP -.-> HOW
  HOW --> RUN
  classDef learn fill:#98FB98,stroke:#333,stroke-width:2px,color:black
  classDef arch fill:#E6E6FA,stroke:#333,stroke-width:2px,color:darkblue
  classDef ops fill:#FFD700,stroke:#333,stroke-width:2px,color:black
  classDef proj fill:#FFB6C1,stroke:#DC143C,stroke-width:2px,color:black
  class TUT learn
  class ADR,EXP arch
  class HOW,REF,RUN ops
  class FLAT proj
```


Adopt the **Diátaxis** documentation taxonomy as the spine of `apps/docs/content/`,
with **ADR as a 5th "Decisions" section** (already existing). The four quadrants
plus Decisions:

| Section | Diátaxis quadrant | Audience | Repo folder |
|---|---|---|---|
| `tutorials/` | Tutorials (learning) | newcomer | ✅ created |
| `explanation/` | Explanation (understanding) | architect/reviewer | ✅ created (root prose linked) |
| `how-to/` | How-to (task) | practitioner | ✅ created (seeds) |
| `reference/` | Reference (facts) | lookup | ✅ created (TSDoc + catalogs) |
| `ADR/` | Decision records | architect/reviewer | ✅ existing, 51/51 |

- **Audience cross-cut** is realized through the root `_meta.ts` navbar
  (separators: *Learn / Architecture / Build & Operate / Project*) — Nextra's
  `type: 'separator'` + folder grouping, **not** duplicated content.
- **API Reference** is generated **deterministically** by
  `scripts/generate-api-reference.mjs` (Option D) from
  `apps/api/src/routers/*.router.ts` — listing every router, procedure
  (Query/Mutation) and its Zod input/output schema from `@rocky/validators`.
  This realizes the repo’s NoDrift ideology (docs *are* the types) **without**
  Nextra’s `TSDoc`, which is broken under Next 16 + Turbopack (its
  `next-mdx-import-source-file` virtual module is unresolvable — it broke
  `pnpm build`). The generator is wired into the docs `build` prebuild and
  committed as `reference/api-reference.mdx`.
- The existing **flat prose stays put** (no URL migration yet) to keep
  `check:md-links` green; `explanation/index.mdx` links to it as a temporary
  aggregate. A later move relocates each file into `explanation/`.

## Consequences

**Positive**
- Genre clarity: a reader knows *why* (ADR/explanation) vs *how* (how-to) vs
  *facts* (reference) vs *learn* (tutorials).
- Audience access without content duplication (navbar grouping only).
- The deterministic generator gives a real, always-fresh API surface
  (24 routers / 156 procedures, matching `nestjs-trpc generate`) with **zero**
  Turbopack/virtual-module dependency — closing the earlier "TSDoc is a
  fetish" critique by giving the surface an actual, buildable home.

**Negative / Costs**
- More files to maintain (5 new folders + seeds).
- Seed stubs are intentionally incomplete; they must be fleshed out as work
  happens (guarded by ADR-0033 D2 — every new doc is an asset, not drift).
- The API-reference generator is regex/AST-lite over the router sources, so it
  must be re-run when routers change; this is wired into the docs `build`
  prebuild and exposed as `pnpm gen:api-reference`, with the output committed
  as a fallback artifact.

## Implementation

- `apps/docs/content/{tutorials,explanation,how-to,reference,runbooks}/` created.
- Each folder has an `index.mdx` (`asIndexPage: true`) as a landing.
- `how-to/` seeds: `add-trpc-router`, `add-domain-service`, `add-zod-validator`,
  `run-db-migration`, `write-docs-guardian`.
- `reference/` seeds: `api-reference.mdx` (generated by
  `scripts/generate-api-reference.mjs`), `permissions-catalog`,
  `enums-catalog`, `error-codes`.
- `runbooks/` seeds: `db-recreate` (real procedure), `deploy`, `env-config`.
- Root `_meta.ts` rewritten with separators grouping the 5 sections + existing prose.
- `check:adrs` (now 52/52) and `check:md-links` (0 broken) remain green.

## Verification

- `pnpm check:adrs` → 52/52 conform (incl. this ADR).
- `pnpm check:md-links` → 0 broken (new files link only to existing pages).
- Build: `pnpm --filter docs build` renders the 5 new sections +
  generated `api-reference` page (regenerated in the docs `build` prebuild).

## Anti-Patterns

- **Don't write how-tos as ADRs** — a task recipe is not a decision record.
- **Don't duplicate ADR claims in explanation/how-to** — reference the ADR
  instead (keeps the decision corpus the single source of *why*).
- **Don’t use Nextra’s `TSDoc` under Turbopack** — its
  `next-mdx-import-source-file` virtual module is unresolvable and broke
  `pnpm build`. Use the deterministic `scripts/generate-api-reference.mjs`
  instead. (The Vercel/Nextra component is a fetish of the Big Other; our
  generated reference is the dialectically superior path.)
- **Don't migrate the flat prose without updating inbound links** — that
  re-breaks `check:md-links`.

## Related ADRs

- [ADR-0033](/ADR/0033-frontend-mobile-adr-standard) — the ADR house standard
  this taxonomy sits beside.
- [ADR-0011](/ADR/0011-diamond-seal-layer-boundaries) / [ADR-0018](/ADR/0018-api-validator-design) —
  the layer + validator boundaries the how-to seeds reference.
- [ADR-0043](/ADR/0043-push-background-sync-deeplink) / [ADR-0044](/ADR/0044-livestock-domain-feature) —
  client-surface work that belongs to `tutorials`/`how-to`.
