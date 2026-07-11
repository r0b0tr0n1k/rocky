# ADR-0056: Web UI — Tier 0 (Presence)

> Tier 0 is *absence*: four backend routers with no web page at all. The design thesis — give each a presence that matches its **regulatory weight**, not a generic CRUD shell.

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (RobotFarm) |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Four backend routers have **zero web presence** (Tier 0 of ADR-0055). Two are core regulatory (the Veterinary Station workflow), one is a farm-record workflow, one is mobile-owned:

| Router | Procs | Regulatory weight |
| --- | --- | --- |
| `vsContract` | 5 | VS contracts are legally mandatory (CPC ↔ VS engagement) |
| `vsAssignment` | 6 | which Veterinarian is assigned to which farm |
| `farmBook` | 4 | the farm's chronological official record |
| `sync` | 2 | mobile offline sync — web needs *visibility only* |

Backend procedures (grounded in `api-reference.mdx`):

- `vsContract`: `getById`, `getBySubject`, `getByRegion`, `create`, `updateStatus`.
- `vsAssignment`: `getById`, `getByFarm`, `getActiveByFarm`, `getByContract`, `assign`, `unassign`.
- `farmBook`: `getById`, `getByFarmId`, `create`, `updateStatus`.
- `sync`: `syncDownload`, `syncUpload`.

## Decision

Build each as a focused presence page composed from the Phase-0 `<EntityPage>` / `<ResourceForm>` scaffold (ADR-0055 §Implementation), Zod-validated via `@rocky/validators`, RBAC-gated via `@Policy` (ADR-0042). Each gets a **distinctive design signature** grounded in its subject — the one memorable element, everything else quiet:

### `vsContract` — Contract registry + lifecycle badge

Table of contracts (filter by region / subject) + detail drawer. `create` opens a validated form; `updateStatus` drives a **status badge** (ACTIVE / EXPIRED / TERMINATED) on a small lifecycle stepper. *Signature: the contract lifecycle badge.*

### `vsAssignment` — Farm→VS assignment board

Farm cards showing the assigned Veterinarian(s); active assignments highlighted. `assign` / `unassign` are permission-gated actions. *Signature: the farm→VS matrix board.*

### `farmBook` — Farm-book ledger timeline

A farm's official record as a **vertical status timeline** of `create` + `updateStatus` transitions — not a flat table (sequence *is* the information). *Signature: the ledger timeline.*

### `sync` — Read-only pulse monitor (NOT an editor)

Mobile owns sync. The web shows a **pulse panel**: last download / upload, pending queue depth, device sync health. No create/edit — explicitly a monitor. *Signature: the live pulse panel.*

## Consequences

### Positive

The regulatory VS workflow + farm book become administrable from the back office; sync finally gets visibility.

### Negative / Cost

Four new pages. `sync` is deliberately read-only (expect "why can't I edit?" — answer: mobile owns it).

### Neutral

None.

## Implementation

Owning Bot: **Admin Bot** (`apps/web`). **Phase 1** of ADR-0055. Depends on the Phase-0 scaffold. `sync` monitor reads `syncDownload` / `syncUpload` responses only — no mutation forms.

## Verification

```bash
ls apps/web/app/\(admin\)/vs-contracts/page.tsx apps/web/app/\(admin\)/vs-assignments/page.tsx \
   apps/web/app/\(admin\)/farm-book/page.tsx apps/web/app/\(admin\)/sync/page.tsx
rg -n "trpc.(vsContract|vsAssignment|farmBook|sync)" apps/web   # all four now invoked
```

Acceptance: all four routers invoked by web; `sync` page is read-only (no mutation forms).

## Anti-Patterns

1. Generic CRUD shell for `sync` — it is a *monitor*, not an editor.
2. Flat table for `farmBook` — it is a *timeline*; order carries meaning.
3. `vsAssignment` shown without the farm→VS relationship made visible.


## Component & feedback map

Cross-cutting design contract (feedback/notifications, permission gating, empty/loading, form law, dark mode, semantic tokens): **ADR-0060**.

| Domain | Distinctive components | Design / feedback note |
| --- | --- | --- |
| `farmBook` | `data-table`→`sheet`; **Timeline** (build, ADR-0060); `validated-form` | ledger sequence via Timeline; `notifySuccess` on create; `alert` on terminal status |
| `vsContract` | `data-table`+`combobox` filter; **Stepper** (build); `status-badge`; `stat-card`; `alert-dialog` | lifecycle badge + stepper; `alert-dialog` for TERMINATED |
| `vsAssignment` | farm `card` grid + `avatar`+`badge`; `combobox` assign; `alert-dialog` | `clientCan("vs:assign")` gates the action rail |
| `sync` | `stat-card`+`progress`+`chart`; **NO forms** | read-only monitor; `skeleton` while polling `syncDownload`/`syncUpload` |

## Related ADRs

- **ADR-0055** — parity charter (Tier 0, Phase 1).
- **ADR-0050** — contract sync; **ADR-0051** — page matrix.
- **ADR-0027** — farm/holder/subject (VS/VI split); **ADR-0030** — RuleSet (contract params).
- **ADR-0032** — tRPC surface; **ADR-0042** — permission UI.
