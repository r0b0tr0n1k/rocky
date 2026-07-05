# Mobile App — Mobile Bot

**Scope:** `apps/mobile/` — Expo React Native mobile app
**Status:** Foundation complete (auth + tRPC). Offline sync not implemented.

## Overview

Expo SDK 57 mobile app for field data entry — birth notifications, movement recording, inspection form completion, treatment/vaccination recording. Must work in rural areas with poor mobile coverage.

## Architecture

```
Expo App (React Native)
├── TRPCProvider (tRPC + React Query + superjson)
├── SessionProvider (better-auth expo client + SecureStore)
├── LocalDbProvider (expo-sqlite + Drizzle ORM) ← pending Phase B
├── NetworkProvider (expo-network) ← pending Phase B
└── SyncQueue (offline mutation queue) ← pending Phase E
```

## Tech Stack

| Component | Library                         | Version                     |
| --------- | ------------------------------- | --------------------------- |
| Framework | Expo                            | ~57.0.1                     |
| Routing   | expo-router                     | ~57.0.2                     |
| Auth      | better-auth + @better-auth/expo | 1.7.0-rc.1                  |
| Data      | tRPC + React Query              | @trpc/client ^11.18.0       |
| Storage   | expo-secure-store               | ~57.0.0                     |
| Local DB  | expo-sqlite + Drizzle ORM       | pending Phase B             |
| Network   | expo-network                    | ^57.0.0 (installed, unused) |

## Sync Architecture (Pending)

Three permission-scoped SQLite profiles — see `models/mobile-schema-profiles.yaml`:

| Profile      | Scope     | Tables    |
| ------------ | --------- | --------- |
| FARMER       | own_farms | 12 tables |
| VETERINARIAN | org_farms | 20 tables |
| CPC_ADMIN    | all       | 26 tables |

Sync strategy: download role-appropriate data → store in local SQLite → queue mutations when offline → replay when online.

## Known Issues

- ~~Root layout had `</ORPCProvider>` typo~~ ✅ **FIXED** — `_layout.tsx` now uses correct `</TRPCProvider>`
- `expo-network` is installed but never imported anywhere
- No offline queue, no local database, no sync engine

## Gap Resolution Plan

See `packages/domains/inspection/AGENTS.md` Phase B (Mobile Local DB) and Phase E (Offline Sync) for implementation details.

## Context Boundaries

| Bot            | Reads                         | Writes                            |
| -------------- | ----------------------------- | --------------------------------- |
| **Mobile Bot** | `apps/mobile/`                | Components, queries, offline sync |
| **Auth Bot**   | `apps/mobile/src/lib/auth.ts` | Auth client config                |
| **API Bot**    | tRPC routers                  | All mobile data entry flows       |
