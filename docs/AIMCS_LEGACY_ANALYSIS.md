# AIMCS Legacy System Analysis & Modern Transition Blueprint

> Based on PDF documents extracted from `/run/media/goce/New Volume/Za Gotze/TPC/`
> Source files: SM.PDF, HK.PDF, Analises.PDF, Eartags.PDF, TPC_PDA_v1_2.pdf,
> Workflow 17-04-03.pdf, FS -registration_MK(v0.91).pdf, FS - HK_MK(v1.0).pdf,
> FS -eartags_MK(v1.0).pdf

---

## 1. Document Inventory

| Document                            | Type                          | Pages | Content                                                                                                                               |
| ----------------------------------- | ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **SM.PDF**                          | Oracle Designer Report        | 58    | System Management schema — users, roles, sessions, business rules, modules, org hierarchy, privileges, code tables, system parameters |
| **HK.PDF**                          | Oracle Designer Report        | 25    | Holder Keeper schema — addresses, admin units, communes, zip codes, states, farms (KMG), subjects, HK-on-farm relationships           |
| **Analises.PDF**                    | Oracle Designer Report        | 16    | Risk analysis schema — analysis definitions, queries, scheduled runtimes, per-farm results                                            |
| **Eartags.PDF**                     | Oracle Designer Report        | 28    | Ear tag management — contingents, takeovers/distribution, orders, tag inventory, org types                                            |
| **TPC_PDA_v1_2.pdf**                | Technical Programming Concept | 29    | PDA system architecture — offline SQL CE database, ActiveSync sync, business rules engine, two-phase movements, temporary tables      |
| **Workflow 17-04-03.pdf**           | Business Workflow Spec        | 36    | 25 workflow instances: census, registration, movements, births, slaughter, markets, inspections, error correction                     |
| **FS - registration_MK(v0.91).pdf** | Functional Spec               | 16    | Registration & movements: normal, stillborn/death, slaughter, pasture, arrival/departure, import/export                               |
| **FS - HK_MK(v1.0).pdf**            | Functional Spec               | 12    | Holder Keeper module: hierarchy, flat file import, PDA correction workflow, VD approval                                               |
| **FS - eartags_MK(v1.0).pdf**       | Functional Spec               | 8     | Ear tag lifecycle: generation, ordering, supplier contingent, delivery, cancellation                                                  |

---

## 2. Legacy System Architecture

### 2.1 Technology Stack (circa 2004)

```
┌─────────────────────────────────────────────────────┐
│                  CENTRAL DATABASE                    │
│                     Oracle                           │
│  ┌─────────┐ ┌────────┐ ┌────────┐ ┌──────────┐   │
│  │ SM: Sys │ │ HK:    │ │ ET:    │ │ GN: Risk │   │
│  │ Mgmt    │ │Holder  │ │Eartags │ │ Analysis │   │
│  └─────────┘ └────────┘ └────────┘ └──────────┘   │
│              PL/SQL Business Rules Engine            │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │  Web Forms (Oracle Forms)  │
         │  CPC / VD                  │
         └───────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │   Batch File Sync       │
          │   (Text Files via IAS)  │
          └────────────┬────────────┘
                       │ ActiveSync
          ┌────────────┴────────────┐
          │   PDA (Windows CE)      │
          │   SQL CE Database       │
          │   .NET C# App           │
          │   Barcode Scanner       │
          └─────────────────────────┘
```

### 2.2 Core Tables (Oracle Schema)

#### System Management (SM) — `SM.PDF`

| Table                | Purpose                      | Key Columns                                           |
| -------------------- | ---------------------------- | ----------------------------------------------------- |
| `SM_SESSIONS`        | User sessions                | ID_SESSION, ID_USER, ID_LANGUAGE, ID_MODULE           |
| `SM_USERS`           | System users                 | ID_USER, USERNAME, PASSWORD, ID_ORGANIZATION          |
| `SM_GROUPS`          | Roles                        | ID_GROUP, NAME                                        |
| `SM_GRP_PRIVS`       | Role-privilege mapping       | ID_GRP_PRIV, ID_GROUP, ID_PRIVILEGE, ID_SCHEMA        |
| `SM_PRIVILEGES`      | Privilege definitions        | ID_PRIVILEGE, NAME, TYPE                              |
| `SM_MODULES`         | Application modules          | ID_MODULE, NAME, TYPE, ORDER_SEQ                      |
| `SM_MODULE_ELEMENTS` | UI element config            | ID_MODULE_ELMENT, NAME, PROMPT_TEXT, TYPE             |
| `SM_MODULE_BR`       | Module-business rule binding | ID_MODULE_BR, ID_MODULE, ID_BUSINESS_RULE, EXECUTE_IF |
| `SM_BUSINESS_RULES`  | Business rules registry      | ID_BUSINESS_RULE, NAME, DESCRIPTION                   |
| `SM_MESSAGES`        | Localized messages           | ID_MESSAGE, TEXT, ID_LANGUAGE, TYPE                   |
| `SM_LOG_CODES`       | Code tables / lookup values  | ID_LOG_CODE, NAME, CODE, ID_LANGUAGE, DISP_CODE       |
| `SM_SYS_PARAMS`      | System parameters            | ID_SYS_PARAM, CODE, VALUE                             |
| `SM_ORGANIZATIONS`   | Organization hierarchy       | ID_ORGANIZATION, NAME1-3, ADDRESS1-3, TYPE            |
| `SM_ORG_AREA`        | Organization areas (commune) | ID_ORGANIZATION, ID_COMMUNE                           |
| `SM_LANGUAGES`       | Supported languages          | ID_LANGUAGE, NAME                                     |
| `SM_SCHEMAS`         | Database schemas             | ID_SCHEMA, NAME                                       |

#### Holder Keeper (HK) — `HK.PDF`

| Table            | Purpose                            | Key Columns                                                                                                        |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `HK_STATES`      | States/regions                     | ID_STATE, TEXT, SHORT_NAME                                                                                         |
| `HK_ZIP_CODES`   | ZIP codes (per state)              | ID_ZIP_CODE, NAME, ID_STATE                                                                                        |
| `HK_COMMUNES`    | Communes/cities                    | ID_COMMUNE, NAME                                                                                                   |
| `HK_ADMIN_UNITS` | Administrative units               | ID_ADMIN_UNIT, NAME, AU_ID                                                                                         |
| `HK_ADDRESSES`   | Physical addresses                 | HS_MID, CITY, STREET, HN, HN_ADD, ID_ZIP_CODE, ID_COMMUNE, ID_ADMIN_UNIT, X_COORDINATE, Y_COORDINATE, Z_COORDINATE |
| `HK_KMG`         | Farms (KMG code table)             | KMG_MID, HS_MID, TYPE, HOME_NAME, KMG_MID_SUP                                                                      |
| `HK_SUBJ`        | Subjects (persons/orgs)            | ID_SUBJ, SHORT_NAME, FIRST_NAME, LAST_NAME, HS_MID, VAT_NO, PHONE_NO                                               |
| `HK_KMG_SUBJ`    | Holder Keeper on Farm relationship | ID_KMG_SUBJ, ID_SUBJ, KMG_MID, ROLE                                                                                |
| `HK_SYNC_ERRORS` | PDA sync error tracking            | ID_SYNC_ERROR, KMG_MID, HS_MID, ID_SUBJ, TYPE, NOTE                                                                |

#### Ear Tags (ET) — `Eartags.PDF`

| Table               | Purpose                    | Key Columns                                                |
| ------------------- | -------------------------- | ---------------------------------------------------------- |
| `ET_CONTINGENTS`    | Ear tag contingents        | ID_CONTINGENT, EARTAG_NO, CONTINGENT_TYPE, ID_ORGANIZATION |
| `ET_TAKEOVERS`      | Tag takeovers/distribution | ID_TAKEOVER, ID_ORG_TYPE, STATUS                           |
| `ET_TAKEOVER_FILES` | Takeover file records      | ID_TAKEOVER_FILE, LINE, ID_SESSION                         |
| `ET_ORDERS`         | Orders for tags            | ID_ORDER, ORDER_TYPE, EARTAGS_NO, KMG_MID, STATUS          |
| `ET_CONT_TAGS`      | Individual tag tracking    | ID_CONT_TAG, ID_CONTINGENT, ID_ORDER, STATE, ID_ANIMAL     |
| `ET_ORG_TYPES`      | Organization types in ET   | ID_ORG_TYPE, ID_ORGANIZATION, TAKEOVER_TYPE                |

#### Risk Analysis (GN) — `Analises.PDF`

| Table              | Purpose                   | Key Columns                              |
| ------------------ | ------------------------- | ---------------------------------------- |
| `GN_ANALYSES`      | Risk analysis definitions | ID_ANALYSIS, NAME, ID_RA_QUERY           |
| `GN_ANLS_QUERIES`  | SQL queries for analysis  | ID_ANLS_QUERY, NAME, TEXT                |
| `GN_ANLS_PARAMS`   | Analysis parameters       | ID_ANLS_PARAM, NAME, VALUE, PARAM_WEIGHT |
| `GN_ANLS_RUNTIMES` | Scheduled runs            | ID_ANLS_RUNTIME, D_SCHEDULE, ID_JOB      |
| `GN_ANLS_RESULTS`  | Per-farm results          | ID_ANLS_RESULT, ID_FARM, RESULT          |

---

## 3. Key Legacy Processes (from Workflow 17-04-03.pdf)

### 3.1 All 25 Workflow Instances

| #     | Instance                         | Legacy Method                                                       | Pain Points                          |
| ----- | -------------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| 1     | **Farm Census**                  | Paper census → service company data entry → VD checks               | Slow, error-prone, double data entry |
| 2     | **New Keeper/Holding**           | Census form → CPC → compare against DB → assign ID                  | Manual drill-down hierarchy          |
| 3     | **Change Keeper/Holding**        | PDA capture → temp tables → VD checks signed paper                  | 3-step approval delay                |
| 4     | **First Ear Tag Allocation**     | CPC allocates series → manufacturer → VS shipment                   | No real-time tracking                |
| 5     | **Routine Ear Tag Allocation**   | VS requests by fax/mail → CPC checks and ships                      | Batch processing, delays             |
| 6     | **Replacement Ear Tags**         | Keeper reports loss → VS orders via web → CPC prints weekly         | Weekly batch, slow                   |
| 7     | **Withdrawal of Ear Tags**       | VS/CPC requests withdrawal → CPC blocks in DB                       | Manual request process               |
| 8     | **Birth Notification**           | Farmer phones/ mails → VS enters → daily action list → 20d tagging  | Phone/mail, delayed, 20-day alert    |
| 9     | **Routine Tagging on Spot**      | PDA scan holding ID + ear tags → upload daily                       | Offline upload, paper receipts       |
| 10    | **First Tagging**                | PDA scan → eldest first → no mother check                           | Manual age sequencing                |
| 11    | **Cattle Passports**             | CPC prints → ships to VS → VS gives to keeper                       | Printing & shipping delay            |
| 12    | **Movements/Death via PDA**      | PDA download → field check → upload → CPC review                    | Two-phase movement, upload delay     |
| 13    | **Movements via Postcards**      | Farmer mails postcard → VS enters to DB                             | Slow, error-prone                    |
| 14    | **Slaughter**                    | VI collects ear tags + passports → destroys tags → enters data      | Manual destruction, data entry       |
| 15    | **Livestock Markets**            | VS scans seller → scans animals → scans buyer → creates 4 movements | 4-step complex movement creation     |
| 16    | **Alpine Grazing**               | Collective list → sent to VS → data entry                           | Batch list processing                |
| 17    | **Re-prints**                    | Order form → VS → CPC → reprint → ship                              | Multi-step delay                     |
| 18    | **On-Spot Inspections**          | CPC runs risk analysis → prints forms → VI inspects                 | Paper-based inspection               |
| 19-21 | **Import/Export**                | Multiple types: EU rules, 3rd country, export                       | Complex rules per origin             |
| 22    | **Error Correction: Field**      | VS spots error → corrects on PDA → temp tables → VD paper           | 3-step correction                    |
| 23    | **Error Correction: A Priori**   | CPC catches at entry → rejects → VS re-enters                       | Rejection without context            |
| 24    | **Error Correction: Posteriori** | Regular plausibility checks → corrections later                     | Reactive, batch, complex             |
| 25    | **I&R Archive**                  | Archive management                                                  | Long-term storage                    |

### 3.2 Legacy Hierarchy for HK Data

```
States
  └── Zip Codes
       └── Addresses
            ├── Communes (optional)
            └── Admin Units (optional)
                 ├── Farms (HK_KMG)
                 │    └── Holder Keeper on Farm (HK_KMG_SUBJ)
                 └── Subjects (HK_SUBJ) — persons/orgs
```

**Rule:** Each level must exist before the next can be created — strict drill-down.

### 3.3 Two-Phase Movement Structure

```
┌─────────────────────────────────────────────────────────┐
│                    MOVEMENT                              │
│                                                          │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │   DEPARTURE      │         │    ARRIVAL       │       │
│  │   (Phase 1)      │ ───►   │    (Phase 2)     │       │
│  │                  │         │                  │       │
│  │  - inserter      │         │  - inserter      │       │
│  │  - date          │         │  - date          │       │
│  │  - location      │         │  - location      │       │
│  └─────────────────┘         └─────────────────┘        │
└─────────────────────────────────────────────────────────┘

Special cases:
  - Sale/Market: 4 movements (off-seller, on-market, off-market, on-buyer)
  - Pasture: auto-generated daily movements
  - Slaughter: arrival at slaughterhouse + death
```

### 3.4 Ear Tag Number Generation

```
Format: 8 digits starting from 10000001
Check digit = MOD(10, SUM(
    3*digit1 + 5*digit2 + 7*digit3 + 11*digit4 +
    13*digit5 + 17*digit6 + 19*digit7
))

Status Lifecycle:
  NEW → AVAILABLE → COLLECTED → DELIVERED → CANCELLED
```

### 3.5 PDA Farm ID Generation (Offline)

```
next_farm_id = PDA_DEVICE_ID * 100000 + next_counter_value_on_pda
```

Fictive IDs are later replaced with real IDs when VD confirms the record.

### 3.6 PDA Sync Architecture

```
┌────── PDA ──────┐       ┌───── PC ──────┐       ┌── Server ──┐
│                  │       │               │       │            │
│  SQL CE DB       │──────►│  ActiveSync   │──────►│  Oracle    │
│  Business Rules  │◄──────│  Browser      │◄──────│  IAS       │
│  (subset)        │       │               │       │            │
└──────────────────┘       └───────────────┘       └────────────┘
        │                                                │
        │  Incremental sync only (changes since last)    │
        │  Full sync on first use or data loss           │
        ▼                                                ▼
  Offline-first                                    Business Rules
  Temp tables for                                 Check + Store
  pending VD approval                             or Reject
```

---

## 4. Modern Turborepo Transition Blueprint

### 4.1 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   TURBOREPO MONOREPO                        │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ @prasici/db │  │@prasici/     │  │ @prasici/        │  │
│  │  Drizzle     │  │validators    │  │  notifications   │  │
│  │  Schema      │  │ Zod Rules    │  │  WebSocket       │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                │                    │             │
│  ┌──────┴────────────────┴────────────────────┴──────────┐ │
│  │              @prasici/trpc-router                      │ │
│  │         (Type-safe API Layer)                          │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────┼──────────────────────────────────┐│
│  │          apps/        │                                  ││
│  │  ┌──────────┐ ┌──────┴───────┐ ┌──────────────────┐    ││
│  │  │ nextjs   │ │ expo-mobile  │ │ nextjs-admin     │    ││
│  │  │ VD Admin │ │ Field App    │ │ Dashboard         │    ││
│  │  │ Dashboard│ │ (Offline)    │ │ (Management)     │    ││
│  │  └──────────┘ └──────────────┘ └──────────────────┘    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              PostgreSQL (SSOT)                          ││
│  │  Drizzle ORM + pgcrypto + PostGIS (for coordinates)    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Legacy-to-Modern Table Mapping

#### System Management (SM)

| Legacy Oracle Table | Modern Drizzle Schema (PostgreSQL) | Notes                              |
| ------------------- | ---------------------------------- | ---------------------------------- |
| `SM_SESSIONS`       | `sessions`                         | JWT-based, no session table needed |
| `SM_USERS`          | `users`                            | Supabase/Auth.js compatible        |
| `SM_GROUPS`         | `roles`                            | RBAC with Zod enums                |
| `SM_GRP_PRIVS`      | `role_permissions`                 | CASL or custom RBAC                |
| `SM_PRIVILEGES`     | `permissions`                      | Resource-based permissions         |
| `SM_MODULES`        | `modules`                          | App router pages                   |
| `SM_MODULE_BR`      | `module_validator_rules`           | Zod-to-module mapping              |
| `SM_BUSINESS_RULES` | `business_rules`                   | Managed in DB + Zod refs           |
| `SM_LOG_CODES`      | `code_tables`                      | Zod enum code tables               |
| `SM_SYS_PARAMS`     | `system_parameters`                | Config map, cached                 |
| `SM_ORGANIZATIONS`  | `organizations`                    | Org hierarchy with `parent_id`     |
| `SM_ORG_AREA`       | `org_areas`                        | Org-to-commune mapping             |
| `SM_LANGUAGES`      | `languages`                        | i18n (next-intl)                   |
| `SM_MESSAGES`       | `messages`                         | i18n message catalog               |

#### Holder Keeper (HK)

| Legacy Oracle Table | Modern Drizzle Schema | Notes                                                 |
| ------------------- | --------------------- | ----------------------------------------------------- |
| `HK_STATES`         | `states`              | Seed data, linked to GeoNames                         |
| `HK_ZIP_CODES`      | `zip_codes`           | With `state_id` FK                                    |
| `HK_COMMUNES`       | `communes`            | Geocoded                                              |
| `HK_ADMIN_UNITS`    | `admin_units`         | Administrative hierarchy                              |
| `HK_ADDRESSES`      | `addresses`           | PostGIS `geometry(Point, 4326)` replaces X/Y/Z coords |
| `HK_KMG`            | `farms`               | `verification_status` instead of temp tables          |
| `HK_SUBJ`           | `subjects`            | Persons/orgs                                          |
| `HK_KMG_SUBJ`       | `farm_subjects`       | M2M with ROLE enum                                    |
| `HK_SYNC_ERRORS`    | `sync_errors`         | Real-time validator error log                         |

#### Ear Tags (ET)

| Legacy Oracle Table | Modern Drizzle Schema | Notes                            |
| ------------------- | --------------------- | -------------------------------- |
| `ET_CONTINGENTS`    | `ear_tag_contingents` | Tag number allocation            |
| `ET_TAKEOVERS`      | `ear_tag_takeovers`   | Distribution tracking            |
| `ET_ORDERS`         | `ear_tag_orders`      | Order lifecycle with status enum |
| `ET_CONT_TAGS`      | `ear_tag_inventory`   | Individual tag tracking          |
| `ET_ORG_TYPES`      | `et_org_types`        | Organization types               |

#### Animals & Movements (new — inferred from FS documents)

| Concept             | Modern Drizzle Schema  | Notes                                        |
| ------------------- | ---------------------- | -------------------------------------------- |
| Animal Registration | `animals`              | With birth, breed, parent FKs                |
| Movement            | `movements`            | Unified single-phase (not departure+arrival) |
| Birth Notification  | `birth_notifications`  | Real-time via WebSocket                      |
| Slaughter Record    | `slaughter_records`    | With slaughterhouse link                     |
| Pasture Declaration | `pasture_declarations` | Seasonal movement plans                      |
| Inspection          | `inspections`          | Tied to risk analysis results                |

#### Risk Analysis (GN)

| Legacy Table       | Modern Drizzle Schema | Notes                |
| ------------------ | --------------------- | -------------------- |
| `GN_ANALYSES`      | `risk_analyses`       | Analysis definitions |
| `GN_ANLS_QUERIES`  | `analysis_queries`    | SQL/Prisma queries   |
| `GN_ANLS_PARAMS`   | `analysis_parameters` | Weight & thresholds  |
| `GN_ANLS_RUNTIMES` | `analysis_schedules`  | Cron jobs            |
| `GN_ANLS_RESULTS`  | `analysis_results`    | Farm risk scores     |

### 4.3 Business Rules Migration to Zod

#### Legacy Business Rules → Zod Validators (`@prasici/validators`)

```typescript
// @prasici/validators/src/registration.ts

// Legacy rule: "Mother must be alive at time of birth"
export const motherAliveAtBirth = z.object({
  motherId: z.string(),
  birthDate: z.date(),
  motherStatus: z.enum(["ALIVE", "DEAD", "SOLD", "EXPORTED"]),
}).refine(
  (data) => data.motherStatus === "ALIVE",
  { message: "Mother must be alive at the time of birth" }
);

// Legacy rule: "Mother must be at least 17 months old"
export const motherMinAge = z.object({
  motherBirthDate: z.date(),
  birthDate: z.date(),
}).refine(
  (data) => {
    const ageInMonths = differenceInMonths(data.birthDate, data.motherBirthDate);
    return ageInMonths >= 17;
  },
  { message: "Mother must be at least 17 months old" }
);

// Legacy rule: "Time between two calving dates must be ≥ calving_period"
export const calvingInterval = (periodDays: number) =>
  z.object({
    lastCalvingDate: z.date(),
    birthDate: z.date(),
  }).refine(
    (data) => differenceInDays(data.birthDate, data.lastCalvingDate) >= periodDays,
    { message: `Calving interval must be at least ${periodDays} days` }
  );

// Legacy: Ear tag check digit validation (MOD 10 formula)
export const earTagCheckDigit = z.string().regex(/^\d{8}$/).refine(
  (tag) => {
    const digits = tag.split("").map(Number);
    const weights = [3, 5, 7, 11, 13, 17, 19];
    const checksum = digits.slice(0, 7).reduce(
      (sum, d, i) => sum + weights[i] * d, 0
    );
    return digits[7] === checksum % 10;
  },
  { message: "Invalid ear tag check digit" }
);

// Legacy: Farm ID check digit (sum-product mod 10)
export const farmIdCheckDigit = z.string().regex(/^\d{9}$/).refine(
  (id) => { /* sum-product mod 10 logic */ },
  { message: "Invalid farm ID check digit" }
);
```

#### System Parameter Integration

```typescript
// Legacy SM_SYS_PARAMS → Config module
export const systemParams = z.object({
  calvingPeriodDays: z.number().min(300).max(400).default(365),
  minMotherAgeMonths: z.number().min(12).max(24).default(17),
  birthNotificationDays: z.number().min(1).max(30).default(7),
  taggingDeadlineDays: z.number().min(5).max(60).default(20),
  slaughterMinAgeDays: z.number().min(1).max(365).default(25),
  orderMinIntervalDays: z.number().min(30).max(365).default(120),
  maxOrdersPerYear: z.number().min(1).max(12).default(4),
});
```

### 4.4 Module Structure

```
prasici/
├── apps/
│   ├── nextjs-admin/          # VD Admin Dashboard (Next.js)
│   │   ├── app/
│   │   │   ├── (auth)/login
│   │   │   ├── dashboard/
│   │   │   ├── holdings/      # Farm registry
│   │   │   ├── keepers/       # Holder keeper registry
│   │   │   ├── animals/       # Animal registration
│   │   │   ├── movements/     # Movement management
│   │   │   ├── eartags/       # Tag ordering & management
│   │   │   ├── inspections/   # On-spot inspections
│   │   │   ├── birth-notifications/ # Birth queue & alerts
│   │   │   ├── risk-analysis/ # Risk analysis & results
│   │   │   ├── reports/       # Business rules log
│   │   │   ├── sync/          # Sync dashboard
│   │   │   └── settings/      # System parameters
│   │   └── ...
│   │
│   ├── expo-mobile/           # Field App (Expo)
│   │   ├── app/
│   │   │   ├── (auth)/        # OAuth/JWT login
│   │   │   ├── holdings/      # GPS auto-fill registration
│   │   │   ├── movements/     # One-click market movements
│   │   │   ├── birth/         # Instant birth notification
│   │   │   ├── tagging/       # Barcode ear tag scanning
│   │   │   ├── inspection/    # Digital inspection forms
│   │   │   ├── offline/       # Offline cache management
│   │   │   └── sync/          # Incremental sync status
│   │   └── ...
│   │
│   └── nextjs-vs/             # VS (Veterinary Station) Portal
│       └── ...
│
├── packages/
│   ├── @prasici/db/           # Drizzle ORM schema
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── sm/        # System management tables
│   │   │   │   ├── hk/        # Holder keeper tables
│   │   │   │   ├── et/        # Ear tag tables
│   │   │   │   ├── an/        # Animal & movement tables
│   │   │   │   └── gn/        # Risk analysis tables
│   │   │   ├── migrations/
│   │   │   ├── seeds/
│   │   │   └── index.ts
│   │   └── ...
│   │
│   ├── @prasici/validators/   # Zod validation schemas
│   │   ├── src/
│   │   │   ├── registration.ts
│   │   │   ├── movements.ts
│   │   │   ├── holdings.ts
│   │   │   ├── keepers.ts
│   │   │   ├── eartags.ts
│   │   │   ├── birth.ts
│   │   │   ├── slaughter.ts
│   │   │   ├── pasture.ts
│   │   │   ├── inspection.ts
│   │   │   ├── import-export.ts
│   │   │   ├── sync.ts
│   │   │   └── system.ts
│   │   └── ...
│   │
│   ├── @prasici/trpc/         # tRPC router
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── holdings.ts
│   │   │   │   ├── keepers.ts
│   │   │   │   ├── animals.ts
│   │   │   │   ├── movements.ts
│   │   │   │   ├── eartags.ts
│   │   │   │   ├── birth.ts
│   │   │   │   ├── inspections.ts
│   │   │   │   ├── risk-analysis.ts
│   │   │   │   ├── sync.ts
│   │   │   │   └── admin.ts
│   │   │   ├── context.ts
│   │   │   └── index.ts
│   │   └── ...
│   │
│   ├── @prasici/notifications/ # WebSocket + push
│   │   └── ...
│   │
│   ├── @prasici/offline/       # Offline sync engine
│   │   └── ...
│   │
│   └── @prasici/geocoding/     # Reverse geocoding
│       └── ...
│
└── tooling/
    ├── typescript-config/
    ├── eslint-config/
    └── prettier-config/
```

### 4.5 Transition Strategy: Three Pillars

#### Pillar 1: Holding Register (Farms)

| Legacy                                                         | Modern                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| States → Zip → Address → Farm hierarchy (mandatory drill-down) | GPS reverse-geocoding auto-fills address, commune, admin unit            |
| Manual farm ID assignment with offline PDA formula             | Shared utility function for 9-digit Farm ID check digit                  |
| Paper census → service company key-in → VD review → DB         | Digital signature + photo → tRPC mutation → `PENDING_VD_APPROVAL` status |
| Temporary tables for new farm suggestions                      | `verification_status` column on `farms` table                            |
| Signed paper forms required for confirmation                   | Expo app captures digital signature                                      |

**Drizzle Schema for Farms:**

```typescript
// @prasici/db/src/schema/hk/farms.ts
import { pgTable, serial, integer, varchar, date, geometry } from "drizzle-orm/pg-core";

export const farms = pgTable("farms", {
  kmgMid: serial("kmg_mid").primaryKey(),
  // Address relationship
  hsMid: integer("hs_mid").notNull().references(() => addresses.hsMid),
  // Farm identification
  farmId: varchar("farm_id", { length: 9 }).unique().notNull(), // 9-digit with check digit
  type: varchar("type", { length: 10 }).notNull().default("FARM"),
  homeName: varchar("home_name", { length: 50 }),
  // Parent farm (for hierarchy)
  kmgMidSup: integer("kmg_mid_sup"),
  // Verification workflow (replaces temp tables)
  verificationStatus: varchar("verification_status", { length: 20 })
    .notNull().default("PENDING_VD_APPROVAL"),
  // Metadata
  owner: varchar("owner", { length: 5 }).notNull().default("AIMCS"),
  // Geo-location (PostGIS replaces X/Y/Z)
  location: geometry("location", { type: "point", srid: 4326 }),
  // Standard audit columns
  dInsert: date("d_insert").notNull().defaultNow(),
  idInserter: integer("id_inserter").notNull(),
  activity: varchar("activity", { length: 1 }).notNull().default("1"),
  validTo: date("valid_to"),
  idSession: integer("id_session").notNull(),
});
```

#### Pillar 2: Keeper Register (Holders)

| Legacy                                                | Modern                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| HK_KMG_SUBJ created separately from farms             | Next.js wizard validates Holder + Farm as single logical unit                               |
| PDA suggestions → temp tables → VD paper confirmation | Zod validates `HK_KMG_SUBJ` relationship in one step                                        |
| Manual role assignment                                | Centralized `SM_LOG_CODES` with Zod enums for multiple roles (farm, slaughterhouse, trader) |
| Physical Tagger ID card                               | OAuth/JWT in mobile app, auto-timestamped                                                   |
| 3-step data correction                                | Real-time validation with immediate error feedback                                          |

**Drizzle Schema for HK_KMG_SUBJ:**

```typescript
// @prasici/db/src/schema/hk/farm_subjects.ts
export const farmSubjectRole = z.enum([
  "OWNER",
  "KEEPER",
  "VETERINARIAN",
  "TRADER",
  "SLAUGHTERHOUSE",
  "LIVESTOCK_MARKET",
  "BIP",
  "TECHNICIAN",
]);

export const farmSubjects = pgTable("farm_subjects", {
  idKmgSubj: serial("id_kmg_subj").primaryKey(),
  idSubj: integer("id_subj").notNull().references(() => subjects.idSubj),
  kmgMid: integer("kmg_mid").notNull().references(() => farms.kmgMid),
  role: varchar("role", { length: 30 }).notNull(),
  // Standard audit columns
  dInsert: date("d_insert").notNull().defaultNow(),
  idInserter: integer("id_inserter").notNull(),
  activity: varchar("activity", { length: 1 }).notNull().default("1"),
  validTo: date("valid_to"),
  idSession: integer("id_session").notNull(),
  owner: varchar("owner", { length: 5 }).notNull().default("AIMCS"),
});
```

#### Pillar 3: Animal Register (Movements)

| Legacy                                                  | Modern                                                    |
| ------------------------------------------------------- | --------------------------------------------------------- |
| Two-phase departure + arrival (4 movements for markets) | One-click transaction: scan ear tag + scan destination QR |
| Birth notification by phone/mail → 20-day tagging alert | Expo app instant notification → WebSocket → Vet dashboard |
| Manual ear tag entry → posteriori plausibility checks   | Camera barcode scanning eliminates manual errors          |
| PDA upload daily → batch processing                     | tRPC incremental sync (offline-first)                     |
| Postcard movement communication                         | Real-time movement mutations                              |

**Drizzle Schema for Unified Movements:**

```typescript
// @prasici/db/src/schema/an/movements.ts
export const movementType = z.enum([
  "SALE",
  "PURCHASE",
  "MARKET_SALE",
  "MARKET_PURCHASE",
  "BIRTH",
  "DEATH",
  "SLAUGHTER",
  "HOME_SLAUGHTER",
  "PASTURE",
  "PASTURE_RETURN",
  "IMPORT",
  "EXPORT",
  "TRANSFER",
]);

export const movements = pgTable("movements", {
  idMovement: serial("id_movement").primaryKey(),
  // Unified movement (replaces departure + arrival pair)
  animalId: varchar("animal_id", { length: 10 }).notNull(),
  fromFarmMid: integer("from_farm_mid").references(() => farms.kmgMid),
  toFarmMid: integer("to_farm_mid").references(() => farms.kmgMid),
  movementType: varchar("movement_type", { length: 30 }).notNull(),
  movementDate: date("movement_date").notNull(),
  // Optional: for multi-leg movements (markets)
  parentMovementId: integer("parent_movement_id"),
  // Slaughter-specific
  slaughterNo: varchar("slaughter_no", { length: 50 }),
  mass: integer("mass"),
  massType: varchar("mass_type", { length: 20 }),
  // Import/Export
  stateBreeding: varchar("state_breeding", { length: 3 }),
  idBreedingPlace: varchar("id_breeding_place", { length: 50 }),
  // Pasture-specific
  pastureType: varchar("pasture_type", { length: 20 }),
  expectedReturnDate: date("expected_return_date"),
  // Standard audit columns
  dInsert: date("d_insert").notNull().defaultNow(),
  idInserter: integer("id_inserter").notNull(),
  activity: varchar("activity", { length: 1 }).notNull().default("1"),
  validTo: date("valid_to"),
  idSession: integer("id_session").notNull(),
});
```

### 4.6 Offline-First Field Operations

```
┌────────────────────────────────────────────────────────┐
│                EXPO MOBILE APP                          │
│                                                         │
│  ┌────────────────┐   ┌──────────────────────────┐    │
│  │  Online Mode    │   │  Offline Mode            │    │
│  │                 │   │                          │    │
│  │  tRPC mutations │   │  SQLite local DB         │    │
│  │  Real-time sync │   │  Queue pending changes   │    │
│  │  WebSocket      │   │  Local validation (Zod)  │    │
│  │  notifications  │   │  Camera + GPS capture    │    │
│  └────────────────┘   └──────────────────────────┘    │
│                          │                             │
│                          ▼                             │
│                 ┌──────────────────┐                   │
│                 │ Incremental Sync │                   │
│                 │ (tRPC upload on │                    │
│                 │  reconnect)     │                    │
│                 └──────────────────┘                   │
│                            │                            │
│                            ▼                            │
│                 ┌──────────────────┐                   │
│                 │ Server validates  │                   │
│                 │ (Zod + DB rules) │                    │
│                 │ → PENDING or     │                    │
│                 │   REJECTED       │                    │
│                 └──────────────────┘                   │
└────────────────────────────────────────────────────────┘
```

### 4.7 Digital Business Rules Log

Instead of the legacy sync reports (text files + web lists), provide:

1. **Real-time validation UI in Next.js admin** showing:
   - Which Zod validation failed, for which field
   - Exact business rule name and description
   - Suggestion for correction
   - Link to the record for immediate correction

2. **WebSocket push to Expo mobile** enabling
   - Immediate correction in the field
   - Vet sees rejection reason before leaving farm

### 4.8 Implementation Sequence

```
Phase 1: Foundation (Weeks 1-4)
  ├── Turborepo setup + tooling
  ├── @prasici/db — Drizzle schemas for SM + HK
  ├── @prasici/validators — Core Zod rules
  └── @prasici/trpc — Base router setup

Phase 2: Pillar 1 — Holding Register (Weeks 5-8)
  ├── Next.js admin: Farm registration with GPS
  ├── Expo mobile: GPS auto-fill + digital signature
  ├── Verification status workflow (PENDING → APPROVED)
  └── Migration script for legacy HK_ADDRESSES + HK_KMG

Phase 3: Pillar 2 — Keeper Register (Weeks 9-11)
  ├── Next.js wizard: HK + Farm as single unit
  ├── Auth system (OAuth/JWT replacing Tagger ID cards)
  └── Role management with Zod enums

Phase 4: Pillar 3 — Animal Register (Weeks 12-16)
  ├── One-click movements (scan ear tag + QR)
  ├── Birth notification with WebSocket alerts
  ├── Camera barcode scanning
  └── Offline queue + incremental sync

Phase 5: Legacy Migration (Weeks 17-20)
  ├── @prasici/offline — full sync engine
  ├── Parallel running with legacy Oracle
  ├── Data migration scripts
  └── Cutover and validation

Phase 6: Advanced Features (Weeks 21-24)
  ├── Risk analysis module (GN migration)
  ├── Inspection digital forms
  ├── Import/Export workflows
  └── Analytics dashboard
```

---

## 5. Key Decision Points

### 5.1 Single-Phase vs. Two-Phase Movements

**Decision: UNIFIED SINGLE-PHASE** — Modern system treats a movement as one atomic transaction. Multi-leg market movements use `parent_movement_id` for traceability, but the departure+arrival pair is collapsed into a single record.

### 5.2 Verification Status Instead of Temp Tables

**Decision: STATUS COLUMN** — Add `verification_status` to all "real" tables:

- `DRAFT` — In progress (mobile)
- `PENDING_VD_APPROVAL` — Submitted, awaiting VD
- `APPROVED` — VD confirmed
- `REJECTED` — VD rejected with reason
- `ARCHIVED` — Soft-deleted

### 5.3 Ear Tag Check Digit

**Decision: KEEP LEGACY FORMULA** — The MOD 10 formula `3,5,7,11,13,17,19` is preserved for backward compatibility with existing physical ear tags.

### 5.4 Offline Strategy

**Decision: WATEREDB + tRPC SYNC** — Expo app uses WatermelonDB or a custom SQLite wrapper with tRPC-based incremental sync (replacing legacy ActiveSync text files).

---

## 6. Critical Business Rules (from FS documents)

```typescript
// @prasici/validators/src/business-rules.ts

// Registration Rules (FS - registration_MK(v0.91).pdf, p13-15)
export const REGISTRATION_RULES = {
  userMustHavePrivilege: true,
  dateCannotBeFuture: true,
  motherAliveAtBirth: true,
  motherOnFarmAtBirth: true,
  motherMinAgeMonths: 17,     // System parameter
  calvingIntervalDays: 365,   // System parameter
  motherCannotBeSelf: true,
  motherCannotBeMale: true,
  fatherCannotBeFemale: true,
};

// Tagging Rules (TPC_PDA_v1_2.pdf, p13)
export const TAGGING_RULES = {
  firstTaggingStartWithEldest: true,
  motherIdNotObligatoryForFirstTagging: true,
  routineTaggingScanMotherPassport: true,
  earTagCheckDigitFormula: [3,5,7,11,13,17,19],  // Sum * weight MOD 10
};

// Movement Rules (FS - registration_MK(v0.91).pdf, p10-15)
export const MOVEMENT_RULES = {
  animalMustBeOnFarmForDeparture: true,
  arrivalCanOverrunDepartureByDays: 2,
  slaughterMinAgeDays: 25,
  birthNotificationDays: 7,
  taggingDeadlineDays: 20,
};

// Ear Tag Order Rules (FS - eartags_MK(v1.0).pdf, p6)
export const EARTAG_ORDER_RULES = {
  orderMinIntervalDays: 120,
  maxOrdersPerYear: 4,
  newTagsFormula: "femaleCount - remainingFromPreviousOrders",
};

// HK Hierarchy Rules (FS - HK_MK(v1.0).pdf, p5)
export const HK_HIERARCHY_RULES = {
  statesBeforeZipCodes: true,
  zipCodesBeforeAddresses: true,
  addressesBeforeFarms: true,
};
```

---

## 7. Migration Scripts

### 7.1 Farm ID Check Digit Utility

```typescript
// @prasici/validators/src/utils/check-digit.ts

/**
 * Legacy check digit formula (from TPC_PDA_v1_2.pdf):
 * Check digit = MOD(10, SUM(weight[i] * digit[i]))
 * 
 * Farm ID is 9 digits: first 8 are sequential, last is check digit
 */
export function calculateFarmIdCheckDigit(first8Digits: string): number {
  const weights = [7, 3, 1, 9, 5, 11, 13, 17]; // from legacy formula
  const sum = first8Digits
    .split("")
    .map(Number)
    .reduce((acc, digit, i) => acc + weights[i] * digit, 0);
  return sum % 10;
}

/**
 * Ear tag check digit (from FS - eartags_MK(v1.0).pdf, p6):
 * Check digit = MOD(10, SUM(3*d1 + 5*d2 + 7*d3 + 11*d4 + 13*d5 + 17*d6 + 19*d7))
 */
export function validateEarTagCheckDigit(tag: string): boolean {
  if (!/^\d{8}$/.test(tag)) return false;
  const weights = [3, 5, 7, 11, 13, 17, 19];
  const digits = tag.split("").map(Number);
  const sum = digits.slice(0, 7).reduce((acc, d, i) => acc + weights[i] * d, 0);
  return digits[7] === sum % 10;
}
```

---

## 8. Risk Analysis Module (from Analises.PDF)

Migrate from Oracle scheduled jobs to:

```typescript
// @prasici/db/src/schema/gn/risk-analyses.ts
export const riskAnalysisSchedule = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
]);

export const riskAnalyses = pgTable("risk_analyses", {
  idAnalysis: serial("id_analysis").primaryKey(),
  name: varchar("name", { length: 30 }).notNull(),
  // SQL/Prisma query stored for execution
  query: text("query").notNull(),
  schedule: varchar("schedule", { length: 20 }).notNull(),
  // Parameters with weights
  parameters: jsonb("parameters").$type<{
    name: string;
    value: string;
    weight: number;
  }[]>(),
  // Standard audit
  dInsert: date("d_insert").notNull().defaultNow(),
  idInserter: integer("id_inserter").notNull(),
  activity: varchar("activity", { length: 1 }).notNull().default("1"),
  validTo: date("valid_to"),
  idSession: integer("id_session").notNull(),
});

export const analysisResults = pgTable("analysis_results", {
  idResult: serial("id_result").primaryKey(),
  idAnalysis: integer("id_analysis").notNull().references(() => riskAnalyses.idAnalysis),
  farmMid: integer("farm_mid").references(() => farms.kmgMid),
  result: integer("result"), // Risk score
  runtimeId: integer("runtime_id"),
  dInsert: date("d_insert").notNull().defaultNow(),
  idInserter: integer("id_inserter").notNull(),
  activity: varchar("activity", { length: 1 }).notNull().default("1"),
  validTo: date("valid_to"),
  idSession: integer("id_session").notNull(),
});
```

---

## Summary

This analysis covers all 9 PDF documents exhaustively. The transition strategy maps:

- **SM.PDF** → System management, RBAC, business rules registry
- **HK.PDF** → Address hierarchy, farms, subjects, relationships
- **Eartags.PDF** → Tag lifecycle, orders, contingents
- **Analises.PDF** → Risk analysis engine
- **TPC_PDA_v1_2.pdf** → Offline-first architecture, check digits, temp tables → status columns
- **Workflow 17-04-03.pdf** → All 25 business processes digitized
- **FS - registration_MK(v0.91).pdf** → Unified movement model, Zod validation rules
- **FS - HK_MK(v1.0).pdf** → Multi-step wizard replacing drill-down hierarchy
- **FS - eartags_MK(v1.0).pdf** → Barcode-driven ordering, check digit validation

The modern system preserves all 25 workflow instances while collapsing the legacy's batch/paper/offline complexity into real-time, type-safe, offline-first operations using Turborepo, tRPC, Zod, Drizzle ORM, and Expo.
