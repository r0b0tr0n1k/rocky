# Frontend Architecture — `@apps/web` Admin Shell

> Companion spec to [ADR-0017](adr/0017-frontend-architecture.md).
> Owner: Admin Bot. Consumes: `@rocky/trpc` (AppRouter), `@rocky/ui` (shadcn), `@rocky/validators` (Diamond Seal).
> Last updated: 2026-07-08 — reconciled with the built code (the original was a pre-implementation spec and had drifted).

## 0. TL;DR — Where We Actually Are

- **App shell, auth, form infrastructure, data table, and permission-gated nav are ALL BUILT.** `tsc --noEmit` passes clean.
- **12 of 19 routes are implemented:** `/dashboard`, `/animals`, `/movements`, `/inspections`, `/corrections`, `/farms`, `/users`, `/devices`, `/organizations`, `/subjects`, `/passports`, and `/archive` (list + issue + seize/reprint actions).
- **7 routes have no page yet** (7 fully-backed — see §13), (list + create + usually getById/update + domain mutations).
- **3 routes are "symptoms"** — the nav link exists but the backend is missing or partial (see §13).
- The original spec's *counts* were prophetic (20 routers / 149 procedures / ~90 request schemas are all accurate), but its *shapes* were wrong (`{data,total}` not `{items,total}`; `DateField` emits `Date` not ISO string; list input is `limit/offset` not `page/pageSize`; `ValidatedForm` takes a `form` not a `schema`).

## 1. Current State (what we have — verified against code)

- **20 tRPC routers / 149 procedures** — the full domain surface, exposed via the generated
  `AppRouter`. Two generated mirrors exist:
  - `packages/trpc/src/generated/server.ts` (the canonical transport type, consumed by mobile + API).
  - `apps/web/lib/server.ts` (the web client's local mirror; `apps/web/lib/trpc.ts` builds the
    client via `createTRPCContext<AppRouter>()` → `{ TRPCProvider, useTRPC, useTRPCClient }`,
    importing `AppRouter` from `./server.js`). The Next.js `<TRPCProvider>` lives in
    `components/trpc-provider.tsx`.
- **92 `*RequestSchema`** in `@rocky/validators/api` (Diamond Seal strict input contracts) + **56
  response/summary list schemas** (`*ResponseSchema`, `*SummarySchema`, `*ListResponseSchema`).
- **`list` procedures return `{ data, total, limit, offset }`** — paginated. (The original spec
  said `{ items, total }`; that was wrong. The built `DataTable` reads `.data` and `.total`.)
- **`@rocky/ui` has 43 shadcn components** (the original said 15). Includes everything needed:
  `sidebar`, `sheet`, `command`, `tabs`, `card`, `dialog`, `alert`, `alert-dialog`, `combobox`,
  `calendar`, `table`, `badge`, `pagination`, `skeleton`, `empty`, `form`, `select`, `switch`,
  `checkbox`, `input`, `textarea`, `popover`, `tooltip`, `sonner`, `chart` (recharts), …
- **Built infrastructure (all present):**
  - `app/(admin)/layout.tsx` → `<AdminShell>`: `Sidebar` + permission-gated nav, `Command` palette
    (⌘K), `Avatar` user menu, theme toggle, mobile `Sheet`. Nav defined in `lib/nav-config.ts`
    (`NavItem` with `permission`, filtered by `filterNavByPermissions(sections, permissions)`).
  - `components/shared/data-table.tsx` — generic `DataTable<TData>` (tanstack-table, manual
    sort/pagination, `Skeleton`/`Empty` states).
  - `components/shared/validated-form.tsx` + `lib/use-validated-form.ts` — RHF + `zodResolver`
    bound to Diamond Seal schemas.
  - `components/shared/form-fields.tsx` — `TextField`, `TextareaField`, `NumberField`,
    `SelectField`, `CheckboxField`, `SwitchField`, `DateField`, `ComboboxField`.
  - `components/shared/page-header.tsx`, `status-badge.tsx`; `lib/options.ts` (`enumToOptions`).
  - `/dashboard` (nav card grid + recent animals) and `/animals` (list + `/new` + `/[id]/edit`).

## 2. Goals / Non-Goals

**Goals**

- A beautiful, modern, accessible admin surface that *makes the Symbolic order visible*: every
  router procedure becomes a navigable, permission-gated UI element.
- End-to-end type safety: **client form validation === server contract** via reused Diamond Seal schemas.
- Reuse, don't reinvent: build on `@rocky/ui` shadcn primitives.

**Non-Goals**

- Re-implementing auth (use `@better-auth` + existing `app/auth/[...path]` catch-all).
- Mobile app (that is `apps/mob`, owned by Mobile Bot).
- Business logic in the frontend (all logic stays in domain services).

## 3. Tech Stack (all already added — Phase 0 complete)

| Package | Where | Why | Status |
|---|---|---|---|
| `react-hook-form` | apps/web | Form state | ✅ added |
| `@hookform/resolvers` | apps/web | `zodResolver` | ✅ added |
| `@tanstack/react-table` | apps/web | `DataTable` | ✅ added |
| `date-fns` | apps/web | Date formatting | ✅ added |
| `recharts` | packages/ui | `chart` component | ✅ added |
| `cmdk` | packages/ui | `command` palette | ✅ added |
| `next-themes` | packages/ui + apps/web | Dark mode | ✅ added |
| `lucide-react` | packages/ui | Icons | ✅ added |

## 4. shadcn Components — DONE (43 installed)

All three Tiers from the original plan are now present in `@rocky/ui`. **Do not re-add.** If a
future page needs a primitive not in the 43, run the CLI inside `packages/ui` (its `components.json`;
style `radix-nova`, icons `lucide`); the web app imports them via the `@rocky/ui/components` alias.

## 5. App Shell — BUILT

`app/(admin)/layout.tsx` renders `<AdminShell>` (client) — see `components/admin-shell.tsx`:

- `Sidebar` + `SidebarProvider` + `SidebarTrigger`; nav groups per domain from `lib/nav-config.ts`.
- `Header`: `Command` trigger (⌘K), `Avatar` user menu (`DropdownMenu`), theme toggle, `Breadcrumb`.
- Mobile: sidebar collapses into a `Sheet`.
- **Permission-gated nav**: `filterNavByPermissions(navSections, session.permissions)` — RBAC is a
  *visible* surface, not server-only. All 19 nav items (incl. the 3 partial-backend routes) are
  already declared in `lib/nav-config.ts` with icons + required permissions.

## 6. Routing (actual convention — differs from original plan)

The original plan proposed `apps/web/features/<domain>/`. The built code instead uses:

- **Pages:** `app/(admin)/<domain>/page.tsx`, `app/(admin)/<domain>/new/page.tsx`,
  `app/(admin)/<domain>/[id]/edit/page.tsx`.
- **Domain components:** `components/<domain>/` (e.g. `components/animals/columns.tsx`,
  `animal-create-form.tsx`, `animal-edit-form.tsx`).
- **Shared UI:** `components/shared/`; imports `@rocky/ui/components/*`.
- **Imports inside `app/(admin)`** use the `#components`, `#lib`, `#/*` path aliases (see
  `apps/web/tsconfig.json`), NOT `@/`. Example: `import { DataTable } from "#components/shared/data-table"`.
- Auth stays at `app/auth/[...path]`; middleware guard lives in `apps/web/proxy.ts` + root config.

## 7. Type-Safe Data Layer

```tsx
// New TanStack React Query integration (tRPC v11 recommended).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";

const trpc = useTRPC();
const queryClient = useQueryClient();

// Queries: useQuery(trpc.<router>.<proc>.queryOptions(input, opts?))
const listQuery = useQuery(trpc.animal.list.queryOptions({
  limit: 20,
  offset: page * 20,
  sortBy: sort?.id as SortKey,   // SortKey = typeof SORT_ANIMAL_BY[...]
  sortOrder: sort?.desc ? "desc" : "asc",
}));
const rows = (listQuery.data?.data ?? []) as AnimalSummary[]; // NOTE: .data, not .items
const total = listQuery.data?.total ?? 0;

// Mutations: useMutation(trpc.<router>.<proc>.mutationOptions(opts?))
const mutation = useMutation(trpc.animal.create.mutationOptions({
  onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.animal.list.queryKey() }),
}));
// call: mutation.mutate(input); pending state: mutation.isPending
```

**List input shape is `{ limit, offset, sortBy?, sortOrder? }`** — NOT `{ page, pageSize }`.
`sortBy` must be a value from a `SORT_BY_*` enum (e.g. `SORT_ANIMAL_BY`, `SORT_BY_FARM`,
`SORT_BY_MOVEMENT`, `SORT_BY_EARTAG`, `SORT_BY_USER` from `@rocky/validators/enums`).

## 8. Forms — Diamond Seal Reuse (the killer feature, BUILT)

Reuse the **same** `@rocky/validators` `*RequestSchema` the API validates:

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAnimalRequestSchema } from "@rocky/validators/api";
import { useValidatedForm } from "#lib/use-validated-form";
import { ValidatedForm } from "#components/shared/validated-form";
import { SelectField, DateField, ComboboxField, TextField } from "#components/shared/form-fields";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { ANIMAL_STATUS, SEX, STATE_CODE } from "@rocky/validators/enums";

export function AnimalCreateForm() {
  const form = useValidatedForm(createAnimalRequestSchema, {
    defaultValues: { stateCode: STATE_CODE.MK, isFirstTagging: false, imported: false },
  });
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const create = useMutation(trpc.animal.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.animal.list.queryKey() });
      router.push("/animals");
    },
  }));

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(v) => create.mutate(v)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField control={form.control} name="stateCode" label="State code"
          options={enumToOptions(Object.values(STATE_CODE))} />
        <SelectField control={form.control} name="sex" label="Sex"
          options={enumToOptions(Object.values(SEX))} />
        <DateField control={form.control} name="birthDate" label="Birth date" />
        <ComboboxField control={form.control} name="currentFarmId" label="Current farm"
          placeholder="Search farms…" options={farmOptions} />
      </div>
    </ValidatedForm>
  );
}
```

- `useValidatedForm(schema, { defaultValues, mode? })` returns a `UseFormReturn<T>` typed to the
  schema's input. **Pass that `form` to `<ValidatedForm form={…}>`** — there is no `schema` prop
  (the original spec's `<ValidatedForm schema={…}>` was wrong).
- `ValidatedForm` props: `form`, `onValid(values)`, `submitting?`, `submitText?`, `children`.
- Enum → options: `enumToOptions(Object.values(ANIMAL_STATUS))` (`lib/options.ts`).
- Data fetching uses the **`@trpc/tanstack-react-query`** integration (tRPC v11 recommended):
  `const trpc = useTRPC();` then `useQuery(trpc.<router>.<proc>.queryOptions(input))` and
  `useMutation(trpc.<router>.<proc>.mutationOptions(opts))`. Invalidate cache via
  `queryClient.invalidateQueries({ queryKey: trpc.<router>.<proc>.queryKey() })`.
- `submitting` maps to `mutation.isPending`; call `mutation.mutate(values)` in `onValid`.
- FK fields use `ComboboxField` (value is a uuid string; clearing sets `undefined`).

**⚠️ Date contract — CORRECTED.** The original spec claimed schemas expect an ISO **string** and
that `<DateField>` must transform to a string before `mutate`. That is **obsolete**. The built
`DateField` **emits a `Date` object**; superjson round-trips it across the wire, satisfying both
`z.date()` inputs and `z.coerce.date<string>()` inputs (coercion passes a `Date` through). Do NOT
stringify dates in the form layer.

**LAW XI — enum provenance.** Frontend imports dictionaries + zod enums from
`@rocky/validators/enums` (barrel), **never** from `@rocky/database`. The barrel re-exports the
`_VALUES` constants (`ANIMAL_STATUS`, `FARM_TYPE`, `SORT_BY_FARM`…) and the `*Schema` zod validators
from `enums/domain.ts`. Source of truth for the constants is `packages/@rocky/database/constants`.

## 9. DataTable Pattern — BUILT

One reusable `DataTable<TData>` in `components/shared/data-table.tsx`, built on
`@tanstack/react-table` + shadcn `table`/`button`/`pagination`/`skeleton`/`empty`:

- Server-side: table state → `<domain>ListRequestSchema` params (`limit`/`offset`/`sortBy`/`sortOrder`)
  → tRPC `list` → `{ data, total }`.
- `DataTableProps`: `columns`, `data`, `total`, `isLoading?`, `sort?` (`{id,desc}`), `onSortChange?`,
  `page?`, `pageSize?`, `onPageChange?`.
- Row actions via `DropdownMenu`; enum → `Badge` variant maps for statuses (see `status-badge.tsx`
  - per-domain `columns.tsx`, e.g. `components/animals/columns.tsx`).
- Standardized states: `Skeleton` (loading), `Empty` (no data), `Alert` (error/permission-denied).

## 10. Dashboards & Aesthetics

- `/dashboard` built: `Card` stat grid + recent animals `DataTable`. `chart` (recharts) component is
  available for registrations / inspections / health trends when aggregate procedures land.
- `radix-nova` + neutral tokens; semantic colors only (`bg-muted`, `text-muted-foreground`);
  `cn()`, `size-*`, `gap-*`, `data-icon` (lucide). `PageHeader` (title/desc/actions) per page.

## 11. Implementation Status — Route Table (19 routes)

| Section | Route | Backend (router.procedures) | Page |
|---|---|---|---|
| Overview | `/dashboard` | static | ✅ done |
| Livestock | `/animals` | animal.list/create/getById/update + findByTag | ✅ done (list+new+edit) |
| Livestock | `/movements` | movement.list/create/getById + recordDeath/declarePasture/declareAlpine/returnFromAlpine/recordSlaughter/importEU/importThirdCountry/exportAnimal/recordMarket* (**NO `update`**) | ✅ done (list+new+detail view) |
| Livestock | `/passports` | passport.list/issueForAnimal/shipToVs/deliverToKeeper/seize/reprint | ✅ done (list + issue + seize/reprint) |
| Livestock | `/ear-tags` | earTag.list/listOrders/createOrder/transitionStatus/cancelOrder/… (tags **and** orders) | ✅ done (tabbed hub: tags·orders·types) |
| Health | `/health` | health.listDiseases/listVaccines/listVaccinations/listTreatments/listLabTests/listBatches + record*+ create* | ✅ done (tabbed hub: diseases·vaccines·batches·vaccinations·treatments·lab tests) |
| Inspections | `/inspections` | inspection.list/create/schedule/complete/printForm/listRiskAnalyses/runRiskAnalysis | ✅ done (list+new+detail view) |
| Inspections | `/corrections` | correction.list/create/review/resolve/escalate/reject | ✅ done (list+new+actions) |
| Infrastructure | `/farms` | farm.list/create/getById/update + farmBook.* | ✅ done (list+new+edit) |
| Infrastructure | `/organizations` | organization.list/listByType/create | ✅ done (list+new) |
| Infrastructure | `/subjects` | subject.search/create/update/bindToFarm/unbindFromFarm | ✅ done (search+new+edit) |
| Infrastructure | `/devices` | device.list/create/update/assignUser/recordSync/… | ✅ done (list+new+edit) |
| Infrastructure | `/iot` | iot.listDevices/listReadings/listGeofences/listGeofenceEvents + register/ingest/create/log | ✅ done (tabbed hub: devices·readings·geofences·events) |
| Administration | `/notifications` | notification.unreadCount/send/markAsRead (**NO `list`**) | ✅ done (send + unread-count + mark-read; no inbox list) |
| Administration | `/archive` | archive.list/listExpired/create/markArchived/markDestroyed/archiveInspectionForm | ✅ done (list+new+detail view) |
| Administration | `/documents` | document.generate/listTypes (**NO `list`**) | ✅ done (generate + types list; no archive list) |
| Administration | `/rbac` | rbac.listRoles/getRole/listPermissions/assignRole/revokeRole | ✅ done (roles + permissions + assign/revoke) |
| Administration | `/users` | user.list/create/getById/update | ✅ done (list+new+edit) |
| Administration | `/audit` | audit.list (read-only) | ✅ done (read-only list w/ action filter) |

**Out-of-nav routers (wire into detail views later, not top-level pages):** `vsAssignment`,
`vsContract` (fold into Farm/Subject detail pages).

## 12. Phased Roadmap — Actual Progress

- **Phase 0 — Foundation:** ✅ done (deps + all 43 shadcn components + `next-themes`).
- **Phase 1 — Shell:** ✅ done (`AdminShell`, route groups, permission nav, ⌘K, theme).
- **Phase 2 — Reusable core:** ✅ done (`DataTable`, `ValidatedForm`, `DateField`, `Combobox`, form-fields).
- **Phase 3 — Domain pages:** ✅ done. `/dashboard` ✅, `/animals` ✅, `/movements` ✅ (list + new + read-only detail — see §13.4), `/inspections` ✅ (list + new + detail w/ schedule·complete·print actions), `/corrections` ✅ (list + new + review·resolve·escalate dialogs), `/archive` ✅ (list + new + detail w/ mark-archived·mark-destroyed actions), `/health` ✅ (tabbed hub: 6 sub-entities w/ create·record dialogs), `/iot` ✅ (tabbed hub: devices·readings·geofences·events w/ register·ingest·create·log dialogs), `/ear-tags` ✅ (tabbed hub: tags·orders·types w/ create·transition·cancel dialogs), `/notifications` ✅ (send + unread-count + mark-read), `/documents` ✅ (generate + types list), `/rbac` ✅ (roles + permissions + assign/revoke), `/audit` ✅ (read-only list w/ action filter). **All 19 routes implemented.**
- **Phase 4 — Polish:** ⏳ keyboard shortcuts, responsive, a11y, empty/error coverage, smoke pass.

## 13. Known Gaps / Contradictions (the Real breaking through)

1. **`/audit` is implemented.** `audit.list` exists in `AppRouter` (ADR-0007) — the `/audit` page is a read-only list with an action filter. (Earlier drafts claimed no router existed; that was stale.)
2. **`/notifications` has no `list` procedure.** `notification` router exposes `unreadCount`, `send`,
   `markAsRead` — but `notificationListRequestSchema`/`notificationListResponseSchema` are never wired
   to a procedure. The page is built (send + unread-count + mark-read panel); a full inbox list
   requires adding `notification.list` to the router.
3. **`/documents` has no `list` procedure.** `document` router exposes `generate` + `listTypes` only.
   The page is built (generator UI + types list); an archive view needs a `document.list` procedure.
4. **`/movements` has no `update` procedure.** `movement` router exposes `getById`, `list`, `create`, and the specialized rule mutations (`recordDeath`, `declarePasture`, `declareAlpine`, `returnFromAlpine`, `recordSlaughter`, `importEU`, `importThirdCountry`, `exportAnimal`, `recordMarket*`) — but no `movement.update`. The `[id]/edit` route is therefore a **read-only detail view** (via `getById`); a true edit requires adding `movement.update` to the router plus an `updateMovementRequestSchema`.

## 14. Open Questions — Resolved

- **RSC vs client+React Query?** → Kept **client + React Query** throughout (`"use client"` pages,
  `useQuery`/`useMutation`). No RSC data streaming.
- **Dashboards from aggregate procedures or list counts?** → Currently derive from `list` counts
  (recent-animals table). Dedicated aggregate procedures are a future enhancement; `chart` is ready.
