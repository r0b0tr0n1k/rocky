# Frontend Architecture — `@apps/web` Admin Shell

> Companion spec to [ADR-0017](adr/0017-frontend-architecture.md).
> Owner: Admin Bot. Consumes: `@rocky/trpc` (AppRouter), `@rocky/ui` (shadcn), `@rocky/validators` (Diamond Seal).

## 1. Current State (what we have)

- **20 tRPC routers / 149 procedures** — the full domain surface (animals, farms, ear tags,
  passports, movements, health, inspections, corrections, IoT, archive, RBAC, …).
- **Typed tRPC client already wired** in `apps/web/lib/trpc.ts`:
  `createTRPCReact<AppRouter>` + superjson + Next.js proxy gateway (`credentials: include`).
- **~90 `*RequestSchema`** in `@rocky/validators` (Diamond Seal, strict input contracts).
- **`list` procedures return `{ items, total, … }`** paginated (`animalListResponseSchema` etc.).
- **`@rocky/ui`** has 15 shadcn components (badge, button, card, dialog, dropdown-menu, ds,
  form, input, label, pagination, popover, select, sonner, table, textarea).
- **Missing:** no app shell, no data tables, no react-hook-form, no charts, no command
  palette, no real pages beyond a stub dashboard.

## 2. Goals / Non-Goals

**Goals**

- A beautiful, modern, accessible admin surface that *makes the Symbolic order visible*:
  every router procedure becomes a navigable, permission-gated UI element.
- End-to-end type safety: **client form validation === server contract** via reused Diamond Seal schemas.
- Reuse, don't reinvent: build on `@rocky/ui` shadcn primitives.

**Non-Goals**

- Re-implementing auth (use `@better-auth-ui` + existing `/auth/[...path]`).
- Mobile app (that is `apps/mob`, owned by Mobile Bot).
- Business logic in the frontend (all logic stays in domain services).

## 3. Tech Stack & Dependencies to Add

Catalog-first (per RobotFarm). Add to `packages/ui` (component deps) and `apps/web` (app deps):

| Package | Where | Why |
|---|---|---|
| `react-hook-form` | apps/web | Form state |
| `@hookform/resolvers` | apps/web | `zodResolver` (catalog: ^5.4.0) |
| `@tanstack/react-table` | both | `DataTable` (sorting/selection/pagination) |
| `date-fns` | both | Date formatting + range math |
| `recharts` | packages/ui | `chart` component (dashboards) |
| `cmdk` | packages/ui | `command` palette |
| `next-themes` | packages/ui + apps/web | Dark mode toggle |
| `lucide-react` | packages/ui | Icons (already catalog: 0.555.0) |

## 4. Missing shadcn Components (add to `@rocky/ui`)

Run the CLI inside `packages/ui` (its `components.json`; style `radix-nova`, icons `lucide`).

**Tier 1 — App shell & core UX (Phase 0):** `sidebar`, `sheet`, `command`, `avatar`,
`separator`, `skeleton`, `empty`, `tooltip`, `breadcrumb`

**Tier 2 — Data & forms (Phase 0/2):** `tabs`, `switch`, `checkbox`, `radio-group`,
`toggle-group`, `calendar`, `alert`, `progress`, `alert-dialog`, `combobox`, `hover-card`,
`scroll-area`, `accordion`, `collapsible`, `kbd`

**Tier 3 — Polish (Phase 4):** `chart`, `resizable`

## 5. App Shell

`apps/web/app/(admin)/layout.tsx` renders `<AdminShell>` (client):

- `Sidebar` + `SidebarProvider` + `SidebarTrigger` (nav groups per domain).
- `Header`: `Command` trigger (⌘K), `Avatar` user menu (`DropdownMenu`), theme toggle, `Breadcrumb`.
- Mobile: sidebar collapses into a `Sheet`.
- **Permission-gated nav**: nav items filtered by the session's permissions (from better-auth
  `customSession` enrichment). RBAC becomes a *visible* surface, not a server-only concern.

## 6. Routing (feature-first, per AGENTS.md)

- Route groups: `app/(admin)/dashboard/`, `app/(admin)/animals/`, `…/[id]/`, etc.
- Domain logic co-located: `apps/web/features/<domain>/{components,hooks,forms}/`.
- Shared UI: `apps/web/components/{layout,ui,state}/`; imports `@rocky/ui/components/*`.
- Auth stays at `app/auth/[...path]`; add middleware guard (redirect → `/auth`, gate by permission).

## 7. Type-Safe Data Layer

```tsx
// Full inference from AppRouter — input/output types flow automatically.
const { data } = trpc.animal.list.useQuery({ page: 1, pageSize: 20 });
const utils = trpc.useUtils();
const mutation = trpc.animal.create.useMutation({
  onSuccess: () => utils.animal.list.invalidate(),
});
```

## 8. Forms — Diamond Seal Reuse (the killer feature)

Reuse the **same** `@rocky/validators` `*RequestSchema` the API validates:

```tsx
import { createAnimalRequestSchema } from "@rocky/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const form = useForm({
  resolver: zodResolver(createAnimalRequestSchema), // === server contract
});
// z.infer<typeof createAnimalRequestSchema> drives form + mutation input
```

⚠️ **String-date contract:** schemas are `z.coerce.date<string>()` — the API expects an **ISO
string**, not a `Date`. The calendar stores a `Date`; on submit transform to ISO string before
`mutate(values)`. Build `<DateField>` that emits strings. (superjson does not bypass this — the
zod input type is `string`.)

Build a reusable `<ValidatedForm schema={…}>` wrapping RHF + `zodResolver` + shadcn `form`
(`Field`/`FieldLabel`/`FieldDescription` for errors). FK fields (farm/animal/subject) use
`combobox`.

## 9. DataTable Pattern

One reusable `DataTable<TData>` in `features/shared/`, built on `@tanstack/react-table` +
shadcn `table`/`button`/`dropdown-menu`/`pagination`/`select`:

- Server-side: table state → `<domain>ListRequestSchema` params → tRPC `list` → `{ items, total }`.
- Row actions via `DropdownMenu`; enum → `Badge` variant maps for statuses.
- Standardized states: `Skeleton` (loading), `Empty` (no data), `Alert` (error/permission-denied).

## 10. Dashboards & Aesthetics

- Stat `Card`s + `chart` (recharts) for registrations / inspections / health alerts.
- `radix-nova` + neutral tokens; semantic colors only (`bg-muted`, `text-muted-foreground`);
  `cn()`, `size-*`, `gap-*`, `data-icon` (lucide). `PageHeader` (title/desc/actions) +
  `Container`/`Section` wrappers. Optional `next-themes` dark mode.

## 11. Phased Roadmap

- **Phase 0 — Foundation:** add deps + all Tier 1/2 shadcn components to `@rocky/ui`; wire `next-themes`.
- **Phase 1 — Shell:** `AdminShell`, route groups, middleware guard, permission nav, state primitives, ⌘K.
- **Phase 2 — Reusable core:** `DataTable`, `ValidatedForm`, `DateField`, `Combobox`.
- **Phase 3 — Domain pages:** Dashboard → Animals → Farms/EarTags/Passports/Movements → Health →
  Inspections/Corrections → IoT/Archive/Notifications → Admin (Users/RBAC/Orgs/Subjects/Documents/VS).
- **Phase 4 — Polish:** keyboard shortcuts, responsive, a11y, empty/error coverage, smoke pass.

## 12. Open Questions

- Should dashboards pull from dedicated aggregate procedures or derive from `list` counts?
- Do we want server components (RSC) streaming initial data, or keep everything client + React Query?
