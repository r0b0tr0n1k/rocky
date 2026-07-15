# ADR-0094: Notification Channel Routing & SMS Minimization Policy

> The notification domain currently lets the **caller pick the channel** (`send({ type: "sms", … })`)
> and `SubscriptionResolver` resolves channels from a subscription's `channels` config. There is **no
> policy** that selects channels by importance, content length, or delivery confirmation — and SMS has
> no provider, no acknowledgement signal, and no fallback logic. Meanwhile SMS is the **weakest link**
> in the trust chain: plaintext (SS7), exposes the phone number (PII), and is SIM-swap prone. Our own
> in-app/push messaging is the secure, authenticated, in-boundary channel and should be the default.
> This ADR makes channel selection a **policy owned by the Notification domain**, security-tiered, and
> SMS a consent-gated, content-minimized last resort.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Author** | Architecture Review (user directive: policy-driven, security-tiered routing; SMS minimized) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0014 (cross-domain event decoupling — "send SMS to farmer" future handler) · ADR-0068 (lawful basis, GDPR Art 6) · ADR-0073 (mobile edge compliance) · ADR-0074 (field-role edge PII) · Notification Bot AGENTS.md |

## Context

**The Real today (verified against the code, not assumed):**

1. **Channel choice is decentralised.** `NotificationService.send()` requires the caller to pass `type`
   (`sendNotificationSchema` → `type: notificationTypeType`). `SubscriptionResolver.resolveAndNotify()`
   picks the channel from `sub.channels` via `resolveChannel(sub.channels)`. The *Notification domain*
   never decides — the caller / subscription config does.
2. **The building blocks exist but are unused for policy.** `notification_priority` enum
   (`normal | urgent | critical`), the `type` channels (`email | sms | push | in_app | webhook`), and
   `notification_preferences.sms_enabled` are all present. What is missing is the **decision logic**
   that turns `{ priority, category, length, attachment, confirmation }` into a channel set.
3. **SMS is the insecure channel.** It is plaintext over SS7, leaks the phone number (PII) to the
   carrier and aggregator, and is vulnerable to SIM-swap. Routing sensitive cattle/health/farm content
   through it is a PII-leak and interception risk — exactly what ADR-0073/0074 warn about at the edge.
4. **No confirmation signal exists.** `notifications.deliveredAt` is set at *send* time, not when the
   app actually receives the message. There is no `acknowledgedAt` and no app→server delivery report,
   so the system cannot tell whether the app got the message — and therefore cannot decide whether to
   escalate to SMS. (ADR-0014's "send SMS to farmer" handler is still a `future` arrow.)
5. **No notification worker exists.** `getPending()` / `updateDeliveryStatus()` exist, but nothing
   drains the queue (contrast `apps/api/src/jobs/`, which has outbox-processor, birth-deadline, etc.,
   but none for notifications). So async delivery is unwired for *every* channel; only inline Expo
   push works.
6. **Some messages must never use SMS — even if the user is unreachable.** Low-value / high-volume
   categories should be suppressible per-category so we neither leak PII nor spend on SMS for noise.

## Decision

Adopt a **policy-driven, security-tiered `ChannelRouter`** owned by the Notification domain.

### 1. Caller supplies intent, not a channel

`send()` (and `SubscriptionResolver`) stop receiving `type`. They receive intent:
`{ userId, category, priority, subject, message, data?, docRef? }`. The router assigns the channel(s).

### 2. Security tiers

| Tier | Channel | Trust boundary | May carry |
| --- | --- | --- | --- |
| **0 — preferred** | our app (push + in_app) | inside Rocky (TLS, authenticated user) | full content |
| **1 — external, acceptable** | email | third-party but TLS, known address | long body / PDF attachment |
| **2 — last resort, minimal** | SMS | plaintext (SS7), carrier sees number | **pointer only** — never the payload |

### 3. Routing rules (pure, deterministic — `resolveChannels`)

- **Always** → `push` + `in_app` (Tier 0).
- If `hasAttachment` **or** `messageLength > EMAIL_BODY_THRESHOLD` → `email` (Tier 1).
- If `priority ∈ {urgent, critical}` **and** category allows SMS-primary **and** `sms_enabled` →
  `sms` (Tier 2, `minimized: true`).
- **Fallback**: if the app delivery report was **not** received within `confirmTtl` **and** category
  allows SMS-fallback **and** `sms_enabled` → `sms` (Tier 2, `minimized: true`, `role: FALLBACK`).
- If category forbids SMS-fallback → **suppressed** (no SMS even when unreachable).

### 4. Per-category SMS suppression

`CategorySmsPolicy { primary, fallback }` map, default `{ primary: true, fallback: true }`. Specific
categories set `{ primary: false, fallback: false }` so they **never** use SMS — implementing
"some types never get SMS even if the user is not reachable."

### 5. Confirmation / delivery report (no SMS "for nothing")

The Android/iOS app reports delivery via `confirmDelivery(notificationId)`; the server records
`acknowledgedAt`. The (future) delivery worker's fallback scanner escalates to SMS only when
`acknowledgedAt == null && now - createdAt > confirmTtl` **and** the router's plan includes a
FALLBACK SMS. This guarantees SMS is sent only when the app genuinely did not confirm.

### 6. SMS minimization (PII-safe)

SMS bodies are rendered from a **dedicated pointer template** that ignores the real `message`
(e.g. "Urgent: you have a message in the Rocky app — open it"). The phone number and body are PII:
the (future) SMS client must **not** log them, and `notifications.phoneNumber` / `lastError` are
masked in any audit output. SMS use requires **informed consent** (ADR-0068) given it is plaintext PII.

### 7. Contract & rollout

- `sendNotificationSchema` drops the required `type`; the router assigns it. Rollout is incremental:
  add an intent-mode to `send`, migrate callers, and have `SubscriptionResolver` delegate to
  `resolveChannels` instead of `sub.channels`.
- **SMS transport is deferred ("at the end").** The router is pure and **fully testable without any
  provider**; a mock / no-op SMS client suffices until a real Twilio/Vonage integration lands.

## Consequences

**Positive**

- Centralised, testable routing; the Notification domain owns the decision (ADR-0014's intent realised).
- Secure default (our app); PII minimization for SMS; SMS sent only when confirmation is genuinely missing.
- Per-category suppression prevents PII leakage and cost for low-value traffic.

**Costs / negatives**

- Contract change across `send()` callers and `SubscriptionResolver`.
- New `acknowledgedAt` column + mobile `confirmDelivery` endpoint.
- A delivery worker + fallback scanner must be built (none exists today).
- Real SMS provider (Twilio/Vonage) is explicitly **deferred**.

**Compliance**

- Aligns with ADR-0068 (lawful basis), ADR-0073/0074 (PII at the edge), and data-minimization: the
  code (routing policy) enforces what the ISMS paper demands.

**Implementation slices**

1. **ADR-0094 + `ChannelRouter` (`resolveChannels`) pure module + exhaustive tests** — ✅ DONE (committed 8269825).
2. `acknowledgedAt` column + mobile `confirmDelivery` — ✅ DONE (this increment):
   - `notifications.acknowledged_at` column + `idx_notifications_acknowledged` index (Drizzle + migration applied to `tbot`).
   - `NotificationService.confirmDelivery({ id, userId })` — sets `acknowledgedAt` + `deliveredAt`, status `DELIVERED`.
   - `notification.confirmDelivery` tRPC Mutation (`confirmDeliverySchema.omit({ userId: true })`); userId from `ctx.execution.principal`.
   - `confirmDeliverySchema` + `ConfirmDeliveryInput` + NoDrift guillotine `_drift_confirmDelivery` / `_verify_confirmDeliveryOutput`.
   - Service test (mocked repo) — 2 cases; notification suite 16/16 green.
3. Delivery worker + fallback scanner (consult `resolveChannels`) — ⬜ pending (slice 3).
4. SMS client (provider) — deferred ("at the end") ⬜.

**RobotFarm pass:** Notification Bot AGENTS.md updated (routing policy + tiers); WO line added.

## Compliance & Standards

This ADR's notification-channel routing and SMS minimisation enforce data-minimisation in transit,
mapping to controls in the canonical Statement of Applicability:

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — A.1.4.5 (data minimisation), A.8.11 (data in transit).
- [Technical & organisational measures — ROCKY-TOMS-001](../compliance/rocky-toms.md) — minimisation as a TOM.
