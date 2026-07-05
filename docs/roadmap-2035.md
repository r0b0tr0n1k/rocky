# Roadmap 2035

## From National I&R Database to Livestock Data Platform

> **Context:** This roadmap responds to the JRC Science for Policy Report "Identification and monitoring
> of livestock with biologging" (Cagnacci, 2026, KJ-01-26-012-EN-N). It maps Rocky's current
> capabilities against the EU regulatory trajectory and proposes a phased evolution pathway.

---

## Table of Contents

1. [Current State (2026)](#1-current-state-2026)
2. [The EU Regulatory Trajectory (2026–2035)](#2-the-eu-regulatory-trajectory-2026-2035)
3. [Phase 1: IoT Foundation (Q3 2026–Q1 2027)](#3-phase-1-iot-foundation-q3-2026-q1-2027)
4. [Phase 2: Integration & Standards (2027–2028)](#4-phase-2-integration--standards-2027-2028)
5. [Phase 3: Welfare & Compliance (2028–2030)](#5-phase-3-welfare--compliance-2028-2030)
6. [Phase 4: Platform Maturity (2030–2035)](#6-phase-4-platform-maturity-2030-2035)
7. [Positioning Strategy](#7-positioning-strategy)
8. [Risk & Mitigation](#8-risk--mitigation)
9. [Immediate-Benefit Recommendations](#9-immediate-benefit-recommendations)

---

## 1. Current State (2026)

### What Rocky Is Today

Rocky is a **complete national Identification & Registration (I&R) system** built on:

| Layer | Implementation | Tables |
|-------|---------------|--------|
| Entity registration | Farms, animals, subjects | 12+ tables |
| Identification | Ear tags, allocations, orders, replacements | 6 tables |
| Movement tracking | Departure/arrival, death, pasture, slaughter, market, import/export | `movements` + `pasture_declarations` + `import_export_records` |
| Health | Diseases, vaccines, batches, vaccinations, treatments, lab tests | 7 tables in `hd/` |
| Passport lifecycle | Issue, ship, deliver, seize, reprint, archive | `cattle_passports` |
| Inspection management | Risk analysis, scheduling, form generation, retention | `inspections` + `risk_analyses` |
| Archive | 3-tier document archive (CPC/VS/VI) with retention cron | `archive_documents` |
| Audit | Full pre/post JSON snapshots, RLS-scoped, partition-ready | `audit_log` |
| Auth & RBAC | Better Auth with roles, permissions, per-farm subject binding | `sm/` + `authorization/` |
| Security | Row-Level Security on 20+ tables | `rls-helpers.ts` |

**57 tables, 71 enums, 156 indexes, 68 foreign keys, 39 RLS policies.**

### What Rocky Is NOT Yet

| Gap | Impact | Evidence from Analysis |
|-----|--------|----------------------|
| **No IoT device registry** | Cannot track GNSS/LPWAN ear tags as distinct from passive tags | Only `pda_devices` (smartphones) exists |
| **No sensor data pipeline** | Biologging data has nowhere to go | Zero ingestion endpoints |
| **No time-series location history** | Cannot answer "where was animal X at 14:00?" | `farms.location` is static PostGIS point |
| **No IACS/TRACES integration** | Cannot exchange data with CAP subsidy systems or cross-border | Zero references in codebase |
| **No GDPR consent management** | Biologging location data is personal data under GDPR | Zero consent/privacy infrastructure |
| **No welfare monitoring** | Cannot support future CAP result-based payments | Zero behavior/welfare models |
| **No data minimization** | Raw GNSS data is an existential privacy risk | No aggregation/rollup pipeline |
| **No geofence activation** | Geofence Zod schemas exist but are unused | `PolygonGeometry`/`CircleGeometry` in `coordinate-schema.ts` — zero production tables |
| **No behavior state tracking** | Accelerometer data has no semantic model | No grazing/ruminating/walking states |

---

## 2. The EU Regulatory Trajectory (2026–2035)

### The JRC Report's Key Findings

The Cagnacci (2026) report makes several determinations that directly shape Rocky's roadmap:

| Finding | Regulatory Implication | Timeline |
|---------|----------------------|----------|
| Electronic ear tags with GNSS/LPWAN satisfy "additional" ID status for cattle, pigs, adult sheep/goats | **E-ID becomes mandatory** — Regulation 2016/429 + Delegated 2019/2035 already require electronic ID for certain species. Biologging-capable tags become the compliance standard. | **2026–2028** |
| Current I&R systems "lack real-time location data" | **Real-time tracking becomes regulatory expectation** — not just "animal moved from A to B" but "animal is currently at coordinates X,Y" | **2027–2029** |
| Behavioral monitoring can support animal welfare compliance | **Welfare becomes data-driven** — CAP result-based payments require objective welfare indicators (grazing time, mobility, social behavior) | **2028–2030** |
| "Very little available on standards for sensor data" | **Standards will emerge** — EMAP, ICAR, or ISO will define biologging data models. Early adopters shape the standard. | **2027–2031** |
| Data flow "not explicit, mostly closed, unclear data accessibility" | **Open APIs become mandatory** — IACS/CAP information flow requires interoperable data exchange | **2028–2032** |
| GDPR compliance for biologging needs "specific assessments" | **Regulatory guidance will codify** — consent management, data minimization, right-to-deletion for high-frequency location streams | **2027–2030** |

### The Four Regulatory Waves

```
Wave 1 (2026-2028): MANDATORY E-ID
  └─ Rocky must distinguish passive RFID from GNSS/LPWAN tags
  └─ Device registry for electronic identification

Wave 2 (2027-2029): REAL-TIME TRACEABILITY
  └─ Rocky must ingest and store time-series location data
  └─ IACS integration for CAP compliance

Wave 3 (2028-2030): WELFARE & RESULTS-BASED CAP
  └─ Rocky must derive behavioral indicators from sensor data
  └─ Geofence/virtual boundary monitoring for grazing intensity

Wave 4 (2030-2035): DATA PLATFORM MATURITY
  └─ Rocky becomes national livestock data platform
  └─ GDPR-by-design, open standards, third-party sensor marketplace
```

---

## 3. Phase 1: IoT Foundation (Q3 2026 – Q1 2027)

### Objective

Establish the data infrastructure for IoT-capable ear tags and sensor data **before** hardware is deployed. The schema must exist first — data cannot be captured without a home.

### 3.1 Extend `ear_tag_types` with Technology Metadata

> **Rationale:** Today `ear_tag_types` describes shape, color, material but cannot distinguish a passive RFID tag from a GNSS-enabled LPWAN tag. This extension is essential for regulatory compliance (Wave 1).

```typescript
// Proposed extensions to earTagTypes schema:
technologyType: varchar("technology_type", { length: 20 })
  // Values: PLASTIC | RFID | GNSS | LPWAN | HYBRID
  // PLASTIC = visual-only (current standard)
  // RFID = passive/active RFID (electronic ID)
  // GNSS = satellite positioning tag
  // LPWAN = LoRaWAN/SigFox/NB-IoT tag
  // HYBRID = combination (e.g. GNSS + LPWAN)

hasSensors: boolean("has_sensors").default(false)
  // Whether this tag type has integrated sensors
  // (accelerometer, temperature, ruminal pH, etc.)

sensorCapabilities: jsonb("sensor_capabilities")
  // Describes what sensors the tag supports:
  // { accelerometer: true, temperature: true, ruminalPH: false }

transmissionProtocol: varchar("transmission_protocol", { length: 30 })
  // The communication protocol used by the tag
  // Values: NONE | RFID_HF | RFID_UHF | LORAWAN | SIGFOX | NB_IOT | LTE_M | SATELLITE | BLUETOOTH

expectedBatteryLifeMonths: integer("expected_battery_life_months")
  // Expected operational life for active tags

firmwareUpdatable: boolean("firmware_updatable").default(false)
  // Whether the tag supports OTA firmware updates
```

**Effort:** Low (1–2 days: schema + Dumb Zod + API validators + seed data)
**Dependencies:** None
**Value:** Enables device-type-aware reporting from day one

### 3.2 Create `iot_devices` Table

> **Rationale:** The existing `pda_devices` table registers smartphones used by field workers. IoT devices are fundamentally different — they are attached to animals, transmit autonomously, have battery constraints, and generate sensor streams. The schema extends the proven device-registry pattern.

```typescript
// Proposed iot_devices table (extends pda_devices pattern):
iotDevices: pgTable("iot_devices", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Device identity
  deviceEui: varchar("device_eui", { length: 64 }).unique(),
    // EUI-64 or similar globally unique identifier (LoRaWAN DevEUI, IMEI, etc.)

  // Device type (FK to ear_tag_types or standalone device catalog)
  deviceTypeId: uuid("device_type_id")
    .references(() => iotDeviceTypes.id),
    // Links to hardware catalog

  tagId: uuid("tag_id")
    .references(() => earTags.id),
    // The physical ear tag this device is embedded in

  // Assignment (which animal/farm currently carries this device)
  assignedToAnimalId: uuid("assigned_to_animal_id")
    .references(() => animals.id),
  assignedToFarmId: uuid("assigned_to_farm_id")
    .references(() => farms.id),
  activationDate: date("activation_date").notNull(),
  deactivationDate: date("deactivation_date"),

  // Firmware & power
  firmwareVersion: varchar("firmware_version", { length: 30 }),
  firmwareUpdatedAt: timestamp("firmware_updated_at"),
  batteryLevel: integer("battery_level"),
    // 0-100 percentage at last transmission
  batteryLastChecked: timestamp("battery_last_checked"),

  // Transmission
  transmissionType: varchar("transmission_type", { length: 30 }),
    // LORAWAN | SIGFOX | NB_IOT | LTE_M | SATELLITE | BLUETOOTH
  lastTransmissionAt: timestamp("last_transmission_at"),
  transmissionIntervalSeconds: integer("transmission_interval_seconds"),

  // Metadata
  manufacturer: varchar("manufacturer", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),

  // Status
  status: deviceStatusPgEnum("status").notNull().default("active"),

  // Audit
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  validTo: timestamp("valid_to"),
})
```

**Supporting tables:**
- `iot_device_types` — catalog of known IoT hardware (manufacturer, model, capabilities, cost)
- `iot_device_events` — lifecycle log (activated, deactivated, battery low, firmware updated, transmission failed)

**Effort:** Medium (3–5 days: schema + validators + service + API endpoints)
**Dependencies:** `ear_tag_types` extension (3.1)
**Value:** Provides the device registry that Phase 2 needs for sensor data attribution

### 3.3 Create `sensor_readings` Table

> **Rationale:** The core time-series table. Without it, sensor data from pilot deployments has nowhere to go. The table must support diverse reading types (location, temperature, acceleration, pH) while remaining queryable by time, animal, farm, and device.

```typescript
// Proposed sensor_readings table:
sensorReadings: pgTable("sensor_readings", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Source
  deviceId: uuid("device_id")
    .notNull()
    .references(() => iotDevices.id),
  animalId: uuid("animal_id")
    .references(() => animals.id),
  farmId: uuid("farm_id")
    .references(() => farms.id),

  // Temporal
  recordedAt: timestamp("recorded_at").notNull(),
    // When the sensor took the measurement (device timestamp)
  ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
    // When Rocky received the data (server timestamp)
  transmissionDelaySeconds: integer("transmission_delay_seconds"),
    // recordedAt - ingestedAt — useful for LPWAN coverage analysis

  // Reading
  readingType: varchar("reading_type", { length: 30 }).notNull(),
    // LOCATION | TEMPERATURE | ACTIVITY | RUMINAL_PH |
    // HEART_RATE | ACCELEROMETER_X | ACCELEROMETER_Y | ACCELEROMETER_Z |
    // BATTERY | MORTALITY | PROXIMITY

  valueNumeric: numeric("value_numeric", { precision: 20, scale: 6 }),
  valueText: text("value_text"),
  unit: varchar("unit", { length: 20 }),

  // Location at time of reading
  location: geometry("location"),
    // PostGIS Point — the GNSS coordinate at reading time

  // Raw payload (for debugging)
  rawPayload: jsonb("raw_payload"),

  // Processing
  processedAt: timestamp("processed_at"),
  processingStage: varchar("processing_stage", { length: 30 }).default("raw"),
    // RAW | VALIDATED | AGGREGATED | ANOMALY_FLAGGED

  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

**Key design decisions:**
- `readingType` is a varchar (not an enum) — sensor types will evolve rapidly. An enum would require migrations for every new sensor type.
- Location is nullable — many sensors (temperature bolus, accelerometer) don't provide GNSS data.
- Raw payload retained for reprocessing — if processing algorithms improve, historical data can be re-processed.
- **No UPDATE** on readings — immutable append-only log. Errors are corrected by adding corrected readings, not by mutation.

**Effort:** Medium (3–5 days: schema + ingestion API endpoint + basic query API)
**Dependencies:** `iot_devices` table (3.2)
**Value:** Without this table, Rocky cannot accept biologging data. This is the foundational table for all later phases.

### 3.4 Farm-Level Transmission Coverage

> **Rationale:** Different farms have different connectivity. Mountain pastures may only have satellite coverage; valley farms may have LPWAN and GSM. This data is essential for VS deployment planning.

```typescript
// Extension to farms table:
availableNetworks: jsonb("available_networks").$type<{
  loraWan?: { available: boolean; provider?: string; signalQuality?: number };
  sigfox?: { available: boolean; signalQuality?: number };
  nbIot?: { available: boolean; signalQuality?: number };
  gsm?: { available: boolean; providers?: string[]; signalQuality?: number };
  satellite?: { available: boolean; providers?: string[] };
  satelliteOnlyPasture?: boolean; // Summer pastures unreachable by terrestrial networks
}>();
```

**Alternatively**, a separate `farm_network_coverage` table for per-network details with verification dates.

**Effort:** Low (1 day: schema + seed data for pilot farms)
**Dependencies:** None
**Value:** Enables intelligent device deployment planning and cost optimization

### 3.5 Activate Geofence Infrastructure

> **Rationale:** The Zod schemas for `PolygonGeometry`, `CircleGeometry`, and `GeofenceGeometry` already exist in `packages/database/src/geometry/coordinate-schema.ts` but are unused. Creating the production tables unlocks virtual boundary management.

```typescript
// Proposed geofences table:
geofences: pgTable("geofences", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id),
  pastureId: uuid("pasture_id")
    .references(() => pastureDeclarations.id),

  // Geofence shape (stored as PostGIS polygon)
  boundary: geometry("boundary").notNull(),
    // PostGIS Polygon — the actual boundary

  // Type
  fenceType: varchar("fence_type", { length: 30 }).notNull(),
    // FARM_BOUNDARY | PASTURE_BOUNDARY | EXCLUSION_ZONE | WATER_SOURCE

  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),

  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  validTo: timestamp("valid_to"),
})

// Proposed animal_geofence_events table:
animalGeofenceEvents: pgTable("animal_geofence_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  animalId: uuid("animal_id")
    .notNull()
    .references(() => animals.id),
  geofenceId: uuid("geofence_id")
    .notNull()
    .references(() => geofences.id),
  eventType: varchar("event_type", { length: 20 }).notNull(),
    // ENTERED | EXITED | INSIDE | OUTSIDE
  eventAt: timestamp("event_at").notNull(),
  location: geometry("location"),
    // Where the animal was when the event was triggered
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

**Effort:** Medium (3–4 days: schema + service + geofence evaluation logic using PostGIS ST_Contains)
**Dependencies:** Phase 3.3 (sensor_readings with location data) for automated events; can work with manual boundary definition first
**Value:** Directly enables CAP grazing intensity compliance — "was the herd within designated pasture boundaries?"

### Phase 1 Dependency Graph

```
3.1 ear_tag_types extension
    │
    ▼
3.2 iot_devices table ─────────────────────┐
    │                                       │
    ▼                                       ▼
3.3 sensor_readings table              3.5 geofences + events
    │                                       │
    └────────────┬──────────────────────────┘
                 ▼
        3.4 farm_network_coverage
          (independent, can run anytime)
```

---

## 4. Phase 2: Integration & Standards (2027–2028)

### Objective

Make Rocky interoperable with EU-level systems (IACS, TRACES, CAP) and establish standard sensor data formats.

### 4.1 IACS CAP Integration

The Common Agricultural Policy (CAP) requires member states to track:
- Land use (what fields are used for grazing, what crops)
- Grazing intensity (livestock units per hectare)
- Animal welfare indicators

**Implementation:**
- CAP-compatible annual report generator (aggregate sensor data → compliance report)
- IACS farm parcel integration (link animals to specific land parcels)
- Cross-border movement data exchange via TRACES API

### 4.2 TRACES / BOVEX API Client

- Import: receive animal arrival notifications from EU member states
- Export: push departure notifications for cross-border trade
- Foreign passport tracking: store and retrieve 3-year retention documents

### 4.3 Sensor Data Standards Mapping

The JRC report notes "very little available on the standards to be used for the data obtained from the sensors." Rocky should:

1. Monitor EMAP (Environmental Monitoring and Analysis Platform) standards
2. Adopt ICAR (International Committee for Animal Recording) data models
3. Publish an open API specification for biologging data ingestion
4. Contribute to standards development through EU research projects

### 4.4 Mobile Sync Phase B+E

Complete the pending offline sync engine:
- Local SQLite database on each mobile device (Phase B)
- Sync queue with conflict resolution (Phase E)
- Network-aware tRPC wrapper

---

## 5. Phase 3: Welfare & Compliance (2028–2030)

### Objective

Derive behavioral indicators from sensor data to support CAP result-based payments and animal welfare compliance.

### 5.1 Behavioral State Model

Accelerometer data → machine learning classification → behavioral states:

```
Raw accelerometer data
  → Feature extraction (mean acceleration, variance, frequency components)
  → Classification model
  → Behavioral states: GRAZING | RUMINATING | WALKING | RESTING | DISTRESSED | OTHER
  → Daily budget: X hours grazing, Y hours ruminating, Z hours resting
```

```typescript
// Proposed animal_behavior_states table:
animalBehaviorStates: pgTable("animal_behavior_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  animalId: uuid("animal_id").notNull().references(() => animals.id),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  state: varchar("state", { length: 30 }).notNull(),
    // GRAZING | RUMINATING | WALKING | RESTING | DISTRESSED
  confidence: numeric("confidence", { precision: 4, scale: 3 }),
    // Model confidence score (0.000 - 1.000)
  modelVersion: varchar("model_version", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

This is the most complex and highest-value component. It requires:
- Training data from deployed biologgers
- ML model development (or vendor-provided models)
- Veterinary behavior validation
- CAP compliance report generation

### 5.2 Welfare Indicator Dashboard

| Indicator | Sensor Source | Regulation |
|-----------|-------------|------------|
| Daily grazing time ≥ 8h | Accelerometer → behavior state | CAP animal welfare |
| Lying time ≥ 10h | Accelerometer → resting | EU 2016/429 |
| Lameness detection | Accelerometer gait analysis | Welfare Quality® |
| Estrus detection | Activity spikes | Farm management |
| Rumination time | Accelerometer → jaw movement | Health monitoring |
| Mortality alerts | 24h+ no movement | Immediate response |

### 5.3 Notifiable Disease Early Warning

The JRC report describes mortality/birth sensors for "demographic monitoring." Rocky can extend this:

1. **Behavioral anomaly detection** — if animal stops grazing/ruminating for N hours, flag as potential illness
2. **Fever detection** — ruminal bolus temperature + behavioral change = early disease alert
3. **Proximity sensors** — animal-to-animal contact tracing for notifiable diseases (the report describes this for disease transmission modeling)

This directly integrates with Rocky's existing `HealthService.recordTreatment()` + `InspectionRepository.flagFarmForInspection()` pipeline.

---

## 6. Phase 4: Platform Maturity (2030–2035)

### Objective

Rocky evolves from a national I&R database into a **national livestock data platform** — a trusted, scalable, GDPR-compliant data hub for all stakeholders (CPC, VS, VI, farmers, slaughterhouses, markets, researchers).

### 6.1 GDPR-by-Design Data Pipeline

```
GNSS collar transmits location every 15 minutes
    │
    ▼
Raw ingestion (sensor_readings)
    │  GDPR consent check — if consent revoked, stop at ingestion
    ▼
Validation + cleaning
    │
    ├──→ Real-time: last known position API (current location of animal X)
    │
    ├──→ Daily aggregation: 15-min points → daily grazing polygon → animal-days
    │     Raw points purged after aggregation (data minimization)
    │
    └──→ Monthly rollup: daily polygons → monthly home range → IACS report
          Raw daily polygons purged (retention policy)
```

**Key GDPR safeguards:**
- **Consent management** — per-farm, per-device, per-data-type opt-in/opt-out
- **Data minimization** — raw GNSS points are transient; only aggregated patterns are retained
- **Right to deletion** — delete all data for a specific device/animal/farm within SLA
- **Purpose limitation** — sensor data tagged with purpose (COMPLIANCE | WELFARE | RESEARCH)
- **Third-party processor register** — each data transmission vendor (Iridium, SigFox, LoRaWAN operator) documented in system

### 6.2 National Livestock Data Lake

- Parquet-format exports for analytics (Spark, DuckDB)
- ML-ready feature store (behavioral features, health features, farm features)
- Anonymized research access API (GDPR-compliant, aggregate-level only)
- Cross-border data sharing with EU member states (TRACES integration)

### 6.3 Third-Party Sensor Marketplace

- Certified sensor hardware catalog
- Vendor onboarding API
- Data format certification process
- Shared-cost procurement (CPC buys tags, farmers pay service fee)

### 6.4 Edge AI / On-Tag Processing (Long-term)

As hardware evolves from "transmit raw data" to "process on tag and send only events":
- Firmware update pipeline for OTA updates
- On-tag ML model versioning
- Event-driven transmission (only transmit when anomaly detected, not on fixed interval)

---

## 7. Positioning Strategy

### 7.1 From National I&R to Reference Implementation

Rocky's existing architecture positions it uniquely:

| Advantage | How It Maps to Biologging |
|-----------|--------------------------|
| Complete PostgreSQL schema for I&R | Sensor data joins directly to animals, farms, movements, health records |
| 39 RLS policies | Per-farm data isolation extends naturally to sensor data |
| Audit log with pre/post snapshots | Sensor data provenance built on same audit framework |
| Offline-first mobile architecture | Field biologist can deploy biologgers and register them via the existing mobile app |
| Document generation pipeline | CAP compliance reports generated via existing YAML/SVG pipeline |
| Modular domain packages | `@rocky/domains-iot` slots alongside existing domains |

### 7.2 Strategic Recommendations

**Short-term (2026):**
1. Implement Phase 1 (schema infrastructure) — zero hardware required, pure software investment
2. Submit research proposal for EU pilot on biologging integration in national I&R
3. Participate in ICAR/EMAP standards working groups for sensor data models
4. Develop TRACES API integration roadmap with Ministry of Agriculture

**Medium-term (2027–2028):**
1. Deploy 100 LPWAN ear tags in pilot region with VS collaboration
2. Publish open API specification for sensor data ingestion
3. Integrate with CAP payment system for grazing intensity reporting
4. Establish GDPR-compliant data processing framework for biologging

**Long-term (2029–2035):**
1. Scale to national deployment across all cattle (600k+ head)
2. Expand to small ruminants (sheep/goats) with GNSS collars
3. Offer biologging-as-a-service to neighboring countries
4. Deploy edge AI pipeline for real-time anomaly detection

### 7.3 Business Model Evolution

```
Today: CPC-funded national I&R database
  │
  ▼
2027: CPC + VS co-funded biologging pilot
  │     (device procurement shared across regions)
  ▼
2029: CPC + VS + CAP co-funded welfare compliance
  │     (result-based payments incentivize biologging)
  ▼
2032: Multi-stakeholder platform
  │     (CPC, VS, farmers, insurers, researchers, exporters)
  ▼
2035: National livestock data utility
  │     (mandatory for all cattle, voluntary for other species)
```

---

## 8. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Cost:** GNSS collars €1k–€3k/unit — unaffordable for most farmers | High | High | Start with LPWAN ear tags (€100–€300). Design for tiered deployment: LPWAN for all, GNSS only for high-value/high-risk animals. Advocate for CAP co-funding. |
| **GDPR:** High-frequency location data is personal data, risk of €20M fines | Medium | Critical | Implement data minimization by design. Raw data is transient (retain 24h), aggregated data is permanent. Consent management at farm level. |
| **LPWAN coverage gaps:** Mountain pastures unreachable | High | Medium | Farm-level coverage catalog (Phase 1.4). Deploy satellite-backup tags in identified gap areas. Coverage-aware device assignment. |
| **Adoption:** Farmers resist additional device cost and complexity | High | Medium–High | Pilot with progressive farmers. Prove value (reduced labor, health alerts, CAP payments). Phased rollout starting with mandatory e-ID conversion. |
| **Standards flux:** Sensor data standards not yet defined | Medium | Low | Adopt flexible schema (varchar readingType, jsonb rawPayload). Migration is trivial when standards crystallize. |
| **Battery depletion:** Active tags require battery replacement | Medium | Medium | batteryLevel tracking in iot_devices. Proactive replacement scheduling. Battery life guarantee in procurement contracts. |
| **Data volume explosion:** 600k animals × 96 readings/day = 57M records/day | Medium | Medium | Time-series partitioning by month. Daily aggregation in Phase 4. Hot/warm/cold storage tiers. |
| **Interoperability failure:** Rocky's data model diverges from EU standards | Low | Medium | Contribute to standards development. Stable internal API with standards-compatible export adapters. |
| **Vendor lock-in:** Proprietary biologging platforms | High | Medium | Open API specification. Vendor-neutral data format. Multi-vendor hardware certification. |

---

## 9. Immediate-Benefit Recommendations

*This section identifies what should be implemented **right now** — not in a roadmap phase, but in the current sprint cycle. These are low-effort, high-value changes that position Rocky for the biologging future with zero hardware dependency.*

### Recommendation 1: Extend `ear_tag_types` with Technology Metadata

**Effort:** 1–2 days  
**Risk:** None (additive schema change, no existing data migration)  
**Benefit:** Immediately enables reporting on which farms have which tag technology types. When the first IoT tags arrive, they have a home.

**Implementation:**
```typescript
// Add to earTagTypes schema:
technologyType: varchar("technology_type", { length: 20 })
hasSensors: boolean("has_sensors").default(false)
sensorCapabilities: jsonb("sensor_capabilities")
transmissionProtocol: varchar("transmission_protocol", { length: 30 })
expectedBatteryLifeMonths: integer("expected_battery_life_months")
```

**Files affected:**
- `packages/database/src/schema/an/ear-tag-types.ts` — schema
- `packages/database/src/zod/an.ts` — Dumb Zod
- `packages/validators/src/enums/domain.ts` — zEnum
- Seed data: update existing tag types with technology metadata

### Recommendation 2: Create `iot_devices` + `iot_device_types` Tables

**Effort:** 3–5 days  
**Risk:** None (new table, no existing data migration)  
**Benefit:** Establishes the device registry that all downstream phases depend on. Extends proven `pda_devices` pattern. No hardware needed to populate — devices can be registered as "planned" before physical deployment.

**Implementation:**
- New file: `packages/database/src/schema/an/iot-devices.ts`
- New file: `packages/database/src/schema/an/iot-device-types.ts`
- Constants: `iot-device-status.ts` → extends existing `device-status`
- Dumb Zod + validators + basic CRUD service + tRPC router

### Recommendation 3: Create `sensor_readings` Table with Ingestion Endpoint

**Effort:** 3–5 days  
**Risk:** None (new table, append-only)  
**Benefit:** The foundational time-series table. Once it exists, you can:
- Simulate sensor data for testing
- Accept data from pilot biologgers immediately
- Build dashboards against real data
- Demo the system to stakeholders

**Implementation:**
- New file: `packages/database/src/schema/an/sensor-readings.ts`
- Ingestion API: `POST /api/trpc/sensor.ingest` (batch endpoint, accepts arrays of readings)
- Query API: `GET /api/trpc/sensor.list` (filter by animalId, deviceId, time range)
- RLS: `rlsForFarmColumn(table.farmId)` — sensor data inherits farm-scoped access control

### Recommendation 4: Activate Geofence Infrastructure

**Effort:** 3–4 days  
**Risk:** None (new tables, existing PostGIS infrastructure ready)  
**Benefit:** The `PolygonGeometry`/`CircleGeometry` Zod schemas are **already written** — they are dead code waiting to be used. Creating the geofences table activates virtual boundary management.

**Implementation:**
- New file: `packages/database/src/schema/an/geofences.ts`
- New file: `packages/database/src/schema/an/animal-geofence-events.ts`
- Wire existing `coordinate-schema.ts` Zod types to API validators
- Basic CRUD for geofences on farms/pastures

### Recommendation 5: Add Farm-Level Network Coverage Metadata

**Effort:** 1 day  
**Risk:** None (additive jsonb column)  
**Benefit:** Enables VS deployment planning. Identify which farms can use which transmission types without on-site surveys.

**Implementation:**
- Add `availableNetworks` jsonb column to farms table
- Seed data for pilot region farms
- Basic UI for CPC planners to update coverage data

### Priority Matrix

```
                      HIGH VALUE
                         │
                         │
    Recommendation 1 ◄───┤───► Recommendation 3
    (1 day, tech meta)   │   (4 days, sensor table)
                         │
    Recommendation 5 ◄───┤───► Recommendation 2
    (1 day, coverage)    │   (4 days, device registry)
                         │
    Recommendation 4 ◄───┤
    (3 days, geofence)   │
                         │
                      HIGH EFFORT
```

**Sequencing recommendation:**
```
Week 1: Rec 1 (ear_tag_types) + Rec 5 (farm coverage)
  → Both 1-day changes, independent, no migrations risk
  → Enables immediate reporting on "which farms have which tags"

Week 2: Rec 2 (iot_devices) + Rec 4 (geofences)
  → Both new tables, independent
  → Establishes device registry + boundary infrastructure

Week 3: Rec 3 (sensor_readings + ingestion API)
  → Depends on Rec 2 (iot_devices FK)
  → Capstone — once this is done, Rocky accepts biologging data
```

**Total effort:** ~15 developer-days across one sprint cycle

> **The key insight:** None of these Phase 1 recommendations require a single piece of hardware to be deployed. They are pure software infrastructure. The schema must exist before the data can flow. By investing 15 days now, Rocky goes from "cannot accept IoT data" to "ready for biologging pilot deployment" — a strategic position that can be demonstrated to CPC, EU partners, and standards bodies.

---

## Appendix: JRC Report Mapping

| JRC Report Section | EU Requirement | Rocky Readiness | Phase |
|-------------------|---------------|-----------------|-------|
| 2.1 Tracking/ID | Electronic ID for cattle, pigs, sheep/goats | `ear_tag_types` exists but lacks technology classification | Phase 1.1 |
| 2.2 Biologging sensors | Accelerometer, GNSS, ruminal bolus, proximity | No sensor data infrastructure | Phase 1.3, Phase 3.1 |
| 2.3 Data transmission | LPWAN, satellite, GSM — coverage matters | No transmission type tracking | Phase 1.4 |
| 2.4 Data preservation | Where is data stored? Is it GDPR-compliant? | `audit_log` + RLS exist but no biologging-specific GDPR | Phase 4.1 |
| 3.1 GNSS ear tags | "Most policy-compatible, cost-effective pathway" | No GNSS tag type in schema | Phase 1.1 + 1.2 |
| 3.2 IoT/LPWAN tags | "Satisfy additional ID status" | No LPWAN tag type in schema | Phase 1.1 + 1.2 |
| 3.3 Collars | High cost, high precision | Schema must support multiple device form factors | Phase 1.2 |
| 4.1 Behavioural monitoring | Accelerometer → activity, grazing, health | No behavior state model | Phase 3.1 |
| 4.2 Proximity sensors | Contact tracing for disease transmission | Not planned (research phase) | Future |
| 4.3 Mortality/demography | Birth/death detection | `animals` table has birthDate, status; no sensor-based mortality | Phase 3.3 |
| 5.1 IACS/CAP integration | Grazing intensity, land use monitoring | No IACS integration | Phase 2.1 |
| 5.2 Cross-border traceability | TRACES for EU trade | No TRACES integration | Phase 2.2 |
| 6.1 GDPR compliance | Consent, data minimization, right to deletion | No biologging-specific GDPR infrastructure | Phase 4.1 |

---

> **Document status:** Living document — update as EU regulations evolve, hardware costs change, and pilot results inform the roadmap.
>
> **Last updated:** July 2026
> **Based on:** Cagnacci, F. (2026). *Identification and monitoring of livestock with biologging.*
> JRC Science for Policy Report, KJ-01-26-012-EN-N. Publications Office of the European Union.
