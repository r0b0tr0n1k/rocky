# ADR-0043: Push Notifications, Background Sync & Deep-link (Mobile)

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-09 |
| **Author** | Rocky Architecture Board |
| **Supersedes** | None |
| **Superseded** | None |

---

> Client-surface ADR (standard: ADR-0033). The mobile real-time/background story: how Rocky
> *addresses* the field worker (push), how it *keeps data fresh offline* (background sync), and how an
> external address *resolves* to a screen (deep-link). *sniffs* — today the worker is addressed only when
> they remember to open the tab; the Big Other (server) whispers, but the subject is not listening.

## Context (verified)

- **Server notifications exist.** `apps/api/src/routers/notification.router.ts` exposes `unreadCount`
  (query), `send`, and `markAsRead` (mutations). The DB has `sm/notifications`, `sm/notification-deliveries`,
  `sm/notification-preferences`, `sm/notification-templates`, plus `an/birth-notifications`. A
  `notification` domain package exists. So the *in-app* notification system is real.
- **Mobile has the tabs.** `apps/mob/app/(tabs)/` contains `notifications/` and `sync/` — the UI shells exist.
- **But there is no push.** `apps/mob/package.json` depends only on `expo-linking` — **no `expo-notifications`**,
  no `expo-background-fetch`, no `expo-task-manager`. Notifications are therefore **pull-based**: the worker
  must open the `notifications` tab and call `unreadCount`/list to learn anything. The server can `send`, but
  nothing delivers it to the device.
- **No background execution.** Sync (ADR-0036) is specified but the *transport* is online-only (WO-081/WO-082
  pending); there is no task that runs the sync queue when the app is backgrounded or the network returns.
- **Deep-link scheme is configured but inert for routing.** `apps/mob/app.json` sets `"scheme": "rocky"` and
  `apps/mob/lib/auth.ts` reads that scheme for the better-auth **Expo OAuth callback** — but there is **no
  resolver** that maps an incoming `rocky://…` URL (from a push payload, a QR code, or an external link) to an
  in-app route. Expo Router *does* resolve file-route URLs by default, yet nothing handles notification payloads
  or guarantees the deep-linked route is available **offline** (per the ADR-0036 cache).

### The contradiction (Žižek)

The server *wants* to address the field worker in real time (the notification domain proves it). The **Symbolic**
(in-app notification record) exists; the **Imaginary** is "the worker gets alerted in the field"; the **Real** is
that delivery stops at the database — the worker only learns of it on their next pull. Push is the missing
mediation. Background sync is the suture between online and offline; deep-link is the mapping of the Symbolic
address (URL) onto the Real of the screen.

## Decision

1. **Push notifications** — register an Expo push token on login (store against the user/device), have the server
   emit an Expo push when a notification row is created, and on receipt route the payload through a
   **deep-link resolver** to the relevant screen.
2. **Background sync** — register an `expo-background-fetch` (or `expo-task-manager`) task that drains the sync
   queue (WO-082) on a schedule and on network regain; the `sync` tab becomes the *manual* trigger, not the only one.
3. **Deep-link resolver** — a single handler (Expo Router `linking` config + an intent handler) that maps incoming
   URLs/push `data` to routes, with **offline-parity** (the target route is resolvable from cache per ADR-0036).

```mermaid
graph TD
  subgraph S["Server — notification domain (exists)"]
    ND["sm/notifications, notification-deliveries"]
    NR["notification.router: unreadCount, send, markAsRead"]
    ND --> NR
  end
  subgraph M["apps/mob (today)"]
    NT["notifications tab (pull)"]
    ST["sync tab (online-only)"]
    NR -.->|unreadCount| NT
  end
  subgraph P["Proposed: push + background + deep-link"]
    PT["Expo push token registered on login"]
    EX["Expo Push API → OS → app"]
    DL["deep-link resolver → route"]
    BF["expo-background-fetch → sync queue (WO-082)"]
    PT --> EX --> DL
    BF --> ST
  end
  classDef src fill:#1e3a8a,color:#ffffff,stroke:#1e40af,stroke-width:2px
  classDef auth fill:#15803d,color:#ffffff,stroke:#166534,stroke-width:2px
  classDef gap fill:#7f1d1d,color:#ffffff,stroke:#991b1b,stroke-width:2px
  class ND,NR auth
  class NT,ST src
  class PT,EX,DL,BF gap
```

*Fig. 1 — Today: server notification is pull-only; sync is online-only. Proposed: push token → Expo → deep-link
resolver → route; background-fetch drains the sync queue. Red nodes are the present gaps (WO-091/092/093).*

## 3. Push notification design

- **Token registration:** on successful auth, `auth.useSession()` provides the user; register the Expo push token
  (`expo-notifications` `getExpoPushTokenAsync`) and persist it (new `device_tokens` row or on
  `notification-preferences`). Re-register on token refresh.
- **Server emission:** when `notification.router.send` (or domain logic) creates a notification, also enqueue an
  Expo push via the Expo Push API (a small server client; respect `notification-preferences` opt-outs).
- **Receipt → route:** the push `data` payload carries a route key (e.g., `{ route: "animals/123" }`); the app's
  notification listener calls the **deep-link resolver** (§5) to navigate.

## 4. Background sync design

- Add `expo-background-fetch` (+ `expo-task-manager` if finer control is needed). Register a task that, when
  triggered (OS schedule / network regain), runs the **sync queue** built in WO-082 (`syncDownload` +
  `syncUpload` against the promoted `sync` router, WO-081).
- The existing `sync` tab stays as the manual, user-visible trigger and progress view; background fetch is the
  silent counterpart. Respect battery/data by only syncing when on Wi-Fi or when the queue is non-empty.

## 5. Deep-link design

- Configure Expo Router `linking` in `apps/mob/app/_layout.tsx` (or `app.json`) with the `rocky` scheme and a
  path→route map; add an intent/`notification` listener that translates incoming `data` to the same map.
- **Offline-parity:** the resolver must only navigate to routes whose data is present in the ADR-0036 cache; if the
  deep-linked entity is not cached, show the `Skeleton`/`Empty` UX (ADR-0041) and queue a background fetch
  (§4) rather than a hard failure.

## Consequences

|                     | Today                        | Proposed                              | Server        |
|---------------------|------------------------------|---------------------------------------|---------------|
| Delivery            | pull (open tab)              | **push** (Expo) + pull                | send exists   |
| Sync trigger        | manual (sync tab)            | **manual + background-fetch**         | unchanged     |
| External URL → route| auth callback only           | **deep-link resolver** (offline-aware)| unchanged     |

### Positive

- The worker is *addressed* in the field (real-time alerts), not only on pull — realizes the notification domain's intent.
- Data stays fresh offline via background sync; deep-links resolve even without connectivity (cache-backed).

### Negative

- New mobile deps (`expo-notifications`, `expo-background-fetch`); a server Expo Push client + device-token storage.
- Background tasks are OS-throttled and platform-asymmetric (iOS stricter than Android) — must degrade gracefully.

### Neutral / Real

- All three are **client-only** additions; the server notification/sync contracts are unchanged (ADR-0036/0015). The
  gaps are precisely the missing mobile halves — encoded as WO-091/092/093.

## Implementation

- **WO-091:** add `expo-notifications`; register token on login (store on `notification-preferences`/device table);
  server emits Expo push on notification creation (respect opt-outs); receipt routes via deep-link resolver.
- **WO-092:** add `expo-background-fetch`; task drains the WO-082 sync queue on schedule + network regain. Depends
  on WO-081 (promote `sync` router) + WO-082 (mobile offline cache + sync queue).
- **WO-093:** Expo Router `linking` config + intent/notification listener (deep-link resolver); offline-parity via
  ADR-0036 cache + ADR-0041 `Skeleton`/`Empty`.
- Keep the `rocky` scheme (already in `app.json`); extend its *use* beyond the auth callback.

## Verification

```bash
# Push deps present + token registration on login:
rg -n "expo-notifications|getExpoPushTokenAsync" apps/mob
# Background fetch task registered:
rg -n "expo-background-fetch|registerTaskAsync" apps/mob
# Deep-link resolver maps URLs/push data to routes:
rg -n "linking|addNotificationReceivedListener|getLastNotificationResponseAsync|registerDevice|expo-notifications" apps/mob
# Server still emits notifications (unchanged contract):
rg -n "unreadCount|markAsRead|send" apps/api/src/routers/notification.router.ts
```

## References

- ADR-0036 (Offline-first Sync Architecture — transport + cache this ADR's background sync depends on).
- ADR-0015 (Mobile PDA Sync — seed for the sync router, WO-081).
- ADR-0035 (Rendering & Data-Fetching — mobile is online-only today; this ADR extends to background).
- ADR-0041 (Error/Empty/Loading UX — `Skeleton`/`Empty` for offline deep-links).
- ADR-0033 (client ADR standard).
- `apps/api/src/routers/notification.router.ts` + `packages/domains/notification` (server notification domain).
- **WO-081** (promote `sync` router), **WO-082** (mobile offline cache + sync queue) — prerequisites.
- **WO-091** (push), **WO-092** (background sync), **WO-093** (deep-link resolver) — this ADR's keystones.

- **ADR-0032** (tRPC `AppRouter` / `superjson` — push notifications and background sync emit through the same `AppRouter` the client consumes; `TRPCError` surfaces as a toast per ADR-0041).

## Implementation Status (2026-07-11)

All three keystones (WO-091/092/093) are **built and typecheck-clean**; the epic is code-complete. Native behavior
(push receipt, deep-link routing, background fetch) is only provable on a device and is folded into the WO-082
device-acceptance gate.

### 10.1 Cloud identity — special command only

- `eas init` created the EAS project **`@gocenik/rocky`**; `projectId` is written to `apps/mob/app.json`
  (`expo.extra.eas.projectId`). The project identity exists **only** so `expo-notifications` can mint a device token
  and so push can be delivered — it is **not** a license to build in the cloud.
- Cloud builds are gated behind explicit scripts (`build:cloud:android|ios|preview`, `submit:production`) — see
  `apps/mob/AGENTS.md` §Cloud policy. Normal dev stays local (`./gradlew assembleRelease`, `eas build --local`,
  `expo start`).
- Server push emission requires `EXPO_ACCESS_TOKEN` (EAS project access token) in the API `.env`;
  `sendExpoPush` skips silently when it is absent (local dev without a token is fine — pull still works).

### 10.2 Server — the missing mobile half of the notification domain (WO-091)

- New table **`sm/device_tokens`** (`packages/database/src/schema/sm/device-tokens.ts`): `id`, `userId` FK→`users`,
  `deviceId`, `expoPushToken`, `platform`, `createdAt`, `updatedAt`; `uniqueIndex(userId, deviceId)`; RLS policy
  mirrors `notifications.ts`.
- **`NotificationRepository`** (`packages/domains/notification/src/repositories/notification.repository.ts`):
  `upsertDeviceToken` (on-conflict per user+device) + `findDeviceTokensByUsers`.
- **`NotificationService`** (`packages/domains/notification/src/services/notification.service.ts`):
  `registerDevice(userId, input)` + `emitPush(input)` (Expo Push API via
  `packages/domains/notification/src/clients/expo-push.client.ts`; best-effort, respects opt-outs via the token
  table).
- **`notification.router.ts`**: new `registerDevice` mutation; `send` now fires a push to the recipient
  (fire-and-forget, never breaks `send`).

### 10.3 Client — token registration + deep-link resolver + offline parity (WO-091 + WO-093)

- **`apps/mob/lib/deep-link.ts`**: `resolveRoute(url | data)` maps a `rocky://…` URL or push `data.route` to an
  Expo Router path; `navigateToRoute` pushes it.
- **`apps/mob/providers/notification-provider.tsx`**:
  - `Notifications.setNotificationHandler` (alert/banner/list/badge per the SDK 56 `NotificationBehavior` shape).
  - On login: `getExpoPushTokenAsync({ projectId })` (skipped under `IS_WEB`) →
    `trpc.notification.registerDevice.useMutation()`.
  - **Three** listeners: foreground `addNotificationReceivedListener`; tapped
    `addNotificationResponseReceivedListener` + `getLastNotificationResponseAsync` (cold-start); and the `Linking`
    URL. Each routes via the resolver **after** `OfflineProvider.download()` — offline-parity: fresh cache;
    ADR-0041 `Skeleton`/`Empty` on miss.
  - Wired in `apps/mob/app/_layout.tsx` inside `OfflineProvider` + `SessionProvider`; `app.json` gained the
    `expo-notifications` plugin.

### 10.4 Gates — passed

- `apps/api` `tsc --noEmit` → **0**; `apps/mob` `tsc --noEmit` → **0**; offline doc-test → **11/11**.
- `pnpm generate:trpc` → 24 routers / 156 procedures (the `notification` router is restored to the client
  `AppRouter`).

### 10.5 Remaining — infra, not code

1. **Apply the `device_tokens` migration:** `cd packages/database && pnpm generate` →
   `node ../../scripts/fix-rls-sql.mjs` → `psql … -f drizzle/…/migration.fixed.sql`.
2. **Set `EXPO_ACCESS_TOKEN`** (EAS project access token) in the API `.env`.
3. **Native verify** on a device (push token + routing + background fetch — WO-082 acceptance).
