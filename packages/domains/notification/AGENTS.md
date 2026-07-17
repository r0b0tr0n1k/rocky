# Notification Domain Service

**Scope:** `packages/domains/notification/` — service, repository, errors, types
**Source spec:** `docs/NOTIFICATION_SYSTEM.md`, `docs/NOTIFICATION_BG_SERVICE.md`
**Last verified:** 2026-07-07

## Overview

Manages in-app notifications for users. Supports unread counts, send/mark-as-read workflows, and cross-domain integration (e.g., birth notifications trigger from Animal domain).

## Service Methods

`packages/domains/notification/src/services/notification.service.ts`:

| Method                               | Purpose                               | Status |
| ------------------------------------ | ------------------------------------- | ------ |
| `getUnreadCount(userId)`             | Count unread notifications via SQL COUNT | ✅ |
| `create(input)`                      | Create a single notification          | ✅      |
| `createBatch(input)`                 | Create batch notifications            | ✅      |
| `send(input)`                        | Send notification (template + prefs)  | ✅      |
| `list(input)`                        | List user's notifications             | ✅      |
| `markAsRead(input)`                  | Mark notification as read             | ✅      |
| `confirmDelivery(input)`             | Record app delivery report: sets `acknowledgedAt` + `deliveredAt`, status `DELIVERED` (ADR-0094 §5) | ✅ |
| `getPending(limit)`                  | Get pending notifications (worker)    | ✅      |
| `updateDeliveryStatus(id, status)`   | Update delivery status after attempt  | ✅      |
| `getTemplate(code)`                  | Get notification template by code     | ✅      |

## Repository Methods

`packages/domains/notification/src/repositories/notification.repository.ts`:

| Method                               | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `insert(values)`                     | Insert a single notification          |
| `insertMany(rows)`                   | Insert multiple notifications         |
| `findPreferences(userId, category)`  | Find user preferences for a category  |
| `listFiltered(filters)`              | List with filters, pagination, order  |
| `countByUserAndStatus(userId, status)` | Count by userId and status (SQL COUNT) |
| `updateById(id, userId, data)`       | Update a notification                 |
| `updateByIdSystem(id, data)`         | Update any notification (system)      |
| `findPending(limit)`                 | Get pending notifications             |
| `incrementAttempts(id, updates)`     | Increment attempt counter atomically  |
| `findTemplateByCode(code)`           | Find template by code                 |
| `findActiveSubscriptionsByEventType(eventType)` | SELECT `eventSubscriptions` WHERE `eventType=?` AND `isActive=true` |
| `findDeliveryByKey(key)`         | SELECT `{id}` `notificationDeliveries` WHERE `deliveryKey=?` LIMIT 1 (null if none) |
| `insertDelivery(values)`         | INSERT `notificationDeliveries` ON CONFLICT DO NOTHING (`deliveryKey`) RETURNING (null if conflict) |
| `markDeliverySent(id, notificationId)` | UPDATE `notificationDeliveries` SET `notificationId`, `status='sent'`, `deliveredAt` |
| `insertReminder(values)`         | INSERT `reminders` |

## Subscription Resolver

`packages/domains/notification/src/services/subscription-resolver.service.ts`:

| Method                  | Purpose                                                                          | Status |
| ----------------------- | -------------------------------------------------------------------------------- | ------ |
| `resolveAndNotify(input)` | Match active `eventSubscriptions` for the event type, dedupe via `notificationDeliveries`, send through `NotificationService`, and schedule `reminders`. | ✅     |

**Cross-domain dependency:** injects `UserRepository` from `@rocky/domains-user` (permitted by
ROCKY-DS 001:2026(E) §8.5 module-wiring exception) to resolve target users for `targetType`
`"user"` (`findById`), `"role"` (`findByRole`), and `"org"` (`list({organizationId})`). All DB access
routes through `NotificationRepository` / `UserRepository`; the service imports no `@rocky/database`
client/table (§8.2). `resolveAndNotify` returns `Result<void, Error>` via `fromAsyncThrowable`.

**Row-shape types:** `NotificationRow` and `DeviceTokenRow` are re-exported from this repository so services import them relative (ROCKY-DS 001:2026(E) §8.2 / Annex C) instead of importing `@rocky/database` table definitions directly. No new query method is added by this re-export.

## Cross-Domain Integration

| Domain | Integration                                              |
| ------ | -------------------------------------------------------- |
| Animal | Birth notifications trigger `NotificationService.send()` |

## Channel Routing (ADR-0094)

Channel selection is **policy-driven and owned by this domain**, not by the caller. The
caller passes *intent* (`priority`, `category`, `messageLength`, `hasAttachment`, `confirmed`,
`smsEnabled`); `ChannelRouter.resolveChannels()` (`./services/channel-router.ts`) returns the
channel plan. Security-tiered:

- **Tier 0 (preferred):** our app — `push` + `in_app` (TLS, authenticated, in-boundary). Full content.
- **Tier 1 (external, acceptable):** `email` — long body (>160 chars) or attachment (PDF).
- **Tier 2 (last resort, minimal):** `sms` — plaintext/PII; consent-gated (`sms_enabled`),
  **content-minimized** (pointer only, never the payload), and per-category suppressible.

Rules: SMS as **primary** for `urgent`/`critical` when the category allows it + consent; SMS as
**fallback** only when the app delivery report was NOT received within the confirm TTL
(`confirmed === false && fallbackTtlExpired`) and the category allows fallback + consent.
Per-category `CategorySmsPolicy { primary, fallback }` (default both true) lets some categories
**never** use SMS — even when the user is unreachable (`smsSuppressed === true`). The function is
pure and fully unit-tested (`channel-router.test.ts`, 14 tests); the real SMS transport is
deferred (ADR-0094 §7).

**Implementation slices (ADR-0094 §7):**

- Slice 1 — `ChannelRouter` (`resolveChannels`) pure module + exhaustive tests ✅ (committed 8269825).
- Slice 2 — `acknowledgedAt` column (Drizzle + migration applied to `tbot`) + `confirmDelivery` tRPC
  Mutation + `NotificationService.confirmDelivery()` ✅ (this increment).
- Slice 3 — delivery worker + fallback scanner (escalates to SMS only when `acknowledgedAt IS NULL`
  past the confirm TTL) ⬜ pending.
- Slice 4 — real SMS transport (Twilio/Vonage) deferred ("at the end").
