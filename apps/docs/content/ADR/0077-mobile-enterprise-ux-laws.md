# ADR-0077: Mobile Enterprise UX — Containment & Action Alignment on the PDA

> ADR-0076 codified the Enterprise UX laws for the **web admin**. The mobile PDA (`apps/mob`) is the same Red Diamond Seal rendered through a different Symbolic order: it is offline-first (ADR-0036 / WO-082), tab screens run with `headerShown: false` (no native nav bar), and its `Card` is a React-Native primitive (`components/ui/card`), not the web shadcn `Card`. This ADR translates the three laws into mobile-native form — no copy-paste of web `headerRight`, no Card-around-`FlatList` theater.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (RobotFarm) |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The PDA screens (`app/(tabs)/*`) were built screen-by-screen with no single containment/alignment law. Lists render bare `border-b` divider rows; forms render `FormField`s in a bare `View`; details already reach for `Card` in places (`animals/[id]`). The symptom: the same lawless sprawl ADR-0076 cured on the web, merely miniaturized. The Real pressing: the tab `Tabs` layout sets `headerShown: false`, so **there is no native navigation header** on tab screens — the web "Align actions → top-right `headerRight`" law has no surface to attach to. The laws must be *translated*, not transplanted.

Backend / cross-refs: offline-first contract → ADR-0036 / WO-082 / WO-094–097; web parity → ADR-0055; design system (RN) → ADR-0037; forms & validation → ADR-0038; permission-aware UI → ADR-0042; error/empty/loading UX → ADR-0041; tRPC contract → ADR-0032; mobile edge compliance → ADR-0073 / ADR-0074. This ADR is the Mobile Bot's companion to the Admin Bot's ADR-0076.

## Decision

The three laws hold on mobile, with mobile-native realizations through the **native** `components/ui/card` (`Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter`) — never `@rocky/ui/components/card` (web-only shadcn, renders `<div>`).

### Law I — Contain data

Wrap every discrete data region in the native `Card`:

- **Detail screens:** group related fields into `Card`s (`CardHeader` + `CardTitle` + `CardContent`). Already realized in `animals/[id]`.
- **Form screens:** wrap the `FormField` column in `<Card><CardContent className="gap-4 p-4">`. The form is bounded, not floating in a bare `View`.
- **List screens:** each row is a **card-styled surface** — `bg-card border border-border rounded-lg p-3 mb-2` — replacing the bare `border-b` divider. A Card-around-`FlatList` is *non-idiomatic* on mobile (it breaks `flex-1` height and fights the native scroller), so containment is expressed **per-row**, not per-list. The list is still "contained" — every datum sits in a card.

### Law II — Align actions

Tab screens have no nav header, so **no `headerRight`**. The law expresses as a **prominently top-placed primary CTA**, consistently placed:

- **List screens:** the primary verb (e.g. "Register New Animal") is a full-width `Button` immediately below the search toolbar — top of screen, unmissable (`animals/index` pattern).
- **Form screens:** the submit `Button` (bottom, full-width, `size="lg"`) is idiomatic mobile and acceptable; do **not** invent a nav header to fake a top-right button.
- **Detail screens:** domain actions (Seize/Reprint, Review/Resolve, Unassign) surface as a top-right control in the in-screen `flex-row justify-between` header — the mobile analogue of the web kebab, placed where the eye already lands.

Do **not** enable tab `headerShown` to satisfy this law. The CTA must be visibly prominent and consistently placed; the absence of a nav bar is a feature (more screen for field data), not a defect to paper over.

### Law III — The illusion of absolute control (control theater)

- **Search:** a toolbar `Input` at the top of list screens, wired to a real `search`/`list` param (e.g. `animal.list`). A fake search box is counter-revolutionary.
- **Filters:** where the backend supports them, a `Select` in the toolbar row.
- **Row actions:** each card-styled row is a `TouchableOpacity` that navigates to detail (the press *is* the affordance). Domain-specific actions live on the detail screen's top-right, not a web kebab.

### Canonical recipe (mobile)

```tsx
// List — card-styled rows, top CTA
<View className="flex-1 bg-background p-4 gap-4">
  <View className="flex-row gap-2">
    <Input placeholder="Search…" value={search} onChangeText={setSearch} className="flex-1" />
    <Button variant="outline" size="icon" onPress={openSearch}><Icon as={Search} /></Button>
  </View>
  <Button onPress={goCreate}><Icon as={Plus} /><Text>Register New Animal</Text></Button>
  <FlatList
    data={rows}
    renderItem={({ item }) => (
      <TouchableOpacity
        onPress={() => router.push(`/animals/${item.id}`)}
        className="flex-row items-center justify-between p-3 mb-2 bg-card border border-border rounded-lg"
      >
        {/* contained datum */}
      </TouchableOpacity>
    )}
    ListEmptyComponent={<Empty>…</Empty>}
  />
</View>

// Form — contained in Card
<ScrollView className="flex-1 bg-background">
  <Card className="m-4">
    <CardContent className="gap-4 p-4">
      <FormField label="…">…</FormField>
      <Button onPress={onSubmit} size="lg">Save</Button>
    </CardContent>
  </Card>
</ScrollView>
```

### Shared component contract

| Export | File | Role |
| --- | --- | --- |
| `Card` / `CardContent` / `CardHeader` / `CardTitle` | `components/ui/card` | native containment primitives |
| `FormField` | `components/ui/form-field` | labeled form control |
| `Button` / `Icon` / `Input` | `components/ui/*` | controls |
| `Empty` / `Skeleton` | `components/ui/*` | empty / loading UX (ADR-0041) |

### Sub-ordinances

- **Never import `@rocky/ui/components/card`** into a `.tsx` screen — it is web-only. Use `components/ui/card`.
- **Single containment:** wrap a data region once. Do not nest a `Card` inside a `Card` for the same region.
- **No dead buttons:** every affordance wires to a real mutation (offline-enqueued via `useOfflineMutation`) or a real route.
- **Offline-safe:** the contained form still enqueues on `onlineManager.isOnline() === false` (WO-082). Containment is visual; it must not alter the offline write path.

## Consequences

### Positive

- The PDA shares the web's Red Diamond Seal: contained, command-aligned, honestly-illusive — per surface, per paradigm.
- Reference slice (`animals` domain) proves the translation; rollout is mechanical and typecheck-gated (`tsc --noEmit`, no native run required for the visual change).
- No nav-header theater; the offline-first screen real-estate is preserved.

### Negative / Cost

- List rows change from dividers to cards — slightly more vertical space per row (acceptable; improves tap target + containment).
- Form screens gain a `Card` wrapper — a small, deliberate structural edit per screen.

### Neutral

- `app/(auth)/*` screens are credential flows, not governance registers; they retain their own containment (already `Card`-based in the password forms) and are out of scope for the CTA law.

## Implementation

Owning Bot: **Mobile Bot** (`apps/mob`), with the **Docs Bot** (`apps/docs`) hosting this record. RobotFarm pass: reference this ADR from `apps/mob/AGENTS.md`.

**Reference slice (done with this ADR):** `animals` domain —

- `app/(tabs)/animals/index.tsx` — rows → card-styled surfaces; top CTA retained.
- `app/(tabs)/animals/create.tsx` — `FormField` column → `Card` + `CardContent`.
- `app/(tabs)/animals/[id].tsx` — already `Card`-contained (reference for detail).

**Rollout (follow-up, per domain):** apply Law I/II to every tab screen — lists (`passport`, `movements`, `health`, `inspections`, `corrections`, `eartags`, `notifications`, `sync`), forms (`animals/birth`, `movements/{death,pasture,slaughter}`, `health/{treatment,vaccination,lab-test}`, `eartags/{create-order,collect-tags}`, `auth/{signin,signup}`), details (`passport/[id]`, `inspections/[id]`, `corrections/[id]`). Each edit is typecheck-gated; native verification is the WO-082 acceptance gate, not required for the visual containment change.

## Verification (Definition of Done)

```bash
cd apps/mob && npx tsc --noEmit -p tsconfig.json        # 0 errors
rg -n "components/ui/card" "app/(tabs)"                  # screens use the NATIVE Card
rg -n "@rocky/ui/components/card" "app/(tabs)"           # MUST be empty (no web Card import)
pnpm check:adrs                                          # this ADR conforms to ADR-0033
```

## Anti-Patterns (do not repeat)

1. Importing `@rocky/ui/components/card` (web shadcn `<div>`) into a React-Native screen — crashes on native.
2. Wrapping a `FlatList` in a `Card` to "contain the list" — breaks `flex-1` height; contain per-row instead.
3. Enabling tab `headerShown` just to add a top-right `headerRight` button — fakes the web law and shrinks field real-estate.
4. A bare `View` of `FormField`s floating with no `Card` — the mobile symptom this ADR cures.
5. Dead buttons — affordances that do not call a real mutation or route.

## Related ADRs

- **ADR-0076** — the web-admin source of the three laws (this ADR is its mobile translation).
- **ADR-0036 / WO-082** — offline-first contract (containment must not alter the offline write path).
- **ADR-0037** — design system; **ADR-0038** — forms & validation; **ADR-0042** — permission-aware UI; **ADR-0041** — error/empty/loading UX.
- **ADR-0055** — web/mobile admin parity; **ADR-0032** — tRPC; **ADR-0073 / ADR-0074** — mobile edge compliance.
