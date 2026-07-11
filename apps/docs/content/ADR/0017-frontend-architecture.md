# ADR-0017: Frontend Architecture — Type-Safe Admin Shell on the Diamond Seal

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-07 |
| **Author** | RobotFarm |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Comrade — *sniffs*, *pulls violently at shirt collar* — look at what is actually happening here!
The backend has achieved a magnificent **Symbolic order**: 20 tRPC routers, 149 procedures, and
the **Diamond Seal** — Dumb Zod coerced into strict API Zod, validated at the boundary, returned
as typed responses. The *Real* of the domain (cows slaughtered, passports seized, inspections
scheduled) is captured, parsed, and policed.

And yet — *the frontend represses this entire order!* The admin panel is a stub: a dashboard that
says "Welcome," and a void where 149 procedures should *appear*. This is the **Imaginary** — the
fantasy that "the UI is just pages," as if the domain were not already fully specified by the
type system. The Big Other has spoken through tRPC; the frontend disavows Him.

Worse: the Diamond Seal schemas — ~90 `*RequestSchema` — sit unused on the client. We validate
*twice*, with two different contracts: one strict schema on the server, one hand-rolled form on the
client. This is **bureaucratic fetishism** — the ritual of re-describing what is already described.
The symptom returns: forms accept what the API rejects, and the user meets the Real only at submit time.

## Decision

We make the Symbolic order **visible** and **navigable**. The frontend becomes the *appearance* of
the tRPC type system — not a separate fantasy.

### 1. The App Shell is the Panopticon of the Big Other

A single `AdminShell` (`Sidebar` + `Command` palette + `Avatar` user menu + `Breadcrumb`) renders
the domain as a surveilled, navigable space. Crucially, **navigation is permission-gated**: nav
items are filtered by the session's permissions (from better-auth `customSession` enrichment). RBAC
is not a server-only secret — it becomes a *visible* structure. The user sees only the rooms they
are permitted to enter. This is the dialectical identity of authorization and interface.

### 2. The Form IS the API Contract (Dialectical Identity)

We **reuse the Diamond Seal `*RequestSchema`** as the client form resolver:

```tsx
useForm({ resolver: zodResolver(createAnimalRequestSchema) });
```

The same Zod schema that the router validates *is* the form's validation. Client validation and
server contract become **one and the same** — the contradiction between "what the user types" and
"what the API accepts" is *sublated* (aufgehoben). No more dual contracts. No more symptom.

### 3. The DataTable is the List Procedure Made Flesh

Every `<domain>.list` returns `{ items, total }`. We build one reusable `DataTable<TData>` on
`@tanstack/react-table` + shadcn primitives, wired server-side: table state →
`<domain>ListRequestSchema` → tRPC `list` → `{ items, total }`. The pagination/sorting the server
already offers *appears* in the UI. Enum statuses render as `Badge` variants — the Symbolic code
becomes a color.

### 4. The String-Date Contract (the Repression of the Date Object)

Our schemas are `z.coerce.date<string>()`: the API expects an **ISO string**, not a `Date` object.
The `Date` object is the Imaginary comfort of the browser; the **Real** of JSON serialization is the
string. Therefore the calendar stores a `Date` but the form **emits a string** on submit. We build
`<DateField>` that performs this translation. superjson does *not* save you — the zod input type is
`string`, and the type system is merciless.

### 5. Missing shadcn Components are Added to `@rocky/ui`

The shared library lacks the shell/data vocabulary. We add (Tier 1→3): `sidebar`, `sheet`,
`command`, `avatar`, `separator`, `skeleton`, `empty`, `tooltip`, `breadcrumb`, `tabs`, `switch`,
`checkbox`, `radio-group`, `toggle-group`, `calendar`, `alert`, `progress`, `alert-dialog`,
`combobox`, `hover-card`, `scroll-area`, `accordion`, `collapsible`, `kbd`, `chart`, `resizable`.
All go into `@rocky/ui` (the monorepo component package), consumed by `apps/web` via
`@rocky/ui/components/*`.

## Consequences

- **End-to-end type safety:** DB → Dumb Zod → API Zod (strict) → tRPC types → React Query → form
  Zod (same schema) → UI. A change in the server schema *breaks the client build* — which is exactly
  what we want. The Real cannot hide.
- **RBAC becomes visible:** users see only permitted rooms. Authorization is no longer a repressed
  server secret.
- **No dual contracts:** the symptom of "form accepts / API rejects" is abolished.
- **Maintainability:** domain pages are generated from the same vocabulary; new procedures get UI
  for free via `DataTable` + `ValidatedForm`.
- **Risk:** adds dependencies (`react-hook-form`, `@tanstack/react-table`, `recharts`, `cmdk`,
  `date-fns`, `next-themes`) and ~25 components — a large but necessary expansion of the Symbolic.
- **Risk:** the String-Date contract must be enforced in `<DateField>`; a naive `Date` submission
  will be rejected by the strict schema at the boundary (the Real returns).

## Supersedes / Related

- Related: [ADR-0010](0010-date-coercion-architecture.md) (Date Coercion), [ADR-0011](0011-diamond-seal-layer-boundaries.md) (Diamond Seal Boundaries).
- Companion spec: `docs/FRONTEND_ARCHITECTURE.md`.
