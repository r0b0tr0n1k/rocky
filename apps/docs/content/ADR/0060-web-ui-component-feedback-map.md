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
## Canonical monorepo tRPC pattern

This is **not** an accidental convention — it is the standard way a tRPC
frontend is built inside a monorepo, and the repo already implements every
piece. Documented explicitly so future developers know it is intentional and
idiomatic, not incidental.

| Standard monorepo-tRPC piece | This repo |
| --- | --- |
| Shared **type-only** package | `@rocky/trpc` exports `AppRouter` (type) + `superjson` transformer + `createResultUnwrapper` |
| Generated `AppRouter` | `nestjs-trpc generate` → `packages/trpc/src/generated/server.ts` |
| Typed client (tRPC v11 + TanStack RQ) | `createTRPCContext<AppRouter>()` → `useTRPC()` fully typed; `trpc.x.queryOptions()` / `mutationOptions()` |
| Shared validation package | `@rocky/validators/api` imported by *both* server (router input) and client (form via `zodResolver`) |
| Shared transformer | `superjson` on `httpBatchLink` / `httpSubscriptionLink` and the server — `Date`/`BigInt` survive the wire |
| Error contract | domain `Result<E>` → `TRPCError`, typed through `AppRouter` |

### Why it is the idiom (not a deviation)
- **Single typed contract.** The server declares each router once; `AppRouter` infers input, output, *and* error types. The client is typed end-to-end with **no codegen step and no redeclared client types** — the source of truth is the router, not a generated client stub.
- **No validation drift.** The same `/api` Zod schema validates on the server (router `input`) and the client (form `zodResolver`). One schema, two sides (Diamond Seal / NoDrift).
- **Deployment wrinkle is orthogonal.** `trpc.ts` routes the browser → Next.js relative URL → rewrite proxy → API. That is a CORS/origin concern (the API is a separate NestJS server behind the Next gateway), **not** an architecture deviation.
- **Backend framework is a detail.** The API uses `nestjs-trpc` (NestJS) to *produce* `AppRouter`; the frontend consumption is 100% vanilla tRPC. The generator differs; the contract does not.

### Proof it is already real
`apps/web/app/(admin)/passports/page.tsx` exercises every seam: shared `issuePassportRequestSchema` + `PASSPORT_STATUS` + `PassportSummary` from `@rocky/validators`, types from `useTRPC()` (`AppRouter`), validation via `ActionDialog` → `useValidatedForm`, and the typed `TRPCError` via `notifyError`.


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


## Validation & tRPC data flow

**Reuse the shared schema; local/inlined Zod is fine for UI-only fields.** The backend router declares `@Mutation({ input: createXRequestSchema })`; that *same* schema lives in `@rocky/validators/api` — a **shared** package (the Diamond Seal), consumed by *both* backend and frontend, so it is not "the backend." Importing it makes **client validation === server contract** (NoDrift, ADR-0052) and is the preferred path. A frontend-local Zod is acceptable for concerns *outside* the backend contract (e.g. confirm-password, client-side transforms); you may even derive it from the tRPC data via `inferRouterInputs<AppRouter>`. But it must never be produced by importing backend internals. **The hard rule:** the web never imports `@rocky/database`, backend routers, or backend services — its only windows into the backend are `@rocky/validators` (schemas/enums) and `@rocky/trpc` (`AppRouter` types).

**The two seams — and nothing else:**
- **Types AND the error contract, with no Zod import.** `AppRouter` (from `@rocky/trpc`, generated from `packages/trpc/src/generated/server.ts`) *is* the contract. `inferRouterInputs<AppRouter>` / `inferRouterOutputs<AppRouter>` yield the exact procedure I/O types, **and the error shape — `TRPCError` (`code` + `message`) — is part of that same typed surface.** So the client knows both what to send and what failure looks like, end-to-end, with no codegen. (Not "for fun" — tRPC is the type-safe transport that makes the no-drift architecture real; `superjson` carries `Date`/`BigInt` across the wire.) The domain `Result<E>` → router maps `E` → `TRPCError` (via `@rocky/validators/errors` maps + `createResultUnwrapper`); the web catches that typed `TRPCError` and shows `notifyError`. **The `/errors` surface is the server-side map; the client receives the typed error, it does not redeclare it.**
- **Runtime validation — the `/api` surface only.** `@rocky/validators/api` (e.g. `issuePassportRequestSchema`, `PassportSummary`) is the *API Zod*, the sole validators surface for the frontend (bound via `useValidatedForm` → `zodResolver`). The rest of `@rocky/validators` (`rbac`, `events`, `utils`, Dumb Zod) is backend-internal — do not import it. (`/errors` is also a legit frontend surface, for the tRPC error maps consumed by `createResultUnwrapper`.)
- **Enum *choices*:** `@rocky/validators/enums` (e.g. `PASSPORT_STATUS`, `CORRECTION_STATUS`).
- **Hard rule:** the web never imports `@rocky/database`, backend routers, backend services, or non-surface `@rocky/validators` subpaths (`rbac` / `events` / `utils`).

### Canonical recipe (proven in `passports/page.tsx`)
```tsx
import { issuePassportRequestSchema, type AnimalSummary, type FarmSummary }
  from "@rocky/validators/api";
import { PASSPORT_STATUS, type passportStatusType } from "@rocky/validators/enums";
import { useTRPC } from "#lib/trpc";
import { ActionDialog } from "#components/shared/action-dialog";
import { ComboboxField } from "#components/shared/form-fields";

const trpc = useTRPC();
const issue = useMutation(trpc.passport.issueForAnimal.mutationOptions({
  onSuccess: () => { invalidate(); notifySuccess("Passport issued"); },
}));
// Dynamic FK choices from tRPC queries (not hardcoded):
const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
const animalOptions = (animals.data?.data ?? [] as AnimalSummary[]).map(a => ({ value: a.id, label: a.earTagNumber }));
// Static enum choices:
Object.values(PASSPORT_STATUS).map(s => <SelectItem value={s}>{s}</SelectItem>);

<ActionDialog schema={issuePassportRequestSchema} mutation={issue}
  fields={(form) => <ComboboxField control={form.control} name="animalId" label="Animal" options={animalOptions} />} />
```

`ActionDialog` internally calls `useValidatedForm(schema)` and submits to `mutation.mutate(values)` — schema + validation + tRPC mutation + overlay in one primitive.

### Modern UX tricks with the data
1. **Enum choices from constants** — derive `Select`/`Combobox`/`ToggleGroup` options from `@rocky/validators/enums` (`Object.values(STATUS)`); type-safe, zero drift.
2. **FK choices from tRPC queries** — `useQuery(trpc.x.list)` → map to `{value,label}` → `ComboboxField` (type-ahead). "Knowing the choices" comes from the server.
3. **Dependent options** — chain queries with `enabled: !!parentId` (pick farm → fetch its animals).
4. **Async uniqueness** — debounced tRPC query + `z.superRefine` advisory (server stays authoritative), e.g. `earTag.findByNumber`.
5. **Prefill edit forms** — `defaultValues` from `trpc.x.getById.useQuery()` output (the `XResponse` type).
6. **Optimistic + toast** — `mutationOptions({ onSuccess: () => { invalidate(); notifySuccess() } })` (ADR-0060 contract).
7. **Dates via superjson** — `DateField` emits a real `Date`; `z.date()` accepts; survives the wire (`transformer` from `@rocky/trpc/superjson`).
8. **Disable from server state** — disable a form + show `Alert` when a query says so (e.g. `farmHasOverdueBirths` blocks `movement`).
9. **Type-safe errors** — router maps domain errors → `TRPCError`; client shows `notifyError`.

### Anti-Patterns
1. A *divergent* frontend Zod that shadows the backend contract (recreates drift — the Diamond Seal's NoDrift guard). Local UI-only Zod is fine; a second *source of truth* for server-shaped data is not.
2. Hardcoding enum option arrays instead of `@rocky/validators/enums`.
3. Importing `@rocky/database` from the web.
4. Not reusing `ActionDialog` / `ValidatedForm` (hand-rolling the overlay).
5. Mutations without `notifySuccess` / `notifyError` (ADR-0060 contract).
6. Importing non-surface `@rocky/validators` subpaths (`rbac`, `events`, `utils`, Dumb Zod) — only `/api`, `/enums`, `/errors` are the frontend surface.

## Related ADRs

- **ADR-0055** — parity charter; **ADR-0056 / 0057 / 0058 / 0059** — per-tier, per-domain maps.
- **ADR-0031** — IoT connectivity / geofence map decision.
- **ADR-0042** — permission UI; **ADR-0050 / 0051** — Permissions catalog + page matrix.
- **ADR-0032** — tRPC output schema / surface (the generated `AppRouter` contract).
- **ADR-0033** — frontend/mobile ADR standard.
