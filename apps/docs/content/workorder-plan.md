# Work Order Execution Plan

| Key            | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **Status**     | Derived artifact · execution blueprint                          |
| **Date**       | 2026-07-24                                                      |
| **Author**     | RobotFarm Overseer (extracted from `apps/docs/content/workorder.md`) |
| **Validation** | `pnpm ci:checks` + `pnpm build` for all code-changed WOs         |
| **Source**     | `apps/docs/content/workorder.md` — the living work order         |

> **Purpose:** This plan maps every unrealised WO (Open, Draft, Deferred, Feature Gap) to a
> concrete sprint schedule, resource estimate, dependency graph, and blocking-condition register.
> It does **not** mutate the source work order — it is a derived artifact that an engineering team
> can execute sprint by sprint.

---

## 1. Inclusion & Classification

### 1.1 WOs Excluded (already Done or In Progress)

| WO      | Status           | Reason for exclusion              |
| ------- | ---------------- | --------------------------------- |
| WO-001  | Done ✅          | Takeover-file check digit fixed   |
| WO-002  | Done ✅          | VI subject role added (Horn A)    |
| WO-003  | Done ✅          | Stale server.ts deleted           |
| WO-010  | Done ✅          | ruleset store seeded              |
| WO-011  | Done ✅          | Algorithm registry built          |
| WO-012  | Done ✅          | Hardcoded thresholds → RuleSet    |
| WO-013  | Done ✅          | farmerCanAdminister wired         |
| WO-014  | Done ✅          | Retention + role vocab in RuleSet |
| WO-020  | Done ✅          | Health stock reconciliation       |
| WO-021  | Done ✅          | Per-farm risk results persisted   |
| WO-022  | Done ✅          | Birth-notification deadlines      |
| WO-023  | Done ✅          | Inspection params → RuleSet       |
| WO-030  | Done ✅          | Workflow tests (domain sweep)     |
| WO-031  | Done ✅          | RLS tests (Scenario C)            |
| WO-032  | Done ✅          | JSDoc audit completed             |
| WO-033  | Done ✅          | e2e border tests delivered        |
| WO-040  | Done ✅          | `.strip()` → `.strict()` done     |
| WO-041  | Done ✅          | `.omit()` → `.pick()` done        |
| WO-050  | In Progress      | PDF/A generation + viewing done   |
| WO-080  | Done ✅          | Client ADR set complete           |
| WO-081  | Done ✅          | Top-level sync router promoted    |
| WO-082  | In Progress ⏳   | Offline layer built; native gate  |
| WO-083  | Done ✅          | AGENTS.md path reconciled         |
| WO-085  | Done ✅          | Mobile tab RBAC filter            |
| WO-087  | Done ✅          | Web UX boundaries                 |
| WO-088  | Done ✅          | Mobile Empty + toast              |
| WO-089  | Done ✅          | Client permission gating          |
| WO-090  | Done ✅          | ADR-0032-compliant AppRouter      |
| WO-091  | Done ✅          | Push notifications built          |
| WO-092  | Done ✅          | Background sync task              |
| WO-093  | Done ✅          | Deep-link resolver                |
| WO-094  | Done ✅          | Livestock parity sweep            |
| WO-095  | Done ✅          | Health parity sweep               |
| WO-096  | Done ✅          | Inspections/Corrections sweep     |
| WO-098  | Done ✅          | SUPER_ADMIN gate                  |
| WO-100  | Done ✅          | Permission catalog single source  |
| WO-101  | Done ✅          | Permission drift test             |
| WO-102  | Done ✅          | tRPC boundary guard               |
| WO-103  | Done ✅          | Authorization test base           |
| WO-104  | Done ✅          | @OverridePolicy decorator         |
| WO-105  | Done ✅          | Web permission test suite         |
| WO-106  | Done ✅          | Animal domain test fixes          |
| WO-107  | Done ✅          | Whole-monorepo test gate          |
| WO-108  | Done ✅          | Sync health conflict detection    |
| WO-109  | Done ✅          | Admin units NUTS/LAU              |
| WO-110  | Done ✅          | Geofences PostGIS                 |
| WO-113  | Done ✅          | AMR withdrawal guillotine         |
| WO-114  | Done ✅          | Transport welfare max-hours       |
| WO-115  | Done ✅          | EUDR due-diligence                |
| WO-116  | Done ✅          | FSMA KDE/CTE export               |
| WO-118  | Done ✅          | ISO 11784/11785 format            |
| WO-119  | Done ✅          | Disease-zone spatial block        |
| WO-120  | Done ✅          | Bovine I&R 7/20 EU floor          |
| WO-121  | Done ✅          | IMSOC/CHED export                 |
| WO-123  | In Progress      | Web↔Backend parity (phased)       |
| WO-143  | Done ✅          | Geo Forest/EUDR overlay           |
| WO-144  | Done ✅          | Cloudflare Access Service Token   |
| WO-146  | Done ✅          | Docker-compose topology           |
| WO-147  | Done ✅          | Docs site container               |
| WO-148  | Done ✅          | Frontend↔backend boundary doc     |
| WO-149  | Done ✅          | ISO 27701 deployment evidence     |
| WO-150  | Done ✅          | EU regulatory conformance         |
| WO-151  | Done ✅          | EU B2B procurement pack           |
| WO-152  | Done ✅          | EU General Food Law evidence      |
| WO-153  | Done ✅          | EU IMSOC regulation evidence      |
| WO-154  | Done ✅          | EUDR feature-parity evidence      |
| WO-155  | Done ✓           | ESPR DPP alignment                |
| WO-156  | In Progress ⏳   | Notification channel routing      |
| WO-157  | Done ✅          | Mobile tab data-wiring            |
| WO-158  | Done ✅          | Standards reference doc           |
| WO-159  | Done ✅          | Audit-log compliance              |
| WO-160  | Done ✅          | Visa-Matrix service→DB closure    |
| WO-161  | Done ✅          | Geo geometry helpers relocated    |
| WO-162  | Done ✅          | Container runtime hardening       |
| WO-163  | Done ✅          | Inline PDF viewer                 |

### 1.2 WOs Included (unrealised — subject of this plan)

| Source section                          | WO IDs                                                                     | Count |
| --------------------------------------- | -------------------------------------------------------------------------- | ----- |
| **Master List — Open**                  | WO-024, WO-025, WO-034, WO-035, WO-036, WO-060, WO-071, WO-086, WO-097    | 9     |
| **Master List — Deferred**              | WO-061, WO-070                                                             | 2     |
| **ADR-0081 — answer pending (gov)**     | WO-124, WO-125, WO-126, WO-127, WO-128, WO-129, WO-130, WO-131, WO-132, WO-142 | 10    |
| **ADR-0061 — answer pending (legal)**   | WO-133, WO-134, WO-135, WO-136, WO-137, WO-138, WO-139, WO-140, WO-141    | 9     |
| **Geo & Regulatory — Draft**            | WO-111, WO-112, WO-117, WO-122                                             | 4     |
| **Deployment — Open (prod deferred)**   | WO-145                                                                     | 1     |
| **User Guide Feature Gaps**             | WO-164, WO-165, WO-166, WO-167, WO-168, WO-169, WO-170, WO-171, WO-172, WO-173 | 10    |
| **Shadow items (no WO number)**         | `farm_org_id()` formal migration, WO-123 Phase 4 guardian                  | —     |

**Total unrealised WOs: 45**

---

## 2. Classification Matrix

Every WO below is classified into one of four execution tracks:

| Track                      | Meaning                                                                    |
| -------------------------- | -------------------------------------------------------------------------- |
| **🟢 Sprintable**          | No external blockers; priority (P1–P2) makes sprint assignment appropriate |
| **🟡 ADR-first**           | Requires ADR authoring/ratification before any code change                 |
| **🔴 External-blocker**    | Cannot proceed until external input is received (gov/legal/domain-owner)   |
| **⚪ Deferred / Future**   | No sprint slot; tracked for awareness only                                 |

### Legend for dependency columns

- **Depends on:** WOs that MUST be complete before this WO can start
- **Blocks:** WOs that this WO prevents from starting
- **Priority override:** If source priority conflicts with sprint order (e.g. a P3 must precede P0 due to dependency), this row states the exception — but **no P3 is scheduled ahead of a P0 or P1 item** in the active-sprint track. All dependency adjacencies respect priority order.

---

## 3. Dependency Graph

```
                                ┌─────────────────────────┐
                                │     ADR-0061 answers     │
                                │  (legal — WO-133..141)   │
                                └──────────┬──────────────┘
                                           │ blocks
                                           ▼
                             ┌─────────────────────────┐
                             │    WO-117 (GDPR pseu-    │
                             │    donymization, Draft)  │
                             └─────────────────────────┘

                                ┌─────────────────────────┐
                                │     ADR-0081 answers     │
                                │   (gov — WO-124..132)    │
                                └──────────┬──────────────┘
                                           │ blocks
                                           ▼
                             ┌─────────────────────────┐
                             │  WO-122 (GDPR public-    │
                             │  health exception,Draft) │
                             └─────────────────────────┘

          ┌─────────────────────────────────────────────────────────────────────┐
          │                        Sprint Anchors                              │
          │  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐   │
          │  │  WO-034      │   │  WO-097      │   │  WO-086              │   │
          │  │  (observab.) │   │  (infra ad-  │   │  (i18n layer)        │   │
          │  │  P2          │   │  min) P2     │   │  P2                  │   │
          │  └──────┬───────┘   └──────┬───────┘   └──────────────────────┘   │
          │         │                  │                                       │
          │         ▼                  ▼                                       │
          │  ┌──────────────┐   ┌──────────────┐                               │
          │  │  WO-035      │   │  farm_org_id  │                               │
          │  │  (retire     │   │  migration    │                               │
          │  │  logger) P3  │   │  (shadow)     │                               │
          │  └──────────────┘   └──────────────┘                               │
          │         ▼                                                          │
          │  ┌──────────────┐                                                  │
          │  │  WO-036      │                                                  │
          │  │  (metrics)   │                                                  │
          │  │  P3          │                                                  │
          │  └──────────────┘                                                  │
          └─────────────────────────────────────────────────────────────────────┘

                │                                                                    │
                ▼                                                                    ▼
     ┌──────────────────────┐                                ┌───────────────────────────────┐
     │  WO-060 (IoT gate)   │                                │  User Guide Feature Gaps     │
     │  P3 — independent    │                                │  (WO-164..173) — P1..P3       │
     └──────────────────────┘                                │  Each requires ADR → code →  │
                                                             │  docs lifecycle              │
                │                                            └───────────────────────────────┘
                ▼
     ┌──────────────────────┐
     │  WO-024 (FIELD_CHG)  │
     │  P3 — ADR-first      │
     └──────────────────────┘

     ┌──────────────────────┐
     │  WO-025 (QR tags)    │
     │  P3 — ADR-first      │
     └──────────────────────┘

     ┌────────────────────────────────────────────────────────────┐
     │  Draft WOs (ADR ratification gate)                        │
     │  WO-111 (addresses→PostGIS) — P3                          │
     │  WO-112 (OSM boundaries) — P3                             │
     │  └── both independent, can parallel                       │
     │  WO-117 (GDPR pseudo) — P2 — blocked on ADR-0061          │
     │  WO-122 (GDPR public health) — P2 — blocked on ADR-0061   │
     └────────────────────────────────────────────────────────────┘

     ┌────────────────────────────────────┐
     │  WO-071 (calving gap)              │
     │  P3 — BLOCKED (domain-owner conf.) │
     └────────────────────────────────────┘

     ┌────────────────────────────────────┐
     │  WO-123 Phase 4 (check:web-parity  │
     │  guardian) — P0 (within WO-123)    │
     │  Depends on WO-105, WO-089, Phase  │
     │  1–3 of WO-123 (In Progress)       │
     └────────────────────────────────────┘
```

### 3.1 Cross-WO Dependency Table

| WO        | Depends on                                           | Blocks                    | Note |
| --------- | ---------------------------------------------------- | ------------------------- | ---- |
| WO-034    | — (standalone)                                       | WO-035, WO-036            | Observability scaffold is prerequisite for logger retirement and business metrics |
| WO-035    | WO-034 (observability scaffold)                      | —                         | Retire manual logger only after span attributes exist |
| WO-036    | WO-034 (observability scaffold)                      | —                         | Business metrics emitted via TraceStage/MetricsStage |
| WO-097    | — (standalone) but adjacent to WO-082 (In Progress)  | `farm_org_id` migration   | Infra admin parity; device-sync touchpoint with WO-082 |
| `farm_org_id` migration | WO-097 (adjacent RLS scope)               | —                         | Must absorb from `scripts/fix-rls-sql.mjs` into `@rocky/db/rls-helpers.ts` |
| WO-060    | — (standalone)                                       | —                         | IoT gate independent of other open WOs |
| WO-024    | ADR-0027 ratification (deferred spec)                | —                         | No concrete spec exists; ADR-authoring first |
| WO-025    | ADR-0024 §E / ADR-0009 §6 ratification               | —                         | No concrete spec exists; ADR-authoring first |
| WO-086    | — (standalone)                                       | —                         | i18n layer independent |
| WO-071    | Domain-owner confirmation of 365 d vs 120 d gap      | —                         | **BLOCKED** until unresolved Q3 is resolved |
| WO-111    | ADR-0053 ratification                                | —                         | Draft; ADR authoring first |
| WO-112    | ADR-0053 ratification                                | —                         | Draft; ADR authoring first |
| WO-117    | ADR-0061 answers (legal input) + ADR ratification    | —                         | Draft + blocked on legal |
| WO-122    | ADR-0061 answers (legal input) + ADR ratification    | —                         | Draft + blocked on legal |
| WO-124..132, 142 | ADR-0081 answers (gov input)                  | —                         | **BLOCKED** on gov/legal |
| WO-133..141 | Legal expert input (GDPR applicability)             | WO-117, WO-122, WO-140    | **BLOCKED** on legal |
| WO-164..173 | ADR authoring (feature genesis)                     | —                         | Each gap is a full ADR→code→docs cycle |
| WO-145    | — (deferred by design)                               | —                         | Production secret management; no sprint |
| WO-061    | — (deferred by design)                               | —                         | IoT LPWAN QoS; no sprint |
| WO-070    | — (deferred by design)                               | —                         | Deferral register; no sprint |
| WO-123 Ph4 | WO-105, WO-089, WO-123 Ph1–3 (all Done/In Progress) | —                         | Outstanding: `check:web-parity` guardian, router-count reconciliation |

---

## 4. External Dependency Register

Validated external services and infrastructure that the plan depends on:

| # | Dependency             | Role in Rocky                                         | Status            | Notes |
| - | ---------------------- | ----------------------------------------------------- | ----------------- | ----- |
| 1 | **Expo SDK 56**        | Mobile runtime; `expo-notifications`, `expo-sqlite`, `expo-background-fetch` | Active | SDK 56 is the installed version; native build infra absent |
| 2 | **Cloudflare**         | Zero-Trust tunnel (Access + Argo); DNS; future Secrets Store | Active | Tunnels deployed; WO-144 token auth Done |
| 3 | **PostGIS**            | Spatial data: geofences, disease zones, EUDR overlay  | Active | Extension installed; `geofences` schema built |
| 4 | **OpenStreetMap / Nominatim** | Reverse-geocoding for telemetry/display          | Draft (WO-112) | Not yet integrated; display-only |
| 5 | **Twilio / Vonage**    | SMS gateway for notification channel routing         | Deferred          | WO-156 SMS client is end-of-program work |
| 6 | **Copernicus Sentinel-2** | EUDR deforestation overlay via RasterSourcePort    | Partial           | Default `NoDataRasterSource` renders all-compliant; real integration deferred |
| 7 | **TRACES NT**          | EU veterinary certification; CHED-compliant export    | Partial           | WO-121 export movements emit CHED-compliant JSON/XML; full IMSOC integration pending |

---

## 5. Resource Estimates

Estimates are in **sprint-weeks** (1 sprint = 2 weeks) at a nominal team composition of **2–3 full-stack engineers** + **1 domain expert** (part-time across all tracks). The feature-gap WOs assume parallel ADR authoring by a separate Technical Writer / Docs Bot.

### 5.1 Execution-Ready (🟢 Sprintable)

| WO        | Task                                  | Priority | Team size | Sprint count | Person-weeks | Sprint assignment |
| --------- | ------------------------------------- | -------- | --------- | ------------ | ------------ | ----------------- |
| WO-034    | Observability scaffold                | P2       | 2 devs    | 1            | 4            | Sprint N          |
| WO-097    | Infra admin parity                    | P2       | 2 devs    | 2            | 8            | Sprint N          |
| WO-086    | i18n layer                            | P2       | 2 devs    | 2            | 8            | Sprint N+1        |
| WO-035    | Retire manual logger                  | P3       | 1 dev     | 1            | 2            | Sprint N+1        |
| WO-036    | Business metrics                      | P3       | 1 dev     | 1            | 2            | Sprint N+1        |
| WO-060    | IoT RuleSet gate                      | P3       | 1 dev     | 1            | 2            | Sprint N+2        |
| `farm_org_id` | Formal migration                 | —        | 1 dev     | 0.5          | 1            | Sprint N (alongside WO-097) |
| WO-123 Ph4 | Parities guardian                 | P0       | 2 devs    | 1            | 4            | Sprint N+3        |

**Total execution-ready:** ~29 person-weeks over ~4 sprints (8 weeks calendar).

### 5.2 ADR-First (🟡 requires authoring before code)

| WO        | Task                                  | Priority | ADR authoring | Code impl    | Total person-weeks | Notes |
| --------- | ------------------------------------- | -------- | ------------- | ------------ | ------------------ | ----- |
| WO-024    | FIELD_CHANGED → VD lock               | P3       | 0.5 sprint    | 1 sprint     | 3                  | No spec exists |
| WO-025    | QR ear tags                           | P3       | 0.5 sprint    | 1 sprint     | 3                  | Cross-ref ADR-0084 |
| WO-111    | addresses.location → PostGIS POINT    | P3       | 0.5 sprint    | 1.5 sprints  | 4                  | DB migration + app |
| WO-112    | OSM boundaries doc + Nominatim        | P3       | 0.5 sprint    | 1 sprint     | 3                  | Display only |
| WO-164    | Bulk birth registration               | P2       | 0.5 sprint    | 2 sprints    | 5                  | Full lifecycle |
| WO-165    | Tag re-order from farm                | P1       | 0.5 sprint    | 1.5 sprints  | 4                  | Full lifecycle |
| WO-166    | Pending-movement dashboard            | P1       | 0.5 sprint    | 1.5 sprints  | 4                  | Full lifecycle |
| WO-167    | Notifiable disease push               | P2       | 0.5 sprint    | 2 sprints    | 5                  | Depends on WO-091 (Done) |
| WO-168    | Vaccination schedule/calendar         | P3       | 0.5 sprint    | 1.5 sprints  | 4                  | Full lifecycle |
| WO-169    | Farmer-facing risk score              | P2       | 0.5 sprint    | 1 sprint     | 3                  | Read-only dashboard |
| WO-170    | Correction request tracking           | P3       | 0.5 sprint    | 1 sprint     | 3                  | Read-only dashboard |
| WO-171    | Role-based home screen                | P1       | 0.5 sprint    | 1.5 sprints  | 4                  | Full lifecycle |
| WO-172    | Cross-border pre-approval             | P2       | 0.5 sprint    | 2 sprints    | 5                  | Full lifecycle |
| WO-173    | Offline queue status indicator        | P3       | 0.5 sprint    | 1 sprint     | 3                  | Depends on WO-082 (In Progress) |

**Total ADR-first:** ~52 person-weeks (including ADR authoring). These are sequenced after the initial sprintable backlog and interleaved with P1 gaps first.

### 5.3 Externally Blocked (🔴 cannot start)

| Group                | WOs             | Count | Person-weeks (estimated) | Blocking condition                |
| -------------------- | --------------- | ----- | ------------------------ | --------------------------------- |
| ADR-0081 (gov)       | WO-124..132,142 | 10    | ~25                      | Gov answers to accept-and-flag questions |
| ADR-0061 (legal)     | WO-133..141     | 9     | ~22                      | Legal input on GDPR applicability  |
| ADR-0081 + 0061 deps | WO-117, 122     | 2     | ~8                       | Both blocked on legal input        |
| Domain-owner         | WO-071          | 1     | ~2                       | Domain-owner confirmation of 365 d gap |

**Total blocked:** ~57 person-weeks, gated entirely on external input.

### 5.4 Deferred by Design (⚪ no sprint)

| WO        | Task                                               | Rationale                                              |
| --------- | -------------------------------------------------- | ------------------------------------------------------ |
| WO-061    | IoT LPWAN QoS/SLA                                  | Deferred by ADR-0031; no IoT deployment in field yet   |
| WO-070    | Deferral register (AMR, 10 km, genetic, blockchain) | Future feature per ADR-0023/0014                       |
| WO-145    | Prod secret management (Cloudflare Secrets Store)  | Deferred per ADR-0083; dev `.env` + encrypted disk sufficient |

**Total deferred:** WOs only — no resource estimate applies.

---

## 6. Sprint Assignment

Sprints are 2 weeks each. The ordering respects source priority (P0 → P1 → P2 → P3) and dependency constraints. All P0/P1 items in the active backlog are scheduled before any P3.

### Sprint N (Weeks 1–2): Foundation

| WO        | Activity                    | Priority | Dependencies    | Verification                                     |
| --------- | --------------------------- | -------- | --------------- | ------------------------------------------------ |
| WO-034    | Observability scaffold      | P2       | —               | `pnpm ci:checks` green; `TraceStage`/`MetricsStage` exist |
| WO-097    | Infra admin parity          | P2       | —               | Devices/IoT admin forms bound to Diamond Seal    |
| `farm_org_id` | Migration to rls-helpers.ts | —     | WO-097 (adjacent) | Function absorbed; `scripts/fix-rls-sql.mjs` updated |
| WO-123 Ph4 | Reconciling router/procedure count | P0  | WO-105, WO-089  | ROUTER_EXEMPT list verified; count mismatch closed |

**Risks:** WO-034 is prerequisite for WO-035/036; delay in Sprint N pushes those to N+1.

### Sprint N+1 (Weeks 3–4): Observability + Infrastructure Depth

| WO        | Activity                    | Priority | Dependencies | Verification                                     |
| --------- | --------------------------- | -------- | ------------ | ------------------------------------------------ |
| WO-035    | Retire manual logger        | P3       | WO-034       | Zero `logger.*` in service methods               |
| WO-036    | Business metrics            | P3       | WO-034       | Metrics emitted in all domain services/workers   |
| WO-086    | i18n layer (start)          | P2       | —            | `session.language` consumed; string extraction started |
| WO-165    | Tag re-order from farm (ADR + start code) | P1 | — | ADR authored; backend scaffolding begun |

**Risks:** WO-086 spans 2 sprints; may extend into N+2.

### Sprint N+2 (Weeks 5–6): Domain Depth + Feature Gaps Begin

| WO        | Activity                    | Priority | Dependencies | Verification                                     |
| --------- | --------------------------- | -------- | ------------ | ------------------------------------------------ |
| WO-086    | i18n layer (complete)       | P2       | —            | `dir`/RTL-ready; all UI strings centralized       |
| WO-060    | IoT RuleSet gate            | P3       | —            | UI/routers behind `RuleSet.features.iot`          |
| WO-024    | ADR-authoring: FIELD_CHANGED lock | P3 | ADR-0027    | ADR accepted (per ADR-0033 standard)              |
| WO-025    | ADR-authoring: QR ear tags  | P3       | ADR-0024/0009 | ADR accepted                                     |
| WO-166    | Pending-movement dashboard (ADR + impl) | P1 | —        | Dashboard page; 7-day countdown                  |
| WO-171    | Role-based home screen (ADR + impl) | P1   | —        | Farmer vs vet see different dashboards            |

**Risks:** P1 user-guide gaps (WO-165,166,171) may consume more than 1 sprint each.

### Sprint N+3 (Weeks 7–8): ADR-Ratified Execution

| WO        | Activity                    | Priority | Dependencies | Verification                                     |
| --------- | --------------------------- | -------- | ------------ | ------------------------------------------------ |
| WO-024    | FIELD_CHANGED pipeline      | P3       | WO-024 ADR   | VD lock on field changes                         |
| WO-025    | QR ear tags                 | P3       | WO-025 ADR   | QR on ear tags / documents per spec               |
| WO-164    | Bulk birth registration (impl) | P2    | WO-164 ADR   | Feature complete; docs updated                    |
| WO-167    | Notifiable disease push     | P2       | WO-091 (Done) | Push sent on notifiable disease report           |
| WO-169    | Farmer-facing risk score    | P2       | —            | Dashboard shows own risk                         |
| WO-172    | Cross-border pre-approval   | P2       | —            | Import/export workflow completed                  |

### Sprint N+4 (Weeks 9–10): Remaining Feature Gaps + Draft WOs

| WO        | Activity                    | Priority | Dependencies | Verification                                     |
| --------- | --------------------------- | -------- | ------------ | ------------------------------------------------ |
| WO-111    | ADR + impl: PostGIS POINT   | P3       | ADR-0053     | Migration; `addresses.location` migrated          |
| WO-112    | ADR + impl: OSM boundaries  | P3       | ADR-0053     | Nominatim integration (display-only)              |
| WO-168    | Vaccination schedule        | P3       | —            | Calendar view                                     |
| WO-170    | Correction request tracking | P3       | —            | Status indicator                                  |
| WO-173    | Offline queue indicator     | P3       | WO-082 (In Progress) | Pending-items badge                       |
| WO-123 Ph4 | `check:web-parity` `--strict` | P0     | WO-105, WO-089 | Guardian enforces parity; CI passes              |

### Future (no sprint assigned)

| WO        | Activity                    | Priority | Notes                                         |
| --------- | --------------------------- | -------- | --------------------------------------------- |
| WO-061    | IoT LPWAN QoS/SLA           | Future   | Deferred by design; no field IoT deployment    |
| WO-070    | Deferral register           | Future   | AMR, 10 km buffer, genetic lineage, blockchain |
| WO-145    | Prod secret management      | Future   | Dev `.env` sufficient for now                  |
| WO-071    | Calving gap confirmation    | P3       | **Blocked** until domain-owner resolves Q3     |
| WO-124..132 | ADR-0081 WOs              | P1–P3    | **Blocked** on gov input                       |
| WO-133..141 | ADR-0061 WOs              | P0–P2    | **Blocked** on legal input                     |
| WO-117,122 | GDPR WOs (Draft)          | P2       | **Blocked** on ADR-0061 answers + ADR ratification |

---

## 7. Verification & Guardians

Every code-changed WO must pass the following gates before being marked Done:

| Gate                       | Trigger                                          | Tool / Script                        |
| -------------------------- | ------------------------------------------------ | ------------------------------------ |
| tRPC boundary guard        | Every WO that touches a router or the generated client | `pnpm check:trpc-boundary`         |
| Visa-Matrix layer check    | Every WO that adds/changes an import in domain services or routers | `pnpm check:layers` (scripts/check-layers.mjs) |
| Permission drift test      | Every WO that adds a permission, role, or nav literal | `pnpm -C packages/authorization test` (WO-101) |
| ADR conformance            | Every WO that needs an ADR    | `pnpm check:adrs`                  |
| Markdown link check        | Every WO that adds/edits a doc page               | `pnpm check:md-links`               |
| Shadcn hygiene             | Every WO touching `apps/web/components`           | `pnpm check:shadcn`                 |
| Full CI composite          | Every WO that changes code (all of the above)     | `pnpm ci:checks` (generate:trpc → check:trpc-boundary → check:adrs → check:md-links → check:standards → check:agents → check:layers → check:shadcn → test) |
| Production build           | Every WO before merging to main                   | `pnpm build` (turbo — catches build rot invisible to `ci:checks`) |
| Web↔Backend parity (future) | Every WO that adds a backend procedure or a web page | `pnpm check:web-parity` (WO-123 Phase 4, not yet built) |

**Note on CI:** The repository has no `.github/workflows` directory. All CI-gated steps above rely on manual `pnpm ci:checks` invocation until CI infrastructure is committed. WO-102 (tRPC boundary guard), WO-107 (turbo coverage), and WO-123 Phase 4 (`--strict` enforcement) are all manual-gate items until then.

---

## 8. Risk Register

Known risks, production-reliability gaps, and environment constraints that do **not** have actionable WOs but must be documented.

| # | Risk | Impact | Mitigation |
| - | ---- | ------ | ---------- |
| R1 | **WO-082 native verification pending** | Offline/sync/push cannot be certified on-device; acceptance gated on native build environment | Harness supplies `tsc --noEmit` + WO-106 doc-test (11/11). Native CI environment required for final sign-off |
| R2 | **WO-123 Phase 4 `check:web-parity` not built** | Parity erosion between backend procedures and web affordances is not automatically detected | Manual parity audit during each sprint; schedule Phase 4 build in Sprint N+4 |
| R3 | **WO-145 prod secret management deferred** | Cloudflare Secrets Store not deployed; production secrets in `.env` files | Dev environment uses gitignored `.env` with `chmod 600` + encrypted disk; no immediate exposure |
| R4 | **`subjects` table RLS enabled with zero policies** | Deny-all for non-superuser on `subjects`; latent blind spot | All RLS tests scaffold with superuser; surfaced as observation in WO-031 corrigendum |
| R5 | **Seed data: `addresses.commune_id` is NULL, `org_areas` empty** | Org-scoped VET/VD RLS is non-functional at data level (policy code is correct) | Farmers still work (farm_subjects self-link); seed population is a known gap |
| R6 | **ADR-0061/0081 blocked on external input** | 19 WOs (P0–P3) cannot proceed; compliance deadlines at risk | External-blocker backlog segregated; engineering team can work sprintable items while waiting |
| R7 | **`EXPO_ACCESS_TOKEN` absent from all `.env` files** | Server-side push notification emission is dead code | Documented in WO-091; placeholder in `.env.example`; no user-facing impact (pull works) |
| R8 | **`DRIZZLE_MASTER_PASS` absent from `.env.example`** | Drizzle Studio compose service cannot start without this env var | Documented prerequisite for developers using Drizzle Studio |
| R9 | **`rocky_rls_test` role exists only on one dev DB** | RLS assertions use `describe.skipIf(!hasRLSEnv)` and silently skip without env | No CI scripting required; developers must create role manually when running RLS tests locally |

---

## 9. Draft-WO and Unspecified-P3 ADR Requisitions

Every WO that lacks a concrete specification requires an ADR authoring step before any code is written. The first deliverable for each is an accepted ADR per ADR-0033.

### 9.1 Draft WOs requiring ratification

| WO   | Current ADR        | ADR required              | Authoring sprint | Code sprint | Notes |
| ---- | ------------------ | ------------------------- | ---------------- | ----------- | ----- |
| WO-111 | ADR-0053 (Accepted) | Feature ADR for migration | N+4 (same)      | N+4         | Clarify scope: is this a pure schema migration or also a code migration? |
| WO-112 | ADR-0053 (Accepted) | Feature ADR for OSM       | N+4 (same)      | N+4         | Nominatim integration is display-only; no RLS impact |
| WO-117 | ADR-0054/0061       | Feature ADR               | Blocked          | Blocked      | Requires ADR-0061 answers first |
| WO-122 | ADR-0054/0061       | Feature ADR               | Blocked          | Blocked      | Requires ADR-0061 answers first |

### 9.2 Open P3 WOs requiring specification

| WO   | Source ADR | ADR required              | Authoring sprint | Code sprint | Notes |
| ---- | ---------- | ------------------------- | ---------------- | ----------- | ----- |
| WO-024 | ADR-0027   | Feature ADR for field-diff pipeline | N+2 | N+3   | No concrete spec; VD lock scope must be defined |
| WO-025 | ADR-0024 §E / ADR-0009 §6 | Feature ADR for QR ear tags | N+2 | N+3 | Cross-references ADR-0084 signed-QR credential |

### 9.3 User Guide Feature Gaps requiring full lifecycle

Each of the 10 gaps (WO-164–173) is a full feature request requiring:

1. **ADR authoring** (per ADR-0033 standard): problem statement, proposed solution, backend scope, frontend scope, permission model, cross-references to existing ADRs.
2. **Backend implementation**: tRPC procedure (if new), domain service (if new), repository layer, Zod schema, `@Policy` gate.
3. **Frontend implementation**: page/screen component, offline binding (where applicable), useCan gating, toast/error states, Empty/Skeleton loading.
4. **Documentation**: user guide page in `apps/docs/content/user-guide/`; ADR acceptance.

The three P1 gaps (WO-165, WO-166, WO-171) are prioritised for Sprint N+1/N+2; P2 gaps (WO-164, WO-167, WO-169, WO-172) follow in N+3; P3 gaps (WO-168, WO-170, WO-173) in N+4.

---

## 10. `farm_org_id()` Formal Migration — Detailed Scope

Currently the `farm_org_id()` SECURITY DEFINER function is injected only via:

- `scripts/fix-rls-sql.mjs` (lines 22–27: `CREATE OR REPLACE FUNCTION public.farm_org_id(...)`)
- The live dev DB (applied manually during the WO-031 recursion-fix pass)

It is **referenced by** `packages/database/src/schema/rls-helpers.ts` (line 72) but **never formally declared** in the Drizzle migration chain. A fresh `db-recreate.sh` that bypasses the `fix-rls-sql.mjs` script would lose the function, causing all RLS policies that depend on it to crash at the first non-superuser query.

### Required steps

1. **Add function declaration to `@rocky/database` schema source.** Create `packages/database/src/schema/helpers/farm-org-id.ts` that exports a SQL string `CREATE OR REPLACE FUNCTION public.farm_org_id(p_farm_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$ … $$`.
2. **Import and include in the Drizzle migration snapshot** so `pnpm generate` produces it as part of the migration chain.
3. **Update `rls-helpers.ts`**: remove the inline SQL comment dependency; the function is guaranteed to exist by the migration.
4. **Update `scripts/fix-rls-sql.mjs`**: the `FARM_ORG_ID_FN` injection becomes a no-op guard (idempotent, kept for backward compat).
5. **Generate and apply migration**: `cd packages/database && pnpm generate && node ../../scripts/fix-rls-sql.mjs && psql … -f migration.fixed.sql`.
6. **Verification**: `pnpm db:check` (if exists) or manual confirmation that `public.farm_org_id` exists post-migration; RLS tests (animal, movement, passport, archive, farm, subject) all green.

**Sprint assignment:** Sprint N alongside WO-097 (adjacent RLS scope).

---

## 11. WO-123 Phase 4 Outstanding Details

WO-123 is currently "In Progress" per the source. Its Phase 4 — the `check:web-parity` guardian — is **not yet built**. The following steps are required before flipping `--strict`:

1. **Reconcile router-count expectations.** Count actual routers in `apps/api/src/routers/` and compare with `api-reference.mdx` TOC. Any discrepancy must be resolved (router exists but undocumented, or documented but absent).
2. **Reconcile procedure-count expectations.** Count procedures per router (via `rg "@(Query|Mutation)\("`) and compare with `api-reference.mdx` listing.
3. **Finalize `ROUTER_EXEMPT` list.** `sync` is mobile-owned (web = read-only monitor per ADR-0055). All other routers must have web affordances. Document the exempt list in the guardian script.
4. **Build `check:web-parity` guardian.** Script that diffs `api-reference.mdx` TOC against `trpc.<router>` usage in `apps/web` source. Fail CI if any non-exempt router has zero web affordances.
5. **Enable `--strict` mode** (reject undocumented procedures).
6. **Wire into `pnpm ci:checks`** so every build enforces parity.

These steps are assigned to Sprint N (reconciliation) and Sprint N+4 (guardian build + --strict enablement).

---

## 12. Blocked-WO External Log

### 12.1 ADR-0081 Gov-Input Blockers

| WO   | Question                                   | Priority | Since | Days open | Status |
| ---- | ------------------------------------------ | -------- | ----- | --------- | ------ |
| WO-124 | Ratify Tier-1 invariant set               | P1       | —     | —         | Open · answer pending (gov) |
| WO-125 | Off-system-buyer seller-query step         | P1       | —     | —         | Open · pending design |
| WO-126 | Suspicious-eartag notify procedure         | P2       | —     | —         | Open · TBD |
| WO-127 | 8-hour slaughter transport window         | P2       | —     | —         | Open |
| WO-128 | Slaughterhouse tag-return obligation       | P2       | —     | —         | Open |
| WO-129 | Vet processes lost/destroyed eartag        | P2       | —     | —         | Open |
| WO-130 | Movement validator: nullable toFarmId      | P1       | —     | —         | Open · pending ratification |
| WO-131 | Carcass/meat tracking scope                | P3       | —     | —         | Open · TBD |
| WO-132 | TakeoverId vs derive-from-order            | P3       | —     | —         | Open |
| WO-142 | Compliance UI permission model             | P1       | —     | —         | Open · modeled |

### 12.2 ADR-0061 Legal-Input Blockers

| WO   | Question                                   | Priority | Since | Days open | Status |
| ---- | ------------------------------------------ | -------- | ----- | --------- | ------ |
| WO-133 | GDPR applicability scope                   | P0       | —     | —         | Open · answer pending (legal) |
| WO-134 | MK national animal-health/personal-data acts | P1     | —     | —         | Open · pending legal input |
| WO-135 | DSAR identity verification                 | P1       | —     | —         | Open |
| WO-136 | Break-glass emergency PII access           | P1       | —     | —         | Open |
| WO-137 | Signing-key custody (ISO 27701 best practice) | P2    | —     | —         | Open |
| WO-138 | Pseudonym rotation on erasure              | P2       | —     | —         | Open |
| WO-139 | Erasure ≠ deletion: crypto-shred DEK       | P2       | —     | —         | Open |
| WO-140 | GDPR consent-fantasy / graceful degradation | P1      | —     | —         | Open · answer pending (realism) |
| WO-141 | GDPR vs ISO 27701: do not architect mandatory compliance | P1 | — | — | Open |

### 12.3 Domain-Owner Blockers

| WO   | Question                                   | Priority | Blocking condition |
| ---- | ------------------------------------------ | -------- | ------------------ |
| WO-071 | Calving-gap divergence (365 d vs legacy 120 d) | P3  | Domain-owner confirmation of the correct value |

---

## 13. Summary — Sprint Allocation Matrix

| Sprint    | Weeks  | WOs                                        | Focus                                |
| --------- | ------ | ------------------------------------------ | ------------------------------------ |
| N         | 1–2    | WO-034, WO-097, WO-123 Ph4 (reconcile), `farm_org_id` migration | Foundation + observability + infra parity |
| N+1       | 3–4    | WO-035, WO-036, WO-086 (start), WO-165 (ADR) | Observability depth + i18n + first feature gap |
| N+2       | 5–6    | WO-086 (complete), WO-060, WO-024/025 (ADR), WO-166, WO-171 | Domain depth + P1 feature gaps |
| N+3       | 7–8    | WO-024 (code), WO-025 (code), WO-164, WO-167, WO-169, WO-172 | ADR-ratified execution + P2 gaps |
| N+4       | 9–10   | WO-111, WO-112, WO-168, WO-170, WO-173, WO-123 Ph4 (guardian) | Draft WOs + P3 gaps + parity guardian |
| Future    | —      | WO-061, WO-070, WO-145                      | Deferred                              |
| Blocked   | —      | WO-071, WO-117, WO-122, WO-124–132, WO-133–141 | Awaiting external input              |

**Total sprints to clear execution-ready backlog: 5 (10 calendar weeks).**  
**Total blocked WOs: 22 (19 external-blocker + 3 deferred-by-design).**  
**`farm_org_id()` migration: Sprint N (WO-097 adjacency).**

---

## 14. Plan Change Log

| Date       | Change                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| 2026-07-24 | Initial plan authored from `apps/docs/content/workorder.md` snapshot.  |
