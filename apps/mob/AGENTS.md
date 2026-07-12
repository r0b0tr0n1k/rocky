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
- **Web-safe:** `expo-secure-store` has no web implementation (SDK 56) and the offline subsystem is
  native-only (ADR-0036), so `getDeviceId()` returns a `web-dev-device` placeholder when
  `typeof document !== "undefined"` — it never touches the native module on web. The check is
  self-contained (no `db` import) so the offline doc-test module graph stays clean.

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

### Background periodic sync (WO-092) — `lib/offline/background-sync.ts`

- Scheduled `expo-background-fetch` task (`rocky-background-sync`) that drains the outbox even when the
  app is backgrounded/killed — the **scheduled** half of WO-092 (the network-regain flush in §Provider
  is the other half). `TaskManager.defineTask` invokes a drain callback registered by `OfflineProvider`
  on mount via a ref (the native task runs outside the React tree); the drain is `download()` + `flush()`.
- `registerBackgroundSync()` is idempotent and **skipped on web** (`expo-background-fetch` has no web
  entry; the offline subsystem is native-only). `app.json` carries the `expo-background-fetch` plugin
  (iOS `UIBackgroundModes: fetch`). Deps: `expo-background-fetch` + `expo-task-manager` (SDK 56).
- **NOTE:** `expo-background-fetch` is **deprecated in SDK 56** (superseded by `expo-background-task`);
  kept per WO-092 — migration is future cleanup.

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

## Web dev surface (dev-only)

- The PDA **runs on web** for UI development: `pnpm --filter @rocky/mobile-app web` (or
  `expo start -c` then press `w` in the Expo CLI). This is a **dev-only UI surface — NOT an offline
  acceptance target**.
- The offline subsystem is **native-only** (ADR-0036 §WO-081 d1). On web, `getLocalDb` /
  `getQueryPersister` / `refresh` / `download` / `flush` / `useOfflineMutation` / `getDeviceId` all
  short-circuit via `IS_WEB` — no `expo-sqlite` wasm, no `expo-secure-store`. So the app renders and
  tRPC queries / RBAC / navigation work, but the local cache + outbox are **no-ops**. Offline sync is
  exercised on a simulator/device only.
- Web needs **no `app.json` `web` block for dev** (`expo start --web` uses Expo Router defaults);
  add one only for web-specific config (favicon, output, etc.). The earlier native-only stopgap that
  removed the `web` script was a reaction to the `expo-sqlite`/`expo-secure-store` web crashes — those
  are now neutralized by the `IS_WEB` guards, so web dev is re-enabled.

## Native run (simulator / device) — the offline acceptance gate

- The offline subsystem is **native-only**, so the WO-082 acceptance cycle (`pending → synced`,
  cache-survives-restart) can **only** be proven on a simulator/device. This app uses **custom native
  modules** (`expo-sqlite`, `expo-secure-store`, `expo-background-fetch`, `expo-task-manager`), so it must
  run as a **development build** — **Expo Go cannot load custom native modules**. (The scheduled
  background fetch from WO-092 also only runs on a dev build, never on web.)
  **Scope:** Android only for now — iOS simulator/device testing is **deferred until the app is complete**;
  the iOS subsection below is documented but not yet exercised.

### Prerequisites (one-time)

- **`expo-dev-client`** is a dependency for dev builds (`expo-dev-client@56.0.22` pinned; re-add with
  `pnpm --filter @rocky/mobile-app add expo-dev-client@~56.0.0` if it drifts off the SDK-56 line).
- **`eas.json`** is scaffolded at `apps/mob/eas.json` with profiles `development` / `preview` /
  `production`. `preview` builds an **Android `.apk`** (the real-device-test artifact) via
  `eas build -p android --profile preview`.
- **`app.json` must declare `expo.android.package` and `expo.ios.bundleIdentifier`** (both set to
  `com.rocky.mobile`) — EAS Android/iOS builds fail without them; they cannot be auto-generated.
- For EAS cloud builds: install `eas-cli` (`npm i -g eas-cli` or a root devDependency) and `eas login`.
  `eas init` / the first `eas build` writes the account-specific `extra.eas.projectId` into `app.json`
  (not committed — it binds the local project to your EAS account). Credentials/keystore are managed by
  EAS, not stored in the repo.

### iOS Simulator (macOS + Xcode)

```bash
cd apps/mob
npx expo prebuild --platform ios   # generates ios/ + `pod install` links native modules
pnpm --filter @rocky/mobile-app ios   # expo start -c --ios → launches Simulator dev build
```

One-shot: `npx expo run:ios` (prebuild + Xcode build + launch). After the first build, `expo start` +
press **`i`** reconnects with fast refresh.

### Android Emulator (Android Studio + AVD)

```bash
cd apps/mob
npx expo prebuild --platform android   # generates android/ + links native modules
pnpm --filter @rocky/mobile-app android   # expo start -c --android → emulator
```

One-shot: `npx expo run:android`. Or `expo start` + press **`a`**.

### Physical device

- **Local (Mac):** `npx expo run:ios --device` (connected iPhone) or `npx expo run:android` with a USB
  Android.
- **EAS cloud dev build:** `eas build --profile development --platform ios` (or `android`) → scan QR
  with Camera → installs the dev-build app → `expo start` connects via the Dev Client.

### Native linking note

Every time a native module is added/upgraded (e.g. WO-092 added `expo-background-fetch`), **re-run
`prebuild` / `pod install` / gradle** so the new module is compiled into the binary. A dev build made
before the addition will be missing it (the background fetch task would not register).

### Offline acceptance (the WO-082 proof)

1. Run on simulator/device (above). 2. Toggle offline (airplane mode / kill wifi). 3. Submit an animal in
   `app/(tabs)/animals/create.tsx` → `pending` row in `sync_queue` (`idempotencyKey = deviceId:uuid`).
2. Reconnect → `download()` + `flush()` → row `pending → synced` (per-record verdict from the Server;
   ADR-0015 spawns an `error_corrections` ticket on failure). 5. Kill + relaunch → `persistQueryClient`
   restores `query_cache`. Record the trace → flip WO-082 Done.

## Android build & test (LOCAL ONLY — no cloud)

Only Android is exercised for now. **iOS testing is deferred** until the app is finished (no simulator / iOS
cloud builds yet). Android is built and tested **locally** to stay within the EAS free tier.

Build a test APK locally — no EAS cloud, no account needed:

```bash
cd apps/mob
npx expo prebuild -p android --clean     # generates android/ + links native modules
cd android && ./gradlew assembleRelease  # → android/app/build/outputs/apk/release/app-release.apk
# faster dev loop (debug-signed, no keystore): ./gradlew assembleDebug
```

- **Install on a device:** `adb install android/app/build/outputs/apk/release/app-release.apk` (USB), or open
  the `.apk` on the phone. Emulator: `npx expo run:android` (builds debug + launches).
- **No cloud builds, by design:** the `build:android` / `build:android:debug` scripts are gradle-only.
  `eas build` _without_ `--local` (cloud upload) is intentionally **never used** — it draws from the
  free-tier pool and store submit needs a paid plan. The monorepo `pnpm build` / `pnpm -r build` builds the
  TS packages only and never invokes `eas build`. (EAS-managed but still local + free:
  `eas build -p android --profile development --local` builds a dev client with `autoIncrement: true`;
  needs `eas init` + login, uploads nothing. The gradle `build:android` path needs no EAS at all.)
- **Signing:** local `assembleRelease` needs `android/app/release.keystore` + `keystore.properties`;
  `assembleDebug` is self-signed. Cloud keystore is irrelevant — no cloud builds.
- **Native modules:** after adding/upgrading a native module (e.g. WO-092's `expo-background-fetch`),
  **re-run `prebuild` / gradle** so it's compiled into the APK; an older build won't contain it.

## Device testing — LAN, real dev environment, Cloudflare Access

- Every device test pivots on **`EXPO_PUBLIC_API_URL`** (`apps/mob/lib/config.ts` → `getConfig()`), which
  Expo **bakes into the bundle at build time**. To change the target:
  - **Dev build (dev client, `expo start` + `i`/`a`):** edit `.env`, then **restart `expo start`** — Metro
    re-inlines `EXPO_PUBLIC_*` when it bundles; the dev client hot-reloads with the new URL.
  - **Local build (`build:android` / gradle / `expo prebuild`):** `EXPO_PUBLIC_*` is inlined at prebuild
    time from `.env`; re-run the build to pick up changes. (Cloud `eas build` is intentionally avoided —
    see "Android build & test (LOCAL ONLY — no cloud)".)
  - Fallback: `expo.extra.apiUrl` in `app.json` (also baked; restart for a dev client).
  - Cookie auth reads the `cookie` header in `providers/trpc-provider.tsx`; authenticate **via the mobile
    app itself** on the target host (don't reuse a web-admin session cookie from a different origin).

### LAN (phone on the same network as the dev machine)

1. Set `EXPO_PUBLIC_API_URL` to the dev machine's **LAN IP**, not `localhost`, e.g.
   `http://192.168.1.100:8080` (use the port your `apps/api` dev server listens on; the `.env` default is `:8080`).
2. Ensure the API dev server binds **`0.0.0.0`** (not `127.0.0.1`) and the OS firewall allows the port.
3. Put the phone on the same Wi-Fi; restart `expo start` (or rebuild the dev client). The app reaches the
   backend **directly — bypassing Cloudflare** (it's the raw LAN IP, not the Cloudflare-fronted domain).

### Real dev environment (Cloudflare-fronted backend)

- Set `EXPO_PUBLIC_API_URL=https://<dev-api-domain>` (the Cloudflare-fronted dev API).
- The backend sits **behind Cloudflare**, so the app must clear the Access challenge. A mobile client cannot
  do the browser login / interactive 2FA, so use a **Cloudflare Access service token** (below).

### Cloudflare Access service token (the non-interactive "2FA" bypass)

- In **Cloudflare Zero Trust → Access → Service Tokens**, generate a token (Client ID + Client Secret);
  scope it to the API application / hostname only.
- Set in `apps/mob/.env` (and `.env.example`):
  `EXPO_PUBLIC_CF_ACCESS_CLIENT_ID=<client-id>` and `EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET=<client-secret>`.
- The app attaches them as headers on **every tRPC query/mutation** (wired in `providers/trpc-provider.tsx`):
  `CF-Access-Client-Id` / `CF-Access-Client-Secret`. Cloudflare validates and lets the request through — no
  interactive login. Restart `expo start` / rebuild to pick them up.
- **Stronger alternative:** Cloudflare Access **mutual TLS (client certificates)** — issue a client cert and
  present it in the TLS handshake. Service tokens are simpler and sufficient for dev/test.
- **Security:** service tokens are `EXPO_PUBLIC_*` (baked into the client bundle). Use them for **dev/test
  only**; for production use per-user Cloudflare Access (device enrollment / SSO), not an embedded static token.

## EAS free-tier limits (staying within quota)

- EAS free tier is metered on **cloud builds** (`eas build`) and **submissions** (`eas submit`, paid-only).
  `expo start` (local Metro + dev client) and `eas update` (OTA JS bundles) are **free / not counted** against
  the build quota. Exact current caps (builds/month, concurrency, update bandwidth) live on the
  [EAS pricing page](https://expo.dev/pricing) — they change, but the strategies below hold.
- **Quota-free dev loop:** the dev build + dev client over LAN (what `expo start` serves) uses **zero** EAS
  builds. Iterate JS here all day; only rebuild native when a module changes. `eas build --local` (local dev
  client / APK) is also free — it compiles on your machine and uploads nothing; only `eas build` _without_
  `--local` draws from the plan's build minutes.
- **Prefer `eas update` over `eas build` for JS-only changes:** `eas update --branch <branch>` pushes an OTA
  bundle to installed builds without a native rebuild — saves native-build quota. (Note: `EXPO_PUBLIC_*` is
  baked at build; set build env via `eas env:configure` so updates pick it up.)
- **Build locally to dodge the cloud:** `eas build --local -p android --profile preview` produces the APK on
  your machine (needs Android SDK); `npx expo run:android` / `run:ios` for simulator dev builds.
- **Spend cloud builds deliberately:** each `eas build` (dev/preview/production) draws from the monthly pool.
  Reserve cloud builds for (a) a **native-module change** — e.g. after adding `expo-background-fetch`, rebuild
  the dev client **once** so the `rocky-background-sync` task is compiled in; (b) a shareable preview APK for a
  device you can't build locally. iOS cloud builds need a Mac to build locally, so budget them (one dev build,
  reuse via `eas update`).
- **Stores need a paid plan:** `eas submit` (Google Play / App Store) is not on the free tier.

## Offline Test Gate (WO-106)

- The Offline Subsystem Contract above is covered by a doctrine doc-test: `pnpm --filter docs test:offline`
  (`apps/docs/scripts/verify-offline-doctrine.mjs`). It verifies the contract (files/symbols/ADR links)
  and functionally exercises the REAL `lib/offline/*` against in-memory fakes for `expo-sqlite` /
  `expo-secure-store` (redirected via `apps/docs/scripts/tsconfig.offline-test.json` `paths` + tsx).

## WO-082 Acceptance — Native Verification

- WO-082 is **In Progress only** because native-device verification is impossible in this
  CI-less harness. The code is built and typechecks (`tsc --noEmit` → exit 0); the WO-106
  doctrine doc-test (11/11) exercises the REAL `lib/offline/*` against mocked native deps.
  The missing, irreducible half is a **native run** — the SQLite cache is a Real that appears
  only on a device/simulator.
- **Web is a dev-only UI surface, NOT the acceptance gate.** The offline subsystem is
  native-only (ADR-0036 §WO-081 d1). `expo start` serves a **web** bundle in a browser, and
  `expo-sqlite` v56's web entry needs a cross-origin-isolated context (COOP/COEP + Web Worker)
  it does not get — it crashed with `SharedArrayBuffer is not defined`. Fixed by the `IS_WEB`
  guard, which short-circuits `getLocalDb` / `getQueryPersister` / `refresh` / `download` /
  `flush` / `useOfflineMutation` (no-op on web). Running mob on web only smoke-tests the UI;
  it must not be the WO-082 acceptance target.
- **Native verification procedure (flips WO-082 → Done):**
  1. `pnpm --filter mob dev` → in Expo CLI press `i` (iOS Simulator) or `a` (Android Emulator).
     Runs the **native** bundle; `getLocalDb()` opens `rocky_offline.db` for real (no wasm).
  2. Point the PDA at a live backend: `pnpm --filter api dev` (+ DB pushed/seeded); the
     mobile `apiUrl` (prop → `TRPCProvider`) targets it (`localhost` on simulator, LAN IP on device).
  3. Exercise the offline loop: open Sync tab → toggle offline (airplane mode) → submit an
     animal → `pending` row in `sync_queue` with idempotency key `deviceId:uuid` → reconnect →
     `flush()` → row `pending → synced`. Conflict results applied server-side; client trusts nothing.
  4. Kill + relaunch → `persistQueryClient` restores the React Query cache from `query_cache`.
- **Evidence to flip the row:** native launch succeeds (no `SharedArrayBuffer`/wasm crash),
  enqueue→flush→synced cycle observed, cache survives restart. Record the trace, set WO-082 Done.
- **Full write-up:** component map + sequence/state diagrams in
  `apps/docs/content/offline-architecture.md` (the practical companion to ADR-0036).

## RobotFarm Chain

- Root `AGENTS.md` → Mobile Bot (this doc). Cross-refs: API Bot (`apps/api`), Auth Bot
  (`packages/auth`), Authorization Bot (`packages/authorization`), tRPC Bot (`packages/trpc`),
  Validation Bot (`@rocky/validators`), Docs Bot (`apps/docs`).
- Downstream: domain sweeps WO-094 (Livestock), WO-095 (Health), WO-096 (Inspections/Corrections),
  WO-097 (Infrastructure) bind their mutating actions to `useOfflineMutation`.
- Enterprise UX (web ADR-0076 → mobile translation **ADR-0077**): contain data in the native
  `components/ui/card` (`Card`/`CardContent`); tab screens set `headerShown: false` (no nav bar),
  so the "Align actions" law expresses as a prominently top-placed primary CTA, **not** a nav
  `headerRight`. Never import the web-only `@rocky/ui/components/card` into a `.tsx` screen.

## Cloud policy (EAS project) — special command only

The EAS project **`@gocenik/rocky`** (projectId written to `app.json` by `eas init` on 2026-07-11) is
authorized, but **only as a special, explicit command** — never in the normal dev loop.

**Why a cloud identity exists at all:** Expo Push notifications (WO-091, ADR-0043) require an EAS project.
`expo-notifications` `getExpoPushTokenAsync` keys the device token to `projectId`; the API server emits
pushes via the Expo Push API using the project's access token. Without the project there is no push.

**Allowed (cloud):**

- `eas init` (done) — registered the project + `projectId`.
- Explicit on-demand builds/submits via the `build:cloud:*` / `submit:*` scripts **only**.
- Generating an Expo Push access token (`EXPO_ACCESS_TOKEN`) for the API server (WO-091 server emit).

**Forbidden (normal procedure stays local):**

- Cloud builds are NOT part of the dev loop. Normal dev = `pnpm dev` (`expo start -c`), local
  `build:android` (gradle), or `eas build --local` (free, local APK).
- Never add a bare `eas build` / `eas submit` to a default or postinstall script.
- iOS testing stays deferred (paid Apple program) — see "Native run".

**Special cloud scripts:**

- `build:cloud:android` → `eas build -p android --profile production` (EAS servers)
- `build:cloud:ios` → `eas build -p ios --profile production` (EAS servers)
- `build:cloud:preview` → `eas build --profile preview` (EAS servers, internal APK)
- `submit:production` → `eas submit --profile production` (store submission)
