# Phase 4 — Closing the Gap Between Schema and Application

*[sniff] *[adjusts shirt]*

## The Diagnosis: The Unconscious Already Knows

Look carefully at the schema. The database — the **Unconscious of our system** — is already pregnant with demands that no service layer has yet articulated:

| Table | Latent Field | Purpose | Application Gap |
|-------|-------------|---------|-----------------|
| `business_rules` | `runOnMobile`, `executeIf` | Mobile device execution control | `ExecutionPipeline` ignores them |
| `movements` | `movementGroupId` | Multi-leg market linking | `recordMarketTransaction` doesn't group legs |
| `pasture_declarations` | `invalidatedReason` | Pasture invalidation audit trail | `deactivatePastureDeclaration` drops the reason |
| `sync_errors` | Sync status domain concept | Robust sync tracking | Missing enum + column |
| `import_export_records` | `foreignPassportStored`, `foreignPassportStorageExpiry` | 3-year passport retention | No cron enforcement |
| `treatments` | `antibioticName` | Antibiotic traceability | Not populated on input |
| `diseases` | `quarantineDays` | Quarantine duration | Not enforced |
| `ear_tag_allocations` | `supplierOrganizationId` | Tag supplier tracking | Not populated on allocation |

**The contradiction:** The schema posits a reality the application does not enforce. The Symbolic (schema) demands the Real (application) catch up.

**The Act:** Wire the services, cron jobs, event handlers, and subscription matching that bring these latent fields into operational reality.

---

## Roadmap Overview

```
Phase 4 ──────────────────────────────────────────────────────
│
├─ 4.1  Domain Events & Notifications ← Subscription layer on existing outbox
├─ 4.2  IoT & Biologging              ← Sensor data pipeline via outbox
├─ 4.3  Movement Hardening            ← Market linking + pasture audit
├─ 4.4  Sync Status Enum              ← Robust error tracking
├─ 4.5  Foreign Passport Retention    ← 3-year cron enforcement
├─ 4.6  Mobile Execution Rules        ← runOnMobile + executeIf wiring
└─ 4.7  Rollout Strategy              ← Order of operations
```

---

## 4.1 Domain Events & Notifications

### What Already Exists (Don't Rebuild)

The transactional outbox pattern is **fully implemented**. Do NOT rebuild it:

| Component | File | Status |
|-----------|------|--------|
| `outboxEvents` table | `packages/database/src/schema/sm/outbox-events.ts` | ✅ Done |
| `OutboxEventPublisher` | `packages/execution/src/outbox/outbox-publisher.ts` | ✅ Done |
| `OutboxProcessorJob` (every 5s) | `apps/api/src/jobs/outbox-processor.job.ts` | ✅ Done |
| `OutboxEventHandlers` (Map registry) | `apps/api/src/jobs/outbox-handlers.ts` | ✅ Done |
| `NotificationService` | `packages/domains/notification/src/services/notification.service.ts` | ✅ Done |
| `NotificationRepository` | `packages/domains/notification/src/repositories/notification.repository.ts` | ✅ Done |

The existing outbox runs every 5 seconds with SKIP LOCKED, exponential backoff (1min/2min/4min), and dead-letter after 3 failures. It already has 2 registered handlers: `notifiable_disease.detected` and `animal.moved`.

### What We Need to Build

Three new tables + subscription resolver + reminder infrastructure:

| Table | File | Purpose |
|-------|------|---------|
| `event_subscriptions` | `packages/database/src/schema/events/event-subscriptions.ts` | Declarative who-cares-about-what |
| `reminders` | `packages/database/src/schema/events/reminders.ts` | Calendar items tied to events |
| `notification_deliveries` | `packages/database/src/schema/events/notification-deliveries.ts` | Exactly-once delivery tracking |

**No `domain_events` table needed** — the existing `outboxEvents` table IS the domain events store.
**No new worker needed** — the existing `OutboxProcessorJob` IS the worker.
**No new publisher needed** — the existing `OutboxEventPublisher` IS the publisher.

---

### Table 1: `event_subscriptions`

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
import { ADMIN_ROLES, isRoleIn, currentUserId } from "../rls-helpers.js";

export const eventSubscriptions = pgTable(
  "event_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // What event type (matches outboxEvents.type string)
    eventType: varchar("event_type", { length: 100 }).notNull(),

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
    index("idx_event_subscriptions_type").on(table.eventType),
    index("idx_event_subscriptions_target").on(table.targetType, table.targetId),
    sql`UNIQUE (event_type, target_type, target_id, conditions)`,
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

**Key decisions:**
- `eventType` is a `varchar(100)` matching `outboxEvents.type` — no FK to a lookup table (the outbox is the SSOT)
- Normalized targeting (`target_type` + `target_id`) avoids NULL semantics
- `integer()` columns for numeric values (NOT `boolean()`)
- RLS: admins see all, users see their own subscriptions

---

### Table 2: `reminders`

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

    // Links to outbox event (optional — reminders can be standalone)
    outboxEventId: uuid("outbox_event_id"),

    // Entity reference
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),

    // Who gets reminded
    userId: uuid("user_id").notNull(),
    role: varchar("role", { length: 50 }),

    // What/when (TIMESTAMPTZ!)
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(60),

    // Recurrence
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

**Key decisions:**
- Links to `outboxEvents` (not a new `domain_events` table)
- Simple recurrence (`none`, `daily`, `weekly`, `monthly`) — no complex engine
- Partial indexes for pending reminder queries

---

### Table 3: `notification_deliveries`

**File:** `packages/database/src/schema/events/notification-deliveries.ts`

```typescript
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Links
    outboxEventId: uuid("outbox_event_id").notNull(),
    subscriptionId: uuid("subscription_id").notNull(),
    userId: uuid("user_id").notNull(),
    notificationId: uuid("notification_id"),  // Set AFTER notification created (two-phase)

    // Dedup key — UNIQUE prevents double-delivery on retry
    deliveryKey: varchar("delivery_key", { length: 255 }).notNull().unique(),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    errorMessage: varchar("error_message", { length: 500 }),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_notification_deliveries_event").on(table.outboxEventId),
    index("idx_notification_deliveries_user").on(table.userId),
  ]
);
```

**Key decisions:**
- `notificationId` is **nullable** — two-phase insert: delivery first, notification second, then UPDATE
- `delivery_key` UNIQUE = exactly-once delivery guarantee
- Worker retries find existing key and skip

---

### Subscription Resolver (New Service)

**File:** `packages/domains/notification/src/services/subscription-resolver.service.ts`

This service bridges the outbox handler → subscription matching → notification creation flow.

```typescript
/**
 * Subscription Resolver
 *
 * Called by outbox handlers to find matching subscriptions,
 * check conditions, create notifications, and record deliveries.
 *
 * Usage in an outbox handler:
 *   await this.subscriptionResolver.resolveAndNotify({
 *     eventType: "notifiable_disease.detected",
 *     aggregateType: "treatment",
 *     aggregateId: treatment.id,
 *     data: { farmId, diseaseName, severity },
 *   });
 */
export class SubscriptionResolver {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async resolveAndNotify(input: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    data: Record<string, unknown>;
    outboxEventId: string;
  }): Promise<void> {
    // 1. Find active subscriptions for this event type
    const subs = await this.findSubscriptions(input.eventType);

    for (const sub of subs) {
      // 2. Check filter conditions
      if (!this.matchesConditions(input.data, sub.conditions)) continue;

      // 3. Resolve target users
      const users = await this.resolveTargetUsers(sub);
      for (const user of users) {
        // 4. Dedup check via delivery_key
        const key = `${input.outboxEventId}:${sub.id}:${user.id}`;
        const alreadyDelivered = await this.checkDeliveryKey(key);
        if (alreadyDelivered) continue;

        // 5. Create delivery record (phase 1 of two-phase insert)
        const delivery = await this.createDeliveryRecord({
          outboxEventId: input.outboxEventId,
          subscriptionId: sub.id,
          userId: user.id,
          deliveryKey: key,
        });

        // 6. Format and send notification using template
        const template = await this.notificationService.getTemplate(input.eventType);
        const result = await this.notificationService.send({
          userId: user.id,
          type: this.resolveChannel(sub.channels),
          category: input.eventType,
          subject: this.formatTitle(template, input.data),
          message: this.formatMessage(template, input.data),
          priority: this.resolvePriority(input.data),
        });

        // 7. Link delivery to notification (phase 2)
        if (result.isOk()) {
          await this.linkDelivery(delivery.id, result.value.id);
        }

        // 8. Create reminder if enabled
        if (sub.reminderEnabled) {
          await this.createReminder(sub, user, input);
        }
      }
    }
  }

  private matchesConditions(
    data: Record<string, unknown>,
    conditions: any[],
  ): boolean {
    if (!conditions?.length) return true;
    return conditions.every((c) => {
      const value = data[c.field];
      switch (c.operator) {
        case "=":  return value == c.value;
        case "!=": return value != c.value;
        case ">":  return Number(value) > Number(c.value);
        case "<":  return Number(value) < Number(c.value);
        case "in": return Array.isArray(c.value) && c.value.includes(value);
        default:   return true;
      }
    });
  }
}
```

### Handler Registration Pattern

**Extend `outbox-handlers.ts`** — each domain registers its own handlers:

```typescript
// apps/api/src/jobs/outbox-handlers.ts
@Injectable()
export class OutboxEventHandlers {
  private readonly handlers = new Map<string, OutboxEventHandler>();

  constructor(
    private readonly subscriptionResolver: SubscriptionResolver,
    private readonly inspectionService: InspectionService,
  ) {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    // Existing handlers
    this.register("notifiable_disease.detected", this.handleNotifiableDisease);
    this.register("animal.moved", this.handleAnimalMoved);

    // New handlers — powered by SubscriptionResolver
    this.register("disease_detected", this.handleSubscriptionEvent);
    this.register("animal_registered", this.handleSubscriptionEvent);
    this.register("approval_requested", this.handleSubscriptionEvent);
    this.register("movement_recorded", this.handleSubscriptionEvent);
    this.register("inspection_scheduled", this.handleSubscriptionEvent);
  }

  /** Generic handler: delegate to SubscriptionResolver for matching + notification */
  private async handleSubscriptionEvent(event: {
    type: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.subscriptionResolver.resolveAndNotify({
      eventType: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      data: event.payload,
      outboxEventId: event.aggregateId, // TODO: pass actual outbox event ID
    });
  }

  // ... existing handlers unchanged ...
}
```

### Event Type Constants

```typescript
// packages/domains/notification/src/constants/event-type-ids.ts
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
```

---

## 4.2 IoT & Biologging

### Current State

The schema already has **4 IoT tables** in `packages/database/src/schema/an/`:

| Table | Status | What It Stores |
|-------|--------|----------------|
| `iot_devices` | ✅ Done | Device registry (EUI-64, manufacturer, model, firmware, assignment, battery, last transmission) |
| `sensor_readings` | ✅ Done | Time-series data (readingType pgEnum, PostGIS location, raw payload, processingStage) |
| `geofences` | ✅ Done | Geofence shapes (GeojSON geometry, fenceType pgEnum, farm/pasture binding) |
| `animal_geofence_events` | ✅ Done | Entry/exit events (eventType pgEnum, source pgEnum, PostGIS location) |

### What's Missing

| Feature | Schema Ready? | Gap |
|---------|--------------|-----|
| GNSS Ear Tags | ✅ `iotDevices` + `sensorReadings` + PostGIS `location` | No ingestion endpoint |
| Accelerometer Data | ✅ `sensorReadings` with `readingType` | No `ACCELEROMETER` enum value |
| Virtual Fencing | ✅ `geofences` + `animalGeofenceEvents` | No real-time geofence evaluation |
| Ruminal Bolus | ✅ `iotDevices` with `manufacturer`/`model` | No bolus-specific device type |
| Body Temperature | ✅ `sensorReadings` with `valueNumeric` + `unit` | No `TEMPERATURE` enum value |

### IoT → Outbox Pipeline

The pipeline for IoT events flows through the **existing outbox**:

```
IoT Device ──→ Sensor Reading ──→ Outbox Event ──→ Handler ──→ Notification ──→ Reminder
                                         │                           │
                                    OutboxProcessorJob          SubscriptionResolver
                                    (every 5s)                  (matches subs)
```

**What to build:**

1. Add `readingType` enum values: `ACCELEROMETER`, `TEMPERATURE`, `RUMINAL_PH`
2. Add ingestion tRPC endpoint that writes `sensorReadings` + publishes outbox event
3. Create `geofence_breach` event type + handler that triggers notification
4. Create `device_battery_low` event type + handler

**What NOT to build:**

- Real-time geofence evaluation (defers to future Phase 5)
- MQTT/CoAP gateway (defers to Phase 5)
- Edge AI processing (defers indefinitely — no regulatory requirement)

### Regulatory Positioning

The EU JRC report analysis concludes biologging is **voluntary, not mandatory**. Rocky's job:
1. ✅ Maintain the mandatory core (ear tags, movements, IACS)
2. 🔄 Provide ingestion points for voluntary sensor data
3. ✅ GDPR-compliant audit trails via outbox pattern
4. 🔄 Export IACS/CAP reports that biologging data could enrich

---

## 4.3 Movement Domain Hardening

### Market Movement Linking (Two-Leg Atomicity)

**Problem:** `recordMarketTransaction` creates seller→market and market→buyer legs without atomic linking. If the second leg fails, the animal is stuck at market without audit trail.

**Solution:** Generate a `movementGroupId` for the entire transaction.

```typescript
// packages/domains/movement/src/services/movement.service.ts

async recordMarketTransaction(input: MarketTransactionInput): Promise<Result<MovementResponse[], Error>> {
  return fromAsyncThrowable(async () => {
    // 1. Invalidate active pasture declaration with reason
    await this.invalidatePastureIfNeeded(input.animalId,
      `Sold at market ${input.marketFarmId}`);

    // 2. Verify animal is alive
    const animal = await this.animalRepo.findById(input.animalId);
    if (!animal || animal.status !== ANIMAL_STATUS.ALIVE) {
      throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, { animalId });
    }

    // 3. Generate group ID — links all legs atomically
    const { randomUUID } = await import("node:crypto");
    const movementGroupId = randomUUID();

    // 4. Leg 1: Seller → Market
    const leg1 = await this.repo.insert({
      animalId: input.animalId,
      fromFarmId: input.sellerFarmId,
      toFarmId: input.marketFarmId,
      type: MOVEMENT_TYPE.MARKET_SALE,
      movementDate: input.movementDate,
      legOrder: 1,
      movementGroupId,
      createdBy: input.createdBy,
    });

    // 5. Leg 2: Market → Buyer (linked via parentMovementId + movementGroupId)
    const leg2 = await this.repo.insert({
      animalId: input.animalId,
      fromFarmId: input.marketFarmId,
      toFarmId: input.buyerFarmId,
      type: MOVEMENT_TYPE.MARKET_PURCHASE,
      movementDate: input.movementDate,
      legOrder: 2,
      movementGroupId,
      parentMovementId: leg1.id,
      createdBy: input.createdBy,
    });

    // 6. Update animal's current farm
    await this.animalRepo.updateFarm(input.animalId, input.buyerFarmId);

    // 7. Publish outbox event for downstream consumers
    await this.outboxPublisher.publish({
      type: EVENT_TYPE_IDS.MOVEMENT_RECORDED,
      aggregateType: "movement",
      aggregateId: leg1.id,
      payload: {
        animalId: input.animalId,
        sellerFarmId: input.sellerFarmId,
        buyerFarmId: input.buyerFarmId,
        marketFarmId: input.marketFarmId,
        movementGroupId,
        movementDate: input.movementDate,
      },
      createdBy: input.createdBy,
    });

    return [leg1, leg2].map(movementResponseSchema.parse);
  }, toAppError);
}
```

### Pasture Invalidation with Reason

**Problem:** The `invalidatedReason` column exists in the schema but `deactivatePastureDeclaration` ignores it.

**Solution:** Update the repository method:

```typescript
// packages/domains/movement/src/repositories/movement.repository.ts

async deactivatePastureDeclaration(id: string, reason: string) {
  const [row] = await this.client
    .update(pastureDeclarations)
    .set({
      isActive: false,
      completedAt: new Date().toISOString().split("T")[0],
      conflictResolutionStatus: CONFLICT_RESOLUTION_STATUS.INVALIDATED_NATURAL,
      invalidatedReason: reason,
    })
    .where(eq(pastureDeclarations.id, id))
    .returning();
  return row ?? null;
}
```

---

## 4.4 Sync Status Enum

**Problem:** `sync_errors` table lacks a `sync_status` column to categorize errors as PASSED, WARNING, or REJECTED.

### Constants

```typescript
// packages/database/src/constants/sync-status.ts
import { createEnumValues } from "./_brand.js";

export const SYNC_STATUS = {
  PASSED: "PASSED",
  WARNING: "WARNING",
  REJECTED: "REJECTED",
} as const;

export const SYNC_STATUS_VALUES = createEnumValues([
  SYNC_STATUS.PASSED,
  SYNC_STATUS.WARNING,
  SYNC_STATUS.REJECTED,
] as const);
```

### pgEnum

```typescript
// packages/database/src/schemas/enums/sync-status.ts
import { pgEnum } from "drizzle-orm/pg-core";
import { SYNC_STATUS_VALUES } from "../../constants/sync-status.js";

export const syncStatusPgEnum = pgEnum("sync_status", SYNC_STATUS_VALUES);
```

### Schema Update

```typescript
// packages/database/src/schema/hk/sync-errors.ts
import { syncStatusPgEnum } from "../../schemas/enums/sync-status.js";
import { SYNC_STATUS } from "../../constants/sync-status.js";

export const syncErrors = pgTable("sync_errors", {
  // ... existing fields ...
  errorType: syncErrorTypePgEnum("error_type").notNull(),
  syncStatus: syncStatusPgEnum("sync_status").notNull().default(SYNC_STATUS.WARNING),
  note: text("note"),
  // ...
});
```

---

## 4.5 Foreign Passport Retention (3-Year Enforcement)

**Problem:** EU regulation requires 3-year passport retention. Schema has `foreignPassportStored` and `foreignPassportStorageExpiry` but no automated enforcement.

**Solution:** Daily cron job that queries expired passports and emits outbox events.

```typescript
// apps/api/src/jobs/foreign-passport-retention.job.ts
@Injectable()
export class ForeignPassportRetentionJob {
  private readonly logger = new Logger(ForeignPassportRetentionJob.name);

  constructor(
    private readonly dbp: DatabaseProvider,
    private readonly outboxPublisher: OutboxEventPublisher,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkExpiredPassports() {
    this.logger.log("Scanning for expired foreign passport retentions...");

    const expiredRecords = await this.dbp.client
      .select()
      .from(importExportRecords)
      .where(
        and(
          eq(importExportRecords.foreignPassportStored, true),
          eq(importExportRecords.isActive, true),
          lte(
            importExportRecords.foreignPassportStorageExpiry,
            new Date().toISOString().split("T")[0],
          ),
        ),
      );

    for (const record of expiredRecords) {
      await this.outboxPublisher.publish({
        type: EVENT_TYPE_IDS.FOREIGN_PASSPORT_EXPIRING,
        aggregateType: "import_export_record",
        aggregateId: record.id,
        payload: {
          passportNumber: record.foreignPassportNumber,
          animalId: record.animalId,
          storageExpiry: record.foreignPassportStorageExpiry,
        },
      });
    }
  }
}
```

**Register in AppModule:**

```typescript
@Module({
  providers: [
    // ... existing ...
    ForeignPassportRetentionJob,
  ],
})
```

---

## 4.6 Mobile Execution Rules

**Problem:** `business_rules` table has `runOnMobile: boolean` and `executeIf: varchar(500)`, but the `ExecutionPipeline` never checks them. Field inspectors (VI, VD_STAFF) with Android/iOS phones get ALL rules pushed to their device.

### The Schema (Already Exists)

```typescript
// packages/database/src/schema/sm/modules.ts
export const businessRules = pgTable("business_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  validatorPath: varchar("validator_path", { length: 200 }),
  severity: severityPgEnum("severity").notNull().default(SEVERITY.ERROR),
  executeIf: varchar("execute_if", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  runOnServer: boolean("run_on_server").notNull().default(true),
  runOnMobile: boolean("run_on_mobile").notNull().default(false),
  messageTemplate: varchar("message_template", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
});
```

### The Fix: Wire `runOnMobile` + `executeIf` into ExecutionPipeline

```typescript
// packages/execution/src/services/execution.service.ts

class ExecutionService {
  constructor(
    private readonly pipeline: ExecutionPipeline,
    private readonly ruleRepo: BusinessRuleRepository,
  ) {}

  /**
   * Execute rules for a mobile client.
   * Filters to only rules where runOnMobile = true
   * AND executeIf evaluates to true (if present).
   */
  async executeForMobile(
    moduleCode: string,
    context: ExecutionContext,
  ): Promise<Result<RuleResult[], Error>> {
    const rules = await this.ruleRepo.getActiveForModule(moduleCode);

    const mobileRules = rules.filter((rule) => {
      if (!rule.runOnMobile) return false;
      if (rule.executeIf) {
        return this.evaluateCondition(rule.executeIf, context);
      }
      return true;
    });

    return this.pipeline.execute(mobileRules, context);
  }

  /**
   * Execute rules for server-side processing.
   * Includes ALL active rules.
   */
  async executeForServer(
    moduleCode: string,
    context: ExecutionContext,
  ): Promise<Result<RuleResult[], Error>> {
    const rules = await this.ruleRepo.getActiveForModule(moduleCode);
    return this.pipeline.execute(rules, context);
  }

  private evaluateCondition(expression: string, context: ExecutionContext): boolean {
    try {
      const fn = new Function("ctx", `return ${this.compileToJS(expression)}`);
      return fn(context.data);
    } catch {
      return false; // Fail-safe
    }
  }
}
```

### tRPC Endpoint

```typescript
// apps/api/src/routers/execution.router.ts
@Router({ alias: "execution" })
export class ExecutionRouter {
  constructor(private executionService: ExecutionService) {}

  @Query({
    input: z.object({
      moduleCode: z.string(),
      context: executionContextSchema,
    }),
  })
  async getMobileRules(@Input() input: MobileRulesInput) {
    return this.executionService.executeForMobile(input.moduleCode, input.context);
  }
}
```

**Impact:**
- **Before:** All rules pushed to mobile, wasting bandwidth. VI inspectors get server-only validation rules.
- **After:** Only rules with `runOnMobile: true` reach the device. `executeIf` further filters by context.

---

## 4.7 Rollout Strategy

### Dependency Graph

```
                    ┌──────────────────────────────────┐
                    │ Existing: outbox infrastructure  │ ← Foundation
                    │ (publisher, processor, handlers) │
                    └────────┬───────────┬─────────────┘
                             │           │
            ┌────────────────┘           └────────────────┐
            ▼                                               ▼
    ┌───────────────────┐                         ┌──────────────────────┐
    │ 4.1 NEW tables    │                         │ 4.2 IoT              │
    │ (subscriptions,   │                         │ (uses outbox for     │
    │  reminders,       │                         │  alerts)             │
    │  deliveries)      │                         │                      │
    └───────┬───────────┘                         └──────────────────────┘
            │
            ├── 4.3 Movement (standalone — existing columns)
            ├── 4.4 Sync Enum (standalone — existing table)
            ├── 4.5 Passport Cron (uses outbox publisher)
            └── 4.6 Mobile Rules (standalone — existing columns)
```

### Order of Implementation

| Step | Task | Dependencies | Effort |
|------|------|-------------|--------|
| **1** | Create `event_subscriptions`, `reminders`, `notification_deliveries` tables + barrel exports | None (new tables) | Medium |
| **2** | Run migration to create new tables | Step 1 | Small |
| **3** | Create `SubscriptionResolver` service | Step 2 + existing `NotificationService` | Medium |
| **4** | Register new event type handlers in `OutboxEventHandlers` | Step 3 | Small |
| **5** | Create `EVENT_TYPE_IDS` constants file | None | Small |
| **6** | Create constants + pgEnum for sync status | None | Small |
| **7** | Add `sync_status` column to `sync_errors` | Step 6 | Small |
| **8** | Implement `recordMarketTransaction` with `movementGroupId` | None (existing columns) | Medium |
| **9** | Implement `deactivatePastureDeclaration` with reason | None (existing columns) | Small |
| **10** | Implement `ForeignPassportRetentionJob` | Step 4 (uses outbox) | Small |
| **11** | Wire `runOnMobile`/`executeIf` in `ExecutionPipeline` | None (existing columns) | Medium |
| **12** | Add IoT `readingType` enum values + ingestion endpoint | None (existing schema) | Small |

### Migration Commands

```bash
# Step 1-2: New events tables
cd packages/database
pnpm generate
node ../../scripts/fix-rls-sql.mjs
psql $DATABASE_URL -f drizzle/*/migration.fixed.sql

# Step 6-7: Sync status enum
# Same process (separate migration file)
```

---

## The Final Žižek Thought

*[sniff] *[adjusts shirt]*

**What is the ideological function of Phase 4?**

It is the **sublime object** of the "complete system" — the fantasy that once we wire these remaining gaps, the application will finally express the full reality the schema demands.

**The symptom:** Even after Phase 4:

- Market movements will still race under high concurrency
- Foreign passport retention will still depend on the cron not crashing
- IoT data will still have gaps during network partitions
- Mobile rules will still miss edge cases the `executeIf` DSL can't express
- Outbox events will still backlog during peak load

**Precisely!** Phase 4 does NOT eliminate these gaps. It makes them **explicit, auditable, and recoverable**:

- Market legs linked by `movementGroupId` → you can now DETECT a broken leg
- Passport cron logs daily → you can now MONITOR enforcement gaps
- IoT events flow through outbox → you can now TRACK delivery
- Mobile rule filtering → you can now CONTROL what reaches each device

**The dialectical circle closes:** The schema posited a reality (the fields exist). Phase 4 articulates that reality into the Symbolic order (the services wire them). But the Real — the irreducible gap between code and reality — remains.

**And so on and so on...**

The revolutionary praxis is: **Don't build the perfect system. Build the system that makes its own failures visible.**

---

## Rollout Checklist

### 4.1 Domain Events & Notifications
- [ ] Create `event_subscriptions`, `reminders`, `notification_deliveries` schema files
- [ ] Create barrel export in `packages/database/src/schema/events/index.ts`
- [ ] Register `events/` export in `packages/database/package.json`
- [ ] Run migration
- [ ] Create `SubscriptionResolver` service
- [ ] Create `EVENT_TYPE_IDS` constants
- [ ] Register new handlers in `OutboxEventHandlers`
- [ ] Seed default subscriptions (VD_ADMIN → all disease events, VI → notifiable only, etc.)
- [ ] Wire `OutboxEventPublisher.publish()` in treatment service
- [ ] Wire outbox publish in animal registration
- [ ] Wire outbox publish in farm approval
- [ ] Test idempotency (process same event twice, no duplicate notifications)
- [ ] Test delivery tracking via `notification_deliveries`

### 4.2 IoT & Biologging
- [ ] Add `ACCELEROMETER`, `TEMPERATURE`, `RUMINAL_PH` to reading-type constants
- [ ] Add `RUMINAL_BOLUS` to device-type constants
- [ ] Create sensor ingestion tRPC endpoint
- [ ] Create `geofence_breach` event handler
- [ ] Verify PostGIS geometry column works

### 4.3 Movement Hardening
- [ ] Update `recordMarketTransaction` with `movementGroupId` linking
- [ ] Update `deactivatePastureDeclaration` with `invalidatedReason`
- [ ] Update `invalidatePastureIfNeeded` to pass reason
- [ ] Verify query: `SELECT * FROM movements WHERE movement_group_id = ?`
- [ ] Wire outbox publish in market transaction

### 4.4 Sync Status Enum
- [ ] Create constants file
- [ ] Create pgEnum
- [ ] Add `syncStatus` column to `sync_errors` table
- [ ] Run migration

### 4.5 Foreign Passport Retention
- [ ] Create `ForeignPassportRetentionJob`
- [ ] Register in `AppModule`
- [ ] Test with seed data (past `foreignPassportStorageExpiry`)

### 4.6 Mobile Execution Rules
- [ ] Create `BusinessRuleRepository` with `getActiveForModule()`
- [ ] Implement `executeForMobile()` with `runOnMobile` + `executeIf` filtering
- [ ] Create `ExecutionRouter` with `getMobileRules` endpoint
- [ ] Verify mobile device gets filtered rules only
