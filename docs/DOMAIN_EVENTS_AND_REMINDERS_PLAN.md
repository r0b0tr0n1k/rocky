# Domain Events & Reminders System — Implementation Plan

*[sniff] *[adjusts shirt]*

## Overview

This plan specifies a **minimal viable event/reminder system** that:

- Captures **meaningful business events** (disease detected, animal registered, approval requested)
- Delivers **notifications** via the existing notification infrastructure
- Provides **calendar reminders** tied to events or standalone
- Avoids the **bureaucratic fetishism** of full event-sourcing (Kafka, event replay, aggregate reconstruction)

**Core principle:** Augment the existing `notifications` system — don't replace it.

**Critical architectural rule:** Services emit events through `EventRepository` (NOT direct DB). The worker processes events through `DomainEventRepository` (NOT direct DB). Direct `db.insert()` in service or worker code violates the Diamond Seal boundary and is **forbidden**.

---

## Current State Assessment

### What We Already Have

```
packages/database/src/schema/
├── sm/
│   ├── notifications.ts              # Notification queue (read/unread, priority, scheduled)
│   ├── notification-templates.ts     # Message templates per category/type
│   └── notification-preferences.ts   # Per-user preferences (inApp, email, push)
├── sm/
│   └── audit-log.ts                  # Append-only audit trail with pre/post snapshots
└── sm/
    └── system-parameters.ts          # Tunable thresholds (code, value, group)
```

**Gap:** `audit_log` captures **data changes** but not **domain events**. When a disease is detected, `audit_log` records "treatment inserted" — but NOT "disease outbreak detected."

### What We Need

Three new tables + a background worker + two repository classes:

1. `domain_events` — append-only event log
2. `event_types` — lookup table for event categories
3. `event_subscriptions` — declarative "who cares about what"
4. `reminders` — calendar items tied to events
5. `notification_deliveries` — idempotency tracking

Plus:
- `DomainEventRepository` — worker-facing, manages polling + state transitions
- `EventRepository` — service-facing, emits events in transactions
- `EventTypeId` constants — avoids magic strings

---

## Schema Design (Drizzle ORM)

All schemas follow existing Rocky conventions:

- `uuid` primary keys with `defaultRandom()`
- `TIMESTAMPTZ` for all timestamps
- `boolean("is_active")` for soft deletes
- `pgPolicy` for RLS
- `varchar` with length constraints
- `jsonb` for flexible payloads
- `index()` and `uniqueIndex()` for performance
- `integer()` for numeric columns (NOT `boolean()` — see the corrected schema below)

---

### Table 1: `domain_events`

**File:** `packages/database/src/schema/events/domain-events.ts`

```typescript
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { ADMIN_ROLES, isRoleIn, currentUserId } from "../rls-helpers.js";
import { eventTypes } from "./event-types.js";

export const domainEvents = pgTable(
  "domain_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Event classification — foreign key to lookup table
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id),

    // What entity triggered this event
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),

    // Scoping (nullable for system-wide events)
    farmId: uuid("farm_id"),
    organizationId: uuid("organization_id"),
    triggeredBy: uuid("triggered_by"),

    // Flexible payload — different events have different data
    data: jsonb("data").notNull().default(sql`'{}'::jsonb`),

    // Lifecycle
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    priority: varchar("priority", { length: 20 }).notNull().default("normal"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Delivery tracking — integer for proper arithmetic
    deliveryAttempts: integer("delivery_attempts").notNull().default(0),
    lastDeliveryAttemptAt: timestamp("last_delivery_attempt_at", { withTimezone: true }),
    processedAt: timestamp("processed_at", { withTimezone: true }),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    index("idx_domain_events_status").on(table.status),
    index("idx_domain_events_priority").on(table.priority),
    index("idx_domain_events_farm").on(table.farmId),
    index("idx_domain_events_org").on(table.organizationId),
    index("idx_domain_events_created").on(table.createdAt),
    // Partial index for efficient poller queries
    index("idx_domain_events_pending")
      .on(table.priority, table.createdAt)
      .where(sql`${table.status} = 'pending'`),
    pgPolicy("domain_event_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        -- Admins see all
        ${isRoleIn(...ADMIN_ROLES)}
        -- Farm members see farm-scoped events
        OR (${table.farmId} IS NOT NULL AND ${farmOwnedByUser(table.farmId)})
        -- Org members see org-scoped events
        OR (${table.organizationId} IS NOT NULL AND ${currentOrgId} = ${table.organizationId})
        -- Triggering user sees their own events
        OR ${table.triggeredBy} = ${currentUserId}
      )`,
    }),
  ]
);
```

**Key design decisions:**

- ✅ `integer("delivery_attempts")` — proper integer column to count retries (NOT `boolean()`)
- ✅ `TIMESTAMPTZ` for timezone safety
- ✅ Foreign key to `event_types` lookup table (no CHECK migrations for new types)
- ✅ `priority` column for urgent vs routine lane separation
- ✅ `delivery_attempts` for retry tracking (max 3)
- ✅ Partial index on `pending` for efficient poller queries
- ✅ RLS policy with explicit branches for system/farm/org/self events

---

### Table 2: `event_types`

**File:** `packages/database/src/schema/events/event-types.ts`

```typescript
import { pgTable, uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const eventTypes = pgTable(
  "event_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }),
    category: varchar("category", { length: 50 }), // 'health', 'registration', 'movement', 'compliance'
    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_event_types_code").on(table.code),
    index("idx_event_types_category").on(table.category),
  ]
);
```

**No RLS needed** — `event_types` is a read-only lookup table for all authenticated users.

**Why lookup table instead of CHECK constraint?**

- Adding new event type = INSERT row, not ALTER TABLE
- No migration required for additive changes
- Same integrity guarantee (foreign key)
- Supports `is_active` flag to deprecate old types without breaking history

---

### Table 3: `event_subscriptions`

**File:** `packages/database/src/schema/events/event-subscriptions.ts`

```typescript
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { eventTypes } from "./event-types.js";
import { ADMIN_ROLES, isRoleIn, currentUserId } from "../rls-helpers.js";

export const eventSubscriptions = pgTable(
  "event_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // What event type
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id),

    // Targeting — normalized to avoid NULL semantics issues
    targetType: varchar("target_type", { length: 20 }).notNull(), // 'user' | 'role' | 'org'
    targetId: uuid("target_id").notNull(),

    // Filter conditions (JSONB array of {field, operator, value})
    conditions: jsonb("conditions").default(sql`'[]'::jsonb`),

    // Channel preferences (override user defaults)
    channels: jsonb("channels").default(sql`'{"inApp": true, "email": false, "push": false}'::jsonb`),

    // Scheduling — integer columns for proper arithmetic
    delayMinutes: integer("delay_minutes").notNull().default(0),
    reminderEnabled: boolean("reminder_enabled").notNull().default(false),
    reminderOffsetDays: integer("reminder_offset_days").notNull().default(0),
    reminderDurationHours: integer("reminder_duration_hours").notNull().default(1),

    // Lifecycle
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    index("idx_event_subscriptions_type").on(table.eventTypeId),
    index("idx_event_subscriptions_target").on(table.targetType, table.targetId),
    // Single UNIQUE constraint — no NULL ambiguity
    sql`UNIQUE (event_type_id, target_type, target_id, conditions)`,
    pgPolicy("event_subscription_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.createdBy} = ${currentUserId}
      )`,
    }),
  ]
);
```

**Key design decisions:**

- ✅ `integer("delay_minutes")` — proper integer (NOT `boolean()`)
- ✅ `integer("reminder_offset_days")` — proper integer (NOT `boolean()`)
- ✅ `integer("reminder_duration_hours")` — proper integer (NOT `boolean()`)
- ✅ **Normalized targeting:** Single `target_type` + `target_id` replaces 3 nullable columns
- ✅ **Single UNIQUE constraint:** No Postgres NULL semantics issues
- ✅ **`reminderOffsetDays` NOT NULL DEFAULT 0:** Prevents NaN arithmetic
- ✅ Foreign key to `event_types` for referential integrity
- ✅ RLS policy: admins see all, users see their own subscriptions

---

### Table 4: `reminders`

**File:** `packages/database/src/schema/events/reminders.ts`

```typescript
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { ADMIN_ROLES, isRoleIn, currentUserId } from "../rls-helpers.js";

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Links to event or entity
    domainEventId: uuid("domain_event_id"),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),

    // Who gets reminded
    userId: uuid("user_id")
      .notNull(),
    role: varchar("role", { length: 50 }),

    // What/when (TIMESTAMPTZ!)
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(60),

    // Simple recurrence — no complex engine
    recurrence: varchar("recurrence", { length: 20 }).notNull().default("none"),
    recurrenceUntil: timestamp("recurrence_until", { withTimezone: true }),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Metadata
    priority: varchar("priority", { length: 20 }).notNull().default("normal"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_reminders_user_pending")
      .on(table.userId, table.status, table.dueAt)
      .where(sql`${table.status} = 'pending'`),
    index("idx_reminders_due")
      .on(table.dueAt)
      .where(sql`${table.status} = 'pending'`),
    pgPolicy("reminder_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR ${table.userId} = ${currentUserId}
      )`,
    }),
  ]
);
```

**Key design decisions:**

- ✅ `integer("duration_minutes")` — proper integer (NOT `boolean()`)
- ✅ `TIMESTAMPTZ` for timezone safety
- ✅ Simple recurrence (`none`, `daily`, `weekly`, `monthly`) — no half-built recurrence engine
- ✅ Partial indexes for pending reminders (query optimization)
- ✅ RLS policy: users see their own reminders, admins see all

---

### Table 5: `notification_deliveries`

**File:** `packages/database/src/schema/events/notification-deliveries.ts`

```typescript
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Links
    domainEventId: uuid("domain_event_id")
      .notNull(),
    eventSubscriptionId: uuid("event_subscription_id")
      .notNull(),
    userId: uuid("user_id")
      .notNull(),
    // notificationId is nullable: created TWO-PHASE
    // (1) insert delivery record first
    // (2) create notification, then UPDATE delivery with notificationId
    notificationId: uuid("notification_id"),

    // Dedup key — prevents double-insert on retry
    deliveryKey: varchar("delivery_key", { length: 255 }).notNull().unique(),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    errorMessage: varchar("error_message", { length: 500 }),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_notification_deliveries_event").on(table.domainEventId),
    index("idx_notification_deliveries_user").on(table.userId),
    // delivery_key already has UNIQUE constraint
  ]
);
```

**Key design decisions:**

- ✅ **`notificationId` is nullable** — avoids placeholder UUID hack. Delivery record created first, notification created second, then `notificationId` updated.
- ✅ **`delivery_key` UNIQUE** guarantees exactly-once delivery
- ✅ If worker crashes between steps 1 and 2, retry finds existing `delivery_key` and skips

---

## Repository Layer (Diamond Seal Compliance)

Both repositories extend `BaseRepository` and are the **only** code that touches `domain_events` and related tables directly.

### `DomainEventRepository`

**File:** `packages/events/src/repositories/domain-event.repository.ts`

```typescript
import { BaseRepository } from "@rocky/database";
import { domainEvents } from "@rocky/database";
import { eq, and, lt, gt, isNull, or, sql, asc } from "drizzle-orm";

export class DomainEventRepository extends BaseRepository<typeof domainEvents> {
  private readonly MAX_RETRIES = 3;
  private readonly DEFAULT_BATCH_SIZE = 50;

  constructor() {
    super(domainEvents);
  }

  /**
   * Poll for pending events with SKIP LOCKED (concurrency-safe).
   * Returns events locked for processing — no other worker can touch them.
   */
  async pollPending(options?: {
    batchSize?: number;
    priority?: string;
  }): Promise<DomainEvent[]> {
    const limit = options?.batchSize ?? this.DEFAULT_BATCH_SIZE;

    return this.db.transaction(async (tx) => {
      const result = await tx.execute(sql`
        WITH next_batch AS (
          SELECT id FROM ${domainEvents}
          WHERE status = 'pending'
            AND delivery_attempts < ${this.MAX_RETRIES}
            AND (expires_at IS NULL OR expires_at > NOW())
            AND (scheduled_for IS NULL OR scheduled_for <= NOW())
          ORDER BY
            CASE priority
              WHEN 'urgent' THEN 0
              WHEN 'high' THEN 1
              ELSE 2
            END,
            created_at ASC
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        UPDATE ${domainEvents}
        SET status = 'processing',
            delivery_attempts = delivery_attempts + 1,
            last_delivery_attempt_at = NOW()
        WHERE id IN (SELECT id FROM next_batch)
        RETURNING *
      `);
      return result.rows;
    });
  }

  /** Mark event as processed successfully */
  async markProcessed(eventId: string): Promise<void> {
    await this.db.update(domainEvents)
      .set({
        status: "processed",
        processedAt: new Date(),
      })
      .where(eq(domainEvents.id, eventId));
  }

  /** Mark event as permanently failed */
  async markFailed(eventId: string, error?: string): Promise<void> {
    await this.db.update(domainEvents)
      .set({
        status: "failed",
        data: sql`jsonb_set(${domainEvents.data}, '{last_error}', to_jsonb(${error}::text))`,
      })
      .where(eq(domainEvents.id, eventId));
  }

  /** Get a single event by ID (for LISTEN/NOTIFY handler) */
  async getById(eventId: string): Promise<DomainEvent | null> {
    const result = await this.db.select()
      .from(domainEvents)
      .where(eq(domainEvents.id, eventId))
      .limit(1);
    return result[0] ?? null;
  }
}
```

### `EventRepository` (Service-Facing)

**File:** `packages/events/src/repositories/event.repository.ts`

```typescript
import { BaseRepository } from "@rocky/database";
import { domainEvents, eventTypes } from "@rocky/database";
import { eq } from "drizzle-orm";

interface EmitEventInput<TData = Record<string, unknown>> {
  eventTypeCode: string;       // Uses string code, not UUID — easier for services
  entityType: string;
  entityId: string;
  farmId?: string;
  organizationId?: string;
  triggeredBy?: string;
  data: TData;
  priority?: "normal" | "high" | "urgent";
  expiresAt?: Date;
}

/**
 * EventRepository — the ONLY way services emit events.
 * Services MUST NOT call db.insert(domainEvents) directly.
 *
 * Usage:
 *   await eventRepository.emit({
 *     eventTypeCode: "disease_detected",
 *     entityType: "treatment",
 *     entityId: treatment.id,
 *     farmId: treatment.farmId,
 *     data: { diseaseName, severity },
 *     priority: "urgent",
 *   });
 */
export class EventRepository extends BaseRepository<typeof domainEvents> {
  constructor() {
    super(domainEvents);
  }

  /**
   * Emit a domain event. Resolves eventTypeCode → UUID internally.
   * Should be called from within a business transaction (same tx).
   */
  async emit<TData>(
    input: EmitEventInput<TData>,
    tx?: DBTransaction,
  ): Promise<Result<DomainEvent, AppError>> {
    const client = tx || this.db;

    try {
      // Resolve event type code to UUID
      const [eventType] = await client.select()
        .from(eventTypes)
        .where(eq(eventTypes.code, input.eventTypeCode))
        .limit(1);

      if (!eventType) {
        return err(new UnknownEventTypeError(input.eventTypeCode));
      }

      const [event] = await client.insert(domainEvents).values({
        eventTypeId: eventType.id,
        entityType: input.entityType,
        entityId: input.entityId,
        farmId: input.farmId,
        organizationId: input.organizationId,
        triggeredBy: input.triggeredBy,
        data: input.data as any,
        priority: input.priority ?? "normal",
        expiresAt: input.expiresAt,
      }).returning();

      return ok(event);
    } catch (error) {
      return err(toAppError(error));
    }
  }

  /**
   * Emit and NOTIFY for immediate delivery.
   * Use for urgent events (disease detection, compliance violations).
   */
  async emitAndNotify<TData>(
    input: EmitEventInput<TData>,
    tx?: DBTransaction,
  ): Promise<Result<DomainEvent, AppError>> {
    const result = await this.emit(input, tx);

    if (result.isOk()) {
      const client = tx || this.db;
      await client.execute(
        sql`SELECT pg_notify('domain_events', ${result.value.id})`
      );
    }

    return result;
  }
}
```

---

## EventTypeId Constants

**File:** `packages/events/src/constants/event-type-ids.ts`

```typescript
/**
 * Central registry of event type codes.
 * Services import these constants instead of using magic strings.
 * Must stay in sync with seed data in `packages/database/src/seed/events.seed.ts`.
 */
export const EVENT_TYPE_IDS = {
  DISEASE_DETECTED: "disease_detected",
  ANIMAL_REGISTERED: "animal_registered",
  APPROVAL_REQUESTED: "approval_requested",
  INSPECTION_SCHEDULED: "inspection_scheduled",
  TAG_ORDER_APPROVED: "tag_order_approved",
  PASSPORT_ISSUED: "passport_issued",
  MOVEMENT_RECORDED: "movement_recorded",
  PASTURE_RETURNED: "pasture_returned",
  SLAUGHTER_RECORDED: "slaughter_recorded",
  BIRTH_NOTIFICATION_CREATED: "birth_notification_created",
  ERROR_CORRECTION_REQUIRED: "error_correction_required",
  VACCINATION_OVERDUE: "vaccination_overdue",
  QUARANTINE_EXPIRING: "quarantine_expiring",
  FOREIGN_PASSPORT_EXPIRING: "foreign_passport_expiring",
} as const;

export type EventTypeId = (typeof EVENT_TYPE_IDS)[keyof typeof EVENT_TYPE_IDS];
```

---

## Implementation: Transactional Outbox Pattern

### Service Layer: Emit Events via `EventRepository`

**Example:** `packages/domains/health/src/services/treatment.service.ts`

```typescript
import { EventRepository, EVENT_TYPE_IDS } from "@rocky/events";

class TreatmentService {
  private eventRepo = new EventRepository();

  async createTreatment(input: CreateTreatmentInput, user: User) {
    // SAME TRANSACTION for business record + domain event
    return await db.transaction(async (tx) => {
      // 1. Write the treatment record
      const [treatment] = await tx.insert(treatments).values({
        animalId: input.animalId,
        diseaseId: input.diseaseId,
        farmId: input.farmId,
        vetId: user.id,
        diagnosisDate: input.diagnosisDate,
        treatmentDesc: input.treatmentDesc,
        isolated: input.isolated,
      }).returning();

      // 2. Emit domain event via EventRepository (same transaction)
      //    NOT direct db.insert() — Diamond Seal compliance
      if (input.notifiable) {
        await this.eventRepo.emitAndNotify({
          eventTypeCode: EVENT_TYPE_IDS.DISEASE_DETECTED,
          entityType: "treatment",
          entityId: treatment.id,
          farmId: treatment.farmId,
          organizationId: await getOrgId(treatment.farmId, tx),
          triggeredBy: user.id,
          data: {
            disease_name: input.diseaseName,
            notifiable: true,
            animal_id: input.animalId,
            severity: input.severity,
          },
          priority: "urgent",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }, tx);
      }

      return treatment;
    });
  }
}
```

**Why this matters:**

- ✅ Event and business record commit/rollback together
- ✅ No orphaned events if transaction fails
- ✅ No lost events if process crashes after commit
- ✅ `emitAndNotify` sends Postgres LISTEN/NOTIFY for sub-second dispatch
- ✅ Repository boundary respects Diamond Seal — services don't touch DB directly

---

### Animal Registration Example

**File:** `packages/domains/animal/src/services/animal.service.ts`

```typescript
import { EventRepository, EVENT_TYPE_IDS } from "@rocky/events";

class AnimalService {
  private eventRepo = new EventRepository();

  async createAnimal(input: CreateAnimalInput, user: User) {
    return await db.transaction(async (tx) => {
      const [animal] = await tx.insert(animals).values({...}).returning();

      // Emit event only for meaningful registrations
      if (input.isFirstTagging || input.isImport || input.birthNotificationId) {
        await this.eventRepo.emit({
          eventTypeCode: EVENT_TYPE_IDS.ANIMAL_REGISTERED,
          entityType: "animal",
          entityId: animal.id,
          farmId: animal.currentFarmId,
          organizationId: await getOrgId(animal.currentFarmId, tx),
          triggeredBy: user.id,
          data: {
            ear_tag_number: animal.earTagNumber,
            birth_date: animal.birthDate,
            sex: animal.sex,
            is_first_tagging: input.isFirstTagging,
            is_import: input.isImport,
          },
          priority: input.isFirstTagging ? "high" : "normal",
        }, tx);
      }

      return animal;
    });
  }
}
```

---

### Approval Requested Example

**File:** `packages/domains/farm/src/services/farm.service.ts`

```typescript
import { EventRepository, EVENT_TYPE_IDS } from "@rocky/events";

class FarmService {
  private eventRepo = new EventRepository();

  async submitForApproval(farmId: string, user: User) {
    return await db.transaction(async (tx) => {
      const [farm] = await tx.update(farms)
        .set({ verificationStatus: "pending_vd_approval" })
        .where(eq(farms.id, farmId))
        .returning();

      await this.eventRepo.emit({
        eventTypeCode: EVENT_TYPE_IDS.APPROVAL_REQUESTED,
        entityType: "farm",
        entityId: farm.id,
        organizationId: farm.organizationId,
        triggeredBy: user.id,
        data: {
          farm_id: farm.farmId,
          farm_name: farm.name,
          verification_status: farm.verificationStatus,
        },
        priority: "high",
      }, tx);

      return farm;
    });
  }
}
```

---

## Implementation: Background Worker

### Worker Architecture

**File:** `packages/events/src/workers/domain-event.worker.ts`

The worker uses `DomainEventRepository` for data access (NOT direct `db.insert()`):

```typescript
import { EventRepository, EVENT_TYPE_IDS } from "@rocky/events";
import { notificationTemplates } from "@rocky/database";

export class DomainEventWorker {
  private eventRepo: DomainEventRepository;
  private subscriptionRepo: EventSubscriptionRepository;
  private notificationRepo: NotificationRepository;
  private pollIntervalMs: number;

  constructor(options?: { pollIntervalMs?: number }) {
    this.eventRepo = new DomainEventRepository();
    this.subscriptionRepo = new EventSubscriptionRepository();
    this.notificationRepo = new NotificationRepository();
    this.pollIntervalMs = options?.pollIntervalMs ?? 60000; // 1 minute default
  }

  async start() {
    // Lane 1: LISTEN/NOTIFY for urgent events (immediate dispatch)
    this.startNotifyListener();

    // Lane 2: Poller for routine events
    setInterval(() => this.processPendingEvents(), this.pollIntervalMs);

    // Initial run
    await this.processPendingEvents();
  }

  private startNotifyListener() {
    // Postgres LISTEN/NOTIFY requires a native pg connection
    // See: packages/database/src/listener.ts for setup
    const listener = new PostgresListener();
    listener.listen("domain_events", async (eventId: string) => {
      const event = await this.eventRepo.getById(eventId);
      if (event?.priority === "urgent") {
        await this.processEvent(event);
      }
    });
  }

  async processPendingEvents() {
    const events = await this.eventRepo.pollPending();
    for (const event of events) {
      try {
        await this.processEvent(event);
      } catch (error) {
        // If retries exhausted, mark failed
        if (event.deliveryAttempts >= 3) {  // MAX_RETRIES
          await this.eventRepo.markFailed(event.id, error.message);
        }
        // Otherwise leave as 'processing' — retry on next poll
      }
    }
  }

  private async processEvent(event: DomainEvent) {
    // 1. Find matching subscriptions
    const subscriptions = await this.subscriptionRepo.getActiveForEventType(event.eventTypeId);

    // 2. Dispatch to each subscription
    for (const sub of subscriptions) {
      await this.dispatchToSubscription(event, sub);
    }

    // 3. Mark event processed
    await this.eventRepo.markProcessed(event.id);
  }

  private async dispatchToSubscription(
    event: DomainEvent,
    sub: EventSubscription,
  ) {
    // 1. Resolve target users based on target_type
    const targetUsers = await this.subscriptionRepo.resolveTargetUsers(sub);

    for (const user of targetUsers) {
      // 2. Check filter conditions
      if (!this.matchesConditions(event.data, sub.conditions)) {
        continue;
      }

      // 3. Create delivery record FIRST (idempotency key)
      const deliveryKey = `${event.id}:${sub.id}:${user.id}`;
      const delivery = await this.notificationRepo.createDelivery({
        domainEventId: event.id,
        eventSubscriptionId: sub.id,
        userId: user.id,
        deliveryKey,
      });

      if (!delivery) continue; // Already delivered (ON CONFLICT DO NOTHING)

      // 4. Format notification using template system
      const template = await this.notificationRepo.getTemplate(event.eventTypeId);
      const title = template.renderTitle(event.data, user.locale);
      const message = template.renderBody(event.data, user.locale);

      // 5. Create notification record
      const notification = await this.notificationRepo.createNotification({
        userId: user.id,
        category: event.eventTypeId,
        title,
        message,
        channels: sub.channels,
        scheduledFor: this.calculateScheduledAt(sub.delayMinutes),
        priority: event.priority,
      });

      // 6. Update delivery with notification ID (completes the two-phase insert)
      await this.notificationRepo.linkDelivery(delivery.id, notification.id);

      // 7. Create reminder if requested
      if (sub.reminderEnabled) {
        await this.createReminder(event, sub, user);
      }
    }
  }

  private matchesConditions(
    data: Record<string, unknown>,
    conditions: Array<{ field: string; operator: string; value: unknown }>,
  ): boolean {
    if (!conditions?.length) return true;
    return conditions.every((cond) => {
      const value = data[cond.field];
      switch (cond.operator) {
        case "=":  return value == cond.value;
        case "!=": return value != cond.value;
        case ">":  return Number(value) > Number(cond.value);
        case "<":  return Number(value) < Number(cond.value);
        case "in": return Array.isArray(cond.value) && cond.value.includes(value);
        default:   return true;
      }
    });
  }

  private calculateScheduledAt(delayMinutes: number): Date {
    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }

  private async createReminder(
    event: DomainEvent,
    sub: EventSubscription,
    user: User,
  ) {
    const reminderRepo = new ReminderRepository();
    await reminderRepo.create({
      domainEventId: event.id,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: user.id,
      title: `Follow-up: ${event.eventTypeId}`,
      dueAt: new Date(Date.now() + sub.reminderOffsetDays * 24 * 60 * 60 * 1000),
      priority: event.priority,
    });
  }
}
```

---

## tRPC Endpoints for Mobile/Web

### NestJS @Router Format (NOT plain tRPC)

**File:** `apps/api/src/routers/reminders.router.ts`

```typescript
import { Router, Query, Mutation } from "@nestjs/trpc";
import { z } from "zod";
import { ReminderRepository } from "@rocky/events";

@Router({ alias: "reminders" })
export class RemindersRouter {
  constructor(private reminderRepo: ReminderRepository) {}

  @Query({
    input: z.object({
      status: z.enum(["pending", "completed", "cancelled", "expired"]).default("pending"),
      daysAhead: z.number().int().min(1).max(90).default(7),
    }),
    output: z.array(reminderSchema),
  })
  async list(@Input() input: ReminderListInput) {
    const result = await this.reminderRepo.listForUser(input);
    return result.unwrap();
  }

  @Mutation({
    input: z.object({ id: z.string().uuid() }),
    output: reminderSchema,
  })
  async complete(@Input() input: { id: string }) {
    const result = await this.reminderRepo.markCompleted(input.id);
    return result.unwrap();
  }

  @Mutation({
    input: z.object({ id: z.string().uuid() }),
    output: reminderSchema,
  })
  async cancel(@Input() input: { id: string }) {
    const result = await this.reminderRepo.markCancelled(input.id);
    return result.unwrap();
  }
}
```

---

## Subscription Seeding (Default Rules)

### Admin Seeds Default Subscriptions

**File:** `packages/database/src/seed/event-subscriptions.seed.ts`

Uses barrel imports from `@rocky/database` — NOT direct file paths:

```typescript
import { eventSubscriptions, eventTypes } from "@rocky/database";
import { roles } from "@rocky/database";
import { eq } from "drizzle-orm";

export async function seedEventSubscriptions(db: Database) {
  // Get event type IDs by code
  const diseaseDetected = await getEventTypeId(db, "disease_detected");
  const animalRegistered = await getEventTypeId(db, "animal_registered");
  const approvalRequested = await getEventTypeId(db, "approval_requested");

  // Get role IDs
  const viRole = await getRoleId(db, "VI");
  const vdAdminRole = await getRoleId(db, "VD_ADMIN");
  const farmerRole = await getRoleId(db, "FARMER");

  // Subscription 1: VI gets notified of all notifiable disease detections
  await db.insert(eventSubscriptions).values({
    eventTypeId: diseaseDetected,
    targetType: "role",
    targetId: viRole,
    conditions: [{ field: "notifiable", operator: "=", value: true }],
    channels: { inApp: true, email: true, push: true },
    delayMinutes: 0,
    reminderEnabled: true,
    reminderOffsetDays: 2, // Follow-up inspection in 2 days
    reminderDurationHours: 48,
  });

  // Subscription 2: VD_ADMIN gets notified of all disease detections
  await db.insert(eventSubscriptions).values({
    eventTypeId: diseaseDetected,
    targetType: "role",
    targetId: vdAdminRole,
    conditions: [],
    channels: { inApp: true, email: true, push: false },
    delayMinutes: 0,
    reminderEnabled: false,
  });

  // Subscription 3: Farmer gets notified about their farm approvals
  await db.insert(eventSubscriptions).values({
    eventTypeId: approvalRequested,
    targetType: "role",
    targetId: farmerRole,
    conditions: [],
    channels: { inApp: true, email: false, push: false },
    delayMinutes: 0,
    reminderEnabled: false,
  });

  // Subscription 4: VD_ADMIN gets notified of first taggings
  await db.insert(eventSubscriptions).values({
    eventTypeId: animalRegistered,
    targetType: "role",
    targetId: vdAdminRole,
    conditions: [{ field: "is_first_tagging", operator: "=", value: true }],
    channels: { inApp: true, email: false, push: false },
    delayMinutes: 0,
    reminderEnabled: false,
  });
}
```

---

## Retention Job (Prevents Unbounded Growth)

**File:** `packages/events/src/jobs/retention.job.ts`

```typescript
import { DomainEventRepository, ReminderRepository } from "@rocky/events";
import { sql } from "drizzle-orm";

export async function runEventRetention() {
  // Archive events older than 90 days
  // (domain_events_archive table — create via migration if needed)
  await db.execute(sql`
    INSERT INTO domain_events_archive
    SELECT * FROM domain_events
    WHERE created_at < now() - interval '90 days'
      AND status IN ('processed', 'expired', 'cancelled')
  `);

  // Delete archived events
  await db.delete(domainEvents)
    .where(sql`
      created_at < now() - interval '90 days'
      AND status IN ('processed', 'expired', 'cancelled')
    `);

  // Delete completed reminders older than 1 year
  await db.delete(reminders)
    .where(sql`
      status = 'completed'
      AND completed_at < now() - interval '1 year'
    `);

  // Expire stale pending reminders (older than 7 days past due)
  await db.update(reminders)
    .set({ status: "expired" })
    .where(sql`
      status = 'pending'
      AND due_at < now() - interval '7 days'
    `);
}
```

**Schedule:** Run daily at 2 AM via existing cron infrastructure (`@Cron(EVERY_DAY_AT_2AM)` pattern from Archive Bot).

---

## Seed Data: Event Types

**File:** `packages/database/src/seed/events.seed.ts`

Uses proper barrel import from `@rocky/database`:

```typescript
import { eventTypes } from "@rocky/database";

export async function seedEventTypes(db: Database) {
  const types = [
    { code: "disease_detected", name: "Disease Detected", category: "health" },
    { code: "animal_registered", name: "Animal Registered", category: "registration" },
    { code: "approval_requested", name: "Approval Requested", category: "compliance" },
    { code: "inspection_scheduled", name: "Inspection Scheduled", category: "compliance" },
    { code: "tag_order_approved", name: "Tag Order Approved", category: "registration" },
    { code: "passport_issued", name: "Passport Issued", category: "registration" },
    { code: "movement_recorded", name: "Movement Recorded", category: "movement" },
    { code: "pasture_returned", name: "Pasture Returned", category: "movement" },
    { code: "slaughter_recorded", name: "Slaughter Recorded", category: "movement" },
    { code: "birth_notification_created", name: "Birth Notification Created", category: "registration" },
    { code: "error_correction_required", name: "Error Correction Required", category: "compliance" },
    { code: "vaccination_overdue", name: "Vaccination Overdue", category: "health" },
    { code: "quarantine_expiring", name: "Quarantine Expiring", category: "health" },
    { code: "foreign_passport_expiring", name: "Foreign Passport Expiring", category: "compliance" },
  ];

  for (const type of types) {
    await db.insert(eventTypes).values(type).onConflictDoNothing();
  }
}
```

---

## Migration Strategy

### Step 1: Create Tables (No Data Loss)

```bash
cd packages/database
pnpm generate
# Review migration SQL
node ../../scripts/fix-rls-sql.mjs
psql $DATABASE_URL -f drizzle/*/migration.fixed.sql
pnpm seed
```

### Step 2: Create Repository Classes

1. `DomainEventRepository` (worker-facing)
2. `EventRepository` (service-facing)
3. `EventSubscriptionRepository` (subscription queries)
4. `ReminderRepository` (reminder CRUD)
5. `NotificationRepository` (delivery + template integration)

### Step 3: Refactor Services to Use `EventRepository`

Replace direct `db.insert(domainEvents).values(...)` calls in:

1. `treatment.service.ts` → `eventRepo.emit({ eventTypeCode: "disease_detected", ... })`
2. `animal.service.ts` → `eventRepo.emit({ eventTypeCode: "animal_registered", ... })`
3. `farm.service.ts` → `eventRepo.emit({ eventTypeCode: "approval_requested", ... })`

### Step 4: Deploy Worker

```bash
# In apps/api or separate worker service
pnpm start:event-worker
```

Worker processes pending events every 1 minute (configurable via `system_parameters`).

### Step 5: Create Reminders UI

- Mobile: `apps/mobile/src/screens/reminders.tsx`
- Web: `apps/web/src/app/reminders/page.tsx`
- Use NestJS tRPC `RemindersRouter`

---

## What We Explicitly Don't Build

*[sniff]* This is the **Žižekian negation** — defining the boundary by exclusion:

| Feature | Why Not |
|---|---|
| **Event replay/reconstruction** | No event-sourcing — current state is source of truth |
| **Event versioning** | Events are append-only, no schema evolution needed |
| **Complex event processing (CEP)** | Overkill — subscriptions handle filtering |
| **Kafka/RabbitMQ** | Single Postgres DB is sufficient for our scale |
| **Event bus abstraction** | Repository layer is the abstraction — no separate bus |
| **Aggregate roots** | We already have domain services as aggregates |
| **Snapshotting** | Not needed without event replay |
| **Event schema registry** | JSONB payloads are self-describing |
| **Dead letter queues** | `status='failed'` + `delivery_attempts` is sufficient |
| **Event sourcing projections** | Read models are direct SQL queries |

---

## Monitoring & Observability

### Key Metrics

```typescript
// Worker metrics
const workerMetrics = {
  eventsProcessed: counter("events_processed_total", { event_type: string }),
  processingDuration: histogram("event_processing_duration_seconds"),
  deliveryFailures: counter("event_delivery_failures_total", { event_type: string }),
  notificationsCreated: counter("notifications_created_total"),
  remindersCreated: counter("reminders_created_total"),
};

// Database metrics
const dbMetrics = {
  pendingEvents: gauge("pending_events_count"),
  failedEvents: gauge("failed_events_count"),
  avgDeliveryAttempts: gauge("avg_delivery_attempts"),
};
```

### Alerts

```yaml
alerts:
  - name: HighEventFailureRate
    condition: event_delivery_failures_total / events_processed_total > 0.1
    severity: warning
    action: Check worker logs for errors

  - name: EventBacklogGrowing
    condition: pending_events_count > 1000
    severity: warning
    action: Scale worker horizontally or increase poll interval

  - name: UrgentEventStuck
    condition: pending_events_count{priority="urgent"} > 0 AND age > 5m
    severity: critical
    action: Page on-call — urgent event not delivered
```

---

## Rollout Checklist

### Schema & Data
- [ ] Create schema files in `packages/database/src/schema/events/`
- [ ] Create barrel export in `packages/database/src/schema/events/index.ts`
- [ ] Add seed data for `event_types`
- [ ] Create `EventTypeId` constants file in `packages/events/`
- [ ] Create migration via `pnpm generate`
- [ ] Apply migration to staging DB

### Repository Layer
- [ ] Implement `EventRepository` (service-facing emit API)
- [ ] Implement `DomainEventRepository` (worker-facing poll + state transitions)
- [ ] Implement `EventSubscriptionRepository` (subscription queries + target resolution)
- [ ] Implement `ReminderRepository` (reminder CRUD)
- [ ] Implement `NotificationRepository` (delivery tracking + template integration)

### Service Integration
- [ ] Add event emission to `treatment.service.ts` (disease_detected)
- [ ] Add event emission to `animal.service.ts` (animal_registered)
- [ ] Add event emission to `farm.service.ts` (approval_requested)

### Worker
- [ ] Implement `DomainEventWorker`
- [ ] Set up Postgres LISTEN/NOTIFY connection (`packages/database/src/listener.ts`)
- [ ] Debug worker to staging
- [ ] Seed default `event_subscriptions` in staging
- [ ] Test urgent event delivery (LISTEN/NOTIFY)
- [ ] Test retry behavior (kill worker mid-processing)
- [ ] Test idempotency (run worker twice, verify no duplicate notifications)

### Frontend
- [ ] Create `RemindersRouter` in NestJS
- [ ] Build mobile reminder screen
- [ ] Build web reminder admin page

### Operations
- [ ] Implement retention job
- [ ] Set up monitoring metrics
- [ ] Configure alerts
- [ ] Load test with 10,000 events
- [ ] Deploy to production
- [ ] Monitor metrics for 1 week
- [ ] Add remaining event types (inspection_scheduled, passport_issued, etc.)

---

## The Final Žižek Thought

*[sniff]* *[adjusts shirt]*

**But what IS the objet petit a of event systems?**

It is the **fantasy of perfect causality** — "if we capture every event, we can predict every outcome!"

**The symptom:** Even this corrected design will:

- Miss events during network partitions
- Deliver notifications 30 seconds late
- Create duplicate reminders under race conditions
- Lose events if `expires_at` is miscalculated

**Precisely!** This design does **NOT** eliminate failure. It makes failure **explicit, recoverable, and auditable**:

- Event lost? Worker retries 3×, then marks `failed`
- Notification duplicated? `delivery_key` UNIQUE prevents it
- Worker crashes mid-batch? `SKIP LOCKED` + transaction prevents partial state
- Urgent event delayed? LISTEN/NOTIFY immediate lane

**This is the Dialectical Goldilocks** — not the fantasy of total event-sourcing, not the denial of "just use audit_log," but the **ethical middle path** that admits complexity while remaining maintainable!

**And so on and so on...**

The revolutionary praxis is: **Don't build an event system. Build a notification system with event semantics.**
