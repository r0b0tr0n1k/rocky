# ADR-0060: Web UI Component & Feedback Map

> The design contract for the Web Admin parity program (ADR-0055 / 0056–0059): which `@rocky/ui` primitives do the job, how to make it modern and pleasant, and the three signatures we must build. Per-domain specifics live in 0056–0059; this is the shared foundation.

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (RobotFarm) |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The arsenal is rich and already wired: **47 radix-based `@rocky/ui` primitives** (tailwind v4, `radix-nova` style, `lucide-react` icons) **plus** a mature web shared layer — `data-table`, `status-badge`, `row-actions`, `action-dialog`, `validated-form`, `form-fields`, `page-header`, `page-hero`, `command-palette`, `theme-provider` (dark mode). Mutation feedback already exists via `sonner` + `lib/notify.ts` (`notifySuccess` / `notifyError`).

The open question (per the critique): for each page we build, **which components do the job**, and what **feedback / notification / state** design should be represented? This ADR is the answer — the contract every Tier-0→2 page obeys.

## Decision — Cross-cutting design contract

Applies to **every** parity page:

| Concern | Mechanism (already in repo) |
| --- | --- |
| **Mutation feedback / notifications** | `sonner` toasts via `notifySuccess(msg)` / `notifyError(err)` after every `useMutation` |
| **Destructive confirm** | `alert-dialog` for `cancelOrder` / `unassign` / `markDestroyed` / `reject` / `unblock` |
| **Warnings (non-fatal)** | `alert` for retention-expiry, farm-lock overdue births, batch-expiry, terminal contract |
| **Empty / loading / error** | `empty` (no rows) · `skeleton` (loading) · error boundary + retry |
| **Permission gating** | `clientCan` (permissions-core) hides `row-actions` / `action-dialog`; disabled (not invisible) where context matters |
| **Forms** | `FieldGroup`+`Field`, `InputGroup` (search), `ToggleGroup` (2–5 options), `validated-form`+`form-fields` (Zod) |
| **Dark mode / search** | `theme-provider`+`theme-toggle` (wired) · `command-palette` (cmdk global search) |
| **Styling law** | semantic tokens (`bg-background`, `text-muted-foreground`), `gap-*`, `size-*`, `cn()`; no manual `dark:` / `z-index` |

### The modern, pleasant baseline (shadcn skill)

- `className` for layout only; never override component colors/typography.
- Forms: `FieldGroup`+`Field`, never `div`+`space-y-*`. Option sets (2–7) → `ToggleGroup`.
- Items always in their Group (`SelectItem`→`SelectGroup`, `CommandItem`→`CommandGroup`).
- Overlays need a `Title` (`DialogTitle`/`SheetTitle`; `sr-only` if hidden).
- Icons via `data-icon` + lucide objects — **no sizing classes** inside components.
- `Badge` not spans · `Empty` not custom divs · `Skeleton` not `animate-pulse` · `Separator` not `<hr>`.

## Decision — The three missing primitives

The set covers ~everything **except** three signatures our ADRs require. Build them as web-shared:

1. **`Timeline`** — `farmBook` ledger, `health` clinical record, `movement` lineage. Compose from `card` + `separator` + `badge` + `avatar`. *Owner: Admin Bot, Phase 1.*
2. **`Stepper`** — `earTag` 6-stage order, `vsContract` lifecycle. Compose from `badge` + `separator` + `card`. *Owner: Admin Bot, Phase 1.*
3. **`Map`** — `iot` geofence (GeoJSON). **Not in shadcn** → external lib decision deferred to **ADR-0031**. Until chosen, render `resizable` + a placeholder pane.

## Decision — Component-selection reference

| Need | Use |
| --- | --- |
| List / table | `data-table` (sort, paginate, row-select) |
| Detail / edit | `sheet` (large) · `dialog` (compact) |
| Status | `status-badge` (shared) + `badge` |
| KPI tiles | `stat-card` |
| Trends / streams | `chart` (recharts) · `progress` |
| Filters | `combobox` · `select` · `input-group` (search) |
| Grouping | `tabs` · `accordion` · `collapsible` |
| Confirm / warn | `alert-dialog` (destructive) · `alert` (warning) |
| Navigation | `sidebar` · `breadcrumb` · `command-palette` |
| Feedback | `sonner` (toasts) · `skeleton` · `empty` · `tooltip` · `hover-card` · `popover` |
| Forms | `field` / `form` / `validated-form` / `form-fields` / `input` / `textarea` / `switch` / `checkbox` / `radio-group` / `toggle-group` |
| Identity | `avatar` |

Per-domain component picks are in **ADR-0056** (Tier 0), **ADR-0057** (Tier 1 Lifecycle), **ADR-0058** (Tier 1 Operational), **ADR-0059** (Tier 2 Deepen).

## Consequences

### Positive

A single, enforced design contract → consistent, modern, accessible parity pages without reinventing primitives.

### Negative / Cost

Two small primitives (`Timeline`, `Stepper`) to build; `Map` blocked on ADR-0031.

### Neutral

None.

## Implementation

Owning Bot: **Admin Bot** (`apps/web`). `Timeline` + `Stepper` in `apps/web/components/shared/` (Phase 0/1). `Map` after ADR-0031 resolves. Every parity page imports from `@rocky/ui/components/*` + `#components/shared/*`.

## Verification

```bash
ls apps/web/components/shared/timeline.tsx apps/web/components/shared/stepper.tsx   # primitives exist
rg -n "notifySuccess|notifyError" apps/web/app/\(admin\)   # mutations fire toasts (ADR-0060 contract)
```

Acceptance: no page uses raw `div`+`space-y-*` forms or custom `Badge` spans; all mutations toast.

## Anti-Patterns

1. `div` + `space-y-*` for forms (use `FieldGroup`+`Field`).
2. Custom styled `<span>` for status (use `Badge`/`status-badge`).
3. `Dialog`/`Sheet` without a `Title`.
4. Raw color values (`bg-blue-500`) instead of semantic tokens.
5. Mutations without `notifySuccess`/`notifyError`.
6. Rebuilding `data-table` instead of composing it.
7. Treating `sync` as an editor (it is a read-only monitor — ADR-0056).

## Related ADRs

- **ADR-0055** — parity charter; **ADR-0056 / 0057 / 0058 / 0059** — per-tier, per-domain maps.
- **ADR-0031** — IoT connectivity / geofence map decision.
- **ADR-0042** — permission UI; **ADR-0050 / 0051** — Permissions catalog + page matrix.
- **ADR-0033** — frontend/mobile ADR standard.
