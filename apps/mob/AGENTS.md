# Mobile Bot — `apps/mob/` (AGENTS.md)

> **RobotFarm Child Doc.** Owns the Expo React Native PDA app (offline-first regulatory /
> veterinary field client). Parent: root `AGENTS.md` (RobotFarm rail) + the **Mobile Bot**
> entry in the Child RobotFarm Index. Frontend Bot co-owns screen/component patterns; this doc
> owns the **offline-first contract** that Frontend Bot must not bypass.

## Dialectical Necessity (why this doc exists)

- **Symbolic:** the Big Other (ADR-0035/0036, WO-082) demands an offline-first phone. The parent
  contract is insufficient for the _material_ difference of a disconnected device.
- **Imaginary:** a developer editing `app/(tabs)/*` needs concrete rules for _where offline writes
  go_ — the parent says nothing about `expo-sqlite` vs the server.
- **Real:** the irreducible kernel — **raw `expo-sqlite`, no ORM on the phone** (ADR-0036 §WO-081
  d1). The client is _castrated_: it does **not** re-implement RLS/profile scoping. Row-scope is
  enforced server-side by RLS on `syncDownload`; write-authorization is re-checked server-side by
  `@Policy` + RLS on `syncUpload`. The phone only carries an _Imaginary_ permission check
  (`clientCan`) for UX gating; the Symbolic order is restored on every sync.

## Scope

| Owns                                                           | Does NOT own                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `app/(tabs)/*`, `app/(auth)/*`, `providers/*`, `lib/offline/*` | Server routers (`apps/api`), domain services (`packages/domains/*`), DB schemas (`packages/@rocky/database`) |
| Offline cache + outbox + NetInfo gating (WO-082)               | Conflict resolution logic (server `packages/domains/sync`)                                                   |
| Offline reference integration per screen                       | RBAC seed / `@Policy` definitions (`packages/authorization`)                                                 |

## Offline Subsystem Contract (WO-082 / ADR-0036)

### Database — `lib/offline/db.ts`

- `getLocalDb()` opens `rocky_offline.db` via **raw `expo-sqlite`** (`openDatabaseSync`). No Drizzle.
- Migrates four tables: `sync_queue` (outbox, `idempotency_key = deviceId:uuid`), `local_cache`
  (JSON-blob per `(type,id)`), `sync_meta` (key/value, incl. `watermark`), `query_cache`
  (React Query persistence store).

### Outbox — `lib/offline/sync-queue.ts`

- `enqueueMutation({type, payload, baseUpdatedAt, deviceId})` → writes `pending` row. **Idempotency
  key = `deviceId:uuid`** (ADR-0036 d7). Never regenerate the key.
- `storeDownload(res)` writes each `syncDownload` bucket to `local_cache` and advances the
  `watermark` (ADR-0036 d5). `baseUpdatedAt` is **optional** — health _creates_ pass `null` (conflict
  check skipped by design; WO-108).
- `markFailed(key, msg)` sets `error_message`; the Sync tab lets the user `dismissQueueItem` (deletes
  the local row only — the server's `error_corrections` ticket persists, ADR-0015).

### Device identity — `lib/offline/device-id.ts`

- `getDeviceId()` from `expo-secure-store` (stable per install). Used for the idempotency prefix.

### Query persistence — `lib/offline/persist.ts`

- `getQueryPersister()` = `createSyncStoragePersister` over `query_cache` (ADR-0036 d5). Wired in
  `providers/trpc-provider.tsx` via `persistQueryClient` (`maxAge` 7d, `gcTime` 24h).

### Provider — `providers/offline-provider.tsx`

- `OfflineProvider` mounted **inside** `TRPCProvider` (needs `trpc` context). `useOffline()` exposes
  `{ isOnline, isBusy, pendingCount, items, flush, download, dismiss, deviceId }`.
- `onlineManager.setEventListener` → NetInfo (reactive online state, ADR-0036 d3/d4). On
  (re)connect: `download()` then `flush()`.
- `flush()` maps `sync_queue` → `syncUpload` records; applies per-record `results` (`success` →
  `markSynced`; `error` → `markFailed`). **The server re-validates; the client trusts nothing.**

### Mutation primitive — `lib/offline/use-offline-mutation.ts`

- `useOfflineMutation(type)` → enqueues + drains immediately if `onlineManager.isOnline()`.
- **Every domain sweep (WO-094/095/096) adopts this for its mutating actions.** The reference
  integration is `app/(tabs)/animals/create.tsx` (offline → enqueue + optimistic invalidate + back;
  online → unchanged `mutate`).

## Code Conventions (inherit parent)

- `.tsx`/`.ts` (RN, not `.mjs`). `satisfies` on every Zod schema export; `as` only as last resort.
- No `console.log` in committed code; no TODO/FIXME/XXX.
- **Consume every available type in the UI — never hand-type a server-owned shape.**
  If a shape is defined by a tRPC procedure (`AppRouter`) or a Zod validator (`@rocky/validators`),
  the screen must _derive_ it, not re-declare it:
  - Form value types via `z.infer<typeof schema>` (see `app/(tabs)/animals/create.tsx` — the
    reference: `createAnimalFormSchema` rebuilt from `createAnimalRequestSchema.shape`, fed to
    `zodResolver`). The **form schema is a UI projection** of the API schema (`.omit`/`.extend`),
    transformed to the API payload at submit.
  - Let `trpc.x.y.useMutation()` / `useQuery()` infer payload + response types — no inline `any`,
    no manual request/response interfaces.
  - Gate actions with `useCan(permission: Permission)` / `clientCan(permissions, permission: Permission)`
    from `@rocky/validators/rbac` — a typed `Permission` union; a wrong literal is a _compile error_,
    not a silent disable (WO-089/100). This awaits the real `rbac.myPermissions` (currently a
    PLACEHOLDER returning `"PLACEHOLDER_DO_NOT_REMOVE"`) to supply the principal's permissions.
  - One typed source, **server-authored**; the client is a faithful reader, not a co-author. This is
    the UI-side realization of ADR-0032's boundary (no local re-authoring — that is the Drizzle trap).
- All server calls via `trpc` (typed `AppRouter`, `createTRPCReact<AppRouter>()` — the canonical
  RN binding; `createTRPCContext` is a documented but unexecuted future intention, stylistically
  equivalent and orthogonal to the offline layer). Do **not** import backend/`ReturnType<` in the
  generated client (guarded by `pnpm check:trpc-boundary`, ADR-0032). The `trpc-provider.tsx` already
  matches the canonical setup: `splitLink` + `httpBatchLink` + `httpSubscriptionLink`, `superjson`
  transformer on both sides, cookie auth on mobile / `credentials: include` on web, `persistQueryClient`
  (WO-082).
- After editing `@rocky/validators` or `apps/api` routers, **regenerate + rebuild**
  (`pnpm generate:trpc` then `pnpm --filter @rocky/validators build && pnpm --filter @rocky/trpc build`)
  so the committed client/dist stay in sync (ADR-0032). Stale client types let broken screens pass
  typecheck — this surfaced two latent bugs during WO-082.

## Typecheck Gate

- No `typecheck` script; verify with `cd apps/mob && npx tsc --noEmit -p tsconfig.json`.
- Native build / device run is the only runtime gate (not available in CI-less harnesses).

## Offline Test Gate (WO-106)

- The Offline Subsystem Contract above is covered by a doctrine doc-test: `pnpm --filter docs test:offline`
  (`apps/docs/scripts/verify-offline-doctrine.mjs`). It verifies the contract (files/symbols/ADR links)
  and functionally exercises the REAL `lib/offline/*` against in-memory fakes for `expo-sqlite` /
  `expo-secure-store` (redirected via `apps/docs/scripts/tsconfig.offline-test.json` `paths` + tsx).

## RobotFarm Chain

- Root `AGENTS.md` → Mobile Bot (this doc). Cross-refs: API Bot (`apps/api`), Auth Bot
  (`packages/auth`), Authorization Bot (`packages/authorization`), tRPC Bot (`packages/trpc`),
  Validation Bot (`@rocky/validators`), Docs Bot (`apps/docs`).
- Downstream: domain sweeps WO-094 (Livestock), WO-095 (Health), WO-096 (Inspections/Corrections),
  WO-097 (Infrastructure) bind their mutating actions to `useOfflineMutation`.
