# ADR-0054: Regulatory Compliance Framework: Digital International Law

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status**     | Proposed                       |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Regulatory strike, prompted by user directive)    |
| **Source**     | EUDR 2023/1115; USDA APHIS ADT; FDA FSMA §204; EU 2019/6 (Vet Med/AMR); EC 1/2005 (Transport Welfare); EC 178/2002 (General Food Law); GDPR |
| **Supersedes** | None |
| **Superseded** | None |
| **Related**    | ADR-0030 (RuleSet — every threshold is a jurisdiction param, NOT a constant); ADR-0053 (geo foundation); ADR-0023 (traceability) |

> _sniffs_ When you track biological life, movement, and meat, you are not writing CRUD. You are writing
> **Digital International Law**. The cow is a regulated financial asset, a pandemic vector, an ecological
> footprint, and a privacy liability — all wrapped in leather. Every threshold below is a RuleSet param
> (ADR-0030), so the jurisdiction covers ALL of them. No hardcoded constants.

## Context

The schema already carries the _fields_ (withdrawal_period, arrivalDate/departureDate, geofences,
animal_parents, audit_log, subject PII). What is missing is the **guillotine** — the enforcement logic
in validators + domains — and the discipline of routing every threshold through the RuleSet so a
jurisdiction override does not require a code fork.

## Decision — Map every Big Other to a strike

| # | Regulation | Data need | Schema / domain touch | Guillotine (enforcement) | RuleSet param (ADR-0030) |
|---|---|---|---|---|---|
| 1 | **EUDR 2023/1115** | Prove pasture not deforested after 2020-12-31 | `geofences.polygon` (ADR-0053) + deforestation cutoff | Slaughter Due-Diligence Statement overlays every pasture a cow touched; blocks export if cutoff breached | `eudr.enabled`, `eudr.deforestationCutoffDate` |
| 2 | **USDA APHIS ADT** | 15-digit ISO 11784/11785 RFID (840=US) | `ear_tags.tagNumber` flexible length | Reject non-compliant tags on interstate movement for US RuleSet | `tag.format` (`ISO_11784_15`, `MK_8`), `tag.prefix` |
| 3 | **FDA FSMA §204** | KDEs at every CTE within 24h | `movements` = CTEs; export endpoint | Standardized CSV/JSON of KDEs on demand (≤24h) | `fsma.cteExportFormat`, `fsma.responseSlaHours` |
| 4 | **EU 2019/6 (AMR)** | Withdrawal period blocks slaughter | `treatments.withdrawalPeriod` (exists) | **MovementService** rejects `→ SLAUGHTERHOUSE` if `current_date < treatment_date + withdrawalPeriod`; 403 `WITHDRAWAL_PERIOD_ACTIVE` | `amr.withdrawalPeriodDays` (per drug/class) |
| 5 | **EC 1/2005 (Transport Welfare)** | ≤8h (14h w/ upgrade) + rest stop | `movements.departureDate/arrivalDate` + legs (`parentMovementId`) | If `arrival−departure > maxHours` and no rest-stop leg → welfare alert to inspector | `welfare.maxTransportHours` (8), `welfare.maxTransportHoursExtended` (14), `welfare.restStopRequiredAfterHours` |
| 6 | **EC 178/2002 (General Food Law)** | One step back / one step forward | `movements` + `animal_parents` | **Lineage & Traceability Graph** API: from `slaughterRecordId` walk `movements` + `animal_parents` recursively (spatial-temporal history) | `traceability.maxDepth`, `traceability.retentionYears` |
| 7 | **GDPR** | PII pseudonymization on exit | `subjects` PII (`firstName/lastName/phoneNumber`) | On farmer exit: scrub PII, KEEP `subject_id` so epidemiological math holds; health history retained 3–7y | `gdpr.retentionYears`, `gdpr.pseudonymizeOnExit` |

### Cross-cutting principle

**No regulatory constant is hardcoded.** AHL 3 km / 10 km disease zones, transport hours, withdrawal
periods, EUDR cutoff, tag formats — all live in the active RuleSet (ADR-0030 §D: seeded MK default,
overridable per jurisdiction). The disease-zone intersection (strike 1's spatial cousin) reads
`ruleset.thresholds.protectionZoneKm` (3) and `surveillanceZoneKm` (10) and calls `ST_DWithin` on
`geofences.polygon` (ADR-0053).

## Consequences

### Positive

- One deployment serves MK, EU, US — jurisdiction is config.
- Auditors get a defensible, param-driven compliance surface.
- The "guillotine" is explicit and testable per RuleSet.

### Negative

- Larger test matrix (behavior per RuleSet, not just MK).
- MovementService gains hard blocks (withdrawal, welfare) — callers must handle 403s (ties to WO-088/094 toasts).

### Neutral

- Schema fields largely exist; this ADR is mostly **logic + RuleSet params + API**, matching the user's "write the validation logic in validators and domains."


## Evidence Register — VERIFIED (primary sources attached)

> _sniffs_ Every row below is now **VERIFIED** — backed by `regulatory-verification-report.md` (author's
> dialectical labor) and the primary EUR-Lex / eCFR citations it carries. The Name-of-the-Father speaks.

| Regulation | Claim (verified) | Primary source | Status |
| --- | --- | --- | --- |
| **G1 INSPIRE 2007/2/EC** | AIMCS under Annex I (Cadastral parcels, Addresses) + Annex III (Agric/aquaculture, Area mgmt zones); EPSG:4258 (ETRS89) / EPSG:4326 (WGS84). **Axis-order trap: EPSG:4326 is lat-first, but GeoJSON/PostGIS need lon-first — ingestion must normalize (see ADR-0053).** | Directive 2007/2/EC (OJ L 108); report §CRS | VERIFIED |
| **G2 NUTS 1059/2003** | NUTS code = 2-letter country + 1–3 level chars (MK001); LAU < NUTS3 | Reg (EC) 1059/2003 (consolidated 2021/2066); report §NUTS | VERIFIED |
| **G3 LPIS / CAP 2021/2116** | Unique Cadastral Parcel Reference; cadastral_reference sufficient if polygon intersects State LPIS layer | Reg (EU) 2021/2116; report §LPIS | VERIFIED |
| **G4 EPSG:4326** | WGS84 storage SRID; metric queries cast to EPSG:3857 | see G1; report §CRS | VERIFIED |
| **G5 OSM / Nominatim** | 1 req/s hard limit; custom User-Agent; mandatory cache; commercial fallback | OSM ODbL; Nominatim policy; report §Geocoding | VERIFIED |
| **R1 EUDR 2023/1115** | CN 0102 in scope; cutoff 2020-12-31; >4 ha = polygon, <=4 ha = point with >=6 decimals; penalty up to 4% EU turnover | Reg (EU) 2023/1115 (OJ L 150/206); report §R1 | VERIFIED |
| **R2 USDA APHIS ADT** | 15-digit ISO 11784/11785, 134.2 kHz HDX/FDX-B, 840 = USA; NUES metal tags grandfathered before 2024-11-05 | 9 CFR Part 86; report §R2 | VERIFIED |
| **R3 FDA FSMA 204** | KDEs at CTEs; retain >= 2 years; sortable spreadsheet within 24 h (S 1.1455(b)(2)); exemptions (<$25k or <3000 hens total; <$250k spreadsheet) | 21 CFR Part 1 Subpart S; report §R3 | VERIFIED |
| **R4 EU 2019/6 (AMR)** | Art.108: keep treatment records >= 5 years; withdrawal product AND species specific; cascade x2 meat (min 28 d) / x4 milk (min 7 d) / x3 aquatic degree-days (min 500) | Reg (EU) 2019/6 Art.108; report §R4 | VERIFIED |
| **R5 EC 1/2005 (Transport)** | **Species-specific (CORRECTS earlier 8 h error):** unweaned 9 h+1 h+9 h; pigs 24 h (water); horses 24 h; **standard adult cattle 14 h+1 h+14 h**; then >=24 h rest at control post | Council Reg (EC) 1/2005 Ch.V; report §R5 | VERIFIED |
| **R6 EC 178/2002 (Food Law)** | Art.18 "one step back / one step forward" traceability | Reg (EC) 178/2002 Art.18; report §R6 | VERIFIED |
| **R7 GDPR 2016/679** | Farm operator = PII; erasure vs epidemiological retention conflict | Reg (EU) 2016/679 Arts.4(5),17,32; report §R7 | VERIFIED |
| **R8 Bovine I&R 2019/2035/2021/520** | Tag <= 20 d of birth (Delegated 2019/2035 Art.42); notify births/deaths/moves <= 7 d (Implementing 2021/520 Art.14). **HARDCODED EU minimums, non-overridable.** | Delegated Reg (EU) 2019/2035 Art.42 + Implementing Reg (EU) 2021/520 Art.14; report §R8 | VERIFIED |
| **R9 IMSOC 2019/1715** | Outbound movements emit CHED-compliant JSON/XML (TRACES NT) | Implementing Reg (EU) 2019/1715; report §R9 | VERIFIED |
| **R10 GDPR public-health exception** | Art.17(3)(b) (legal obligation) + Art.17(3)(c) (public health) DEFEAT Art.17 erasure; pseudonymize only after retention | GDPR Art.17(3)(b)/(c) (+6(1)(c)/9(2)(i)); report §R7/R10 | VERIFIED |

### Corrigenda (post-verification)
- **R5 corrected:** earlier draft asserted "8 h max standard." Verified species-specific: adult cattle 14 h+14 h, unweaned 9 h+9 h. WO-114 must branch on species/life-stage, not a single constant.
- **R4 enriched:** cascade multipliers are RuleSet params (`amr.cascadeMeat=2`, `amr.minWithdrawalMeatDays=28`, `amr.cascadeMilk=4`, `amr.minWithdrawalMilkDays=7`, `amr.cascadeAquatic=3`, `amr.minWithdrawalAquaticDegreeDays=500`).
- **R8 hardened:** 7/20 is a hardcoded EU floor (Art.42 + Art.14). WO-120 rejects any RuleSet with `taggingDays > 20` or `notificationDays > 7` when `euAligned`.
- **R3 enriched:** retention >= 2 y + revenue/volume exemptions (WO-116).
- **Elixir note:** the report's `SovereignRuleValidator` is **illustrative only** — our stack is TypeScript/NestJS. The equivalent lives as a guard in the RuleSet loader (`validateSovereignLimits`), not Elixir.
- **Axis order:** see ADR-0053 — ingestion must normalize EPSG:4326 lat-first -> GeoJSON/PostGIS lon-first.

- **WO-113 implemented:** `MovementService.create` throws `WITHDRAWAL_PERIOD_ACTIVE` (HTTP 403 FORBIDDEN via `MOVEMENT_TRPC_ERROR_MAP`) when a SLAUGHTERHOUSE/HOME_SLAUGHTER movement targets an animal with an active treatment (`treatments.diagnosis_date + withdrawal_period > now`). Also fixed a WO-022 gap: `FARM_LOCKED` now maps to 403. RuleSet default `amr.withdrawalPeriodDays` deferred to a follow-up (the treatment record is the authoritative per-product/species value per R4).

- **WO-120 implemented:** `RuleSet` now carries `euAligned` + `thresholds.taggingDays/notificationDays` (defaulting to the EU floor via `EU_BIRTH_DEADLINES` const: tag <= 20d, notify <= 7d — Delegated 2019/2035 Art.42 + Implementing 2021/520 Art.14). `validateSovereignLimits(ruleSet)` (the Elixir SovereignRuleValidator translated to TS) throws at `buildRuleSet` time if `euAligned && (taggingDays > 20 || notificationDays > 7)` — a jurisdiction may be stricter but NEVER looser. The violation surfaces as a `Result` error via `getRuleSet` (wrapped in `fromAsyncThrowable`). **Known gap flagged:** no application code creates `birth_notifications` rows (WO-022 enforcement reads an empty table) — the floor is enforced at config level; the creation path (which must compute `taggingDeadline = birthDate + min(ruleSet.taggingDays, 20)`) is a separate fix (WO-022b).

- **WO-114 implemented (WO-114a):** `MovementService.create` enforces EC 1/2005 Ch.V transport-welfare maxima. Day-granular (schema has `date`-only `movementDate`/`arrivalDate`): unweaned calves (age < `welfare.unweanedMaxAgeDays`, default 120d) blocked from any overnight journey (`journeyDays >= welfare.maxSingleLegDays`=1); adult cattle blocked from multi-day journeys (`journeyDays >= welfare.multiDayMaxDays`=2). Maxima are jurisdiction-pluggable `RuleSet.welfare` params (non-throwing defaults in `WELFARE_DEFAULTS`, read from `system_parameters`). Movement types reference the canonical `MOVEMENT_TYPE` enum (no inline strings). **WO-114b deferred:** hour-precise R5 (14h/9h) needs `departureTs`/`arrivalTs` timestamps, and the rest-stop-leg rule (`parentMovementId`) needs that field on `CreateMovementRequest`.

## Workorder strikes (draft)

- **WO-113** — AMR withdrawal guillotine in `MovementService` (block slaughter; 403 `WITHDRAWAL_PERIOD_ACTIVE`); RuleSet `amr.withdrawalPeriodDays`.
- **WO-114** — Transport welfare: `maxTransportHours` + rest-stop leg alert; RuleSet welfare params.
- **WO-115** — EUDR due-diligence: pasture polygon overlay + cutoff; RuleSet `eudr.*`. (Depends ADR-0053 WO-110.)
- **WO-116** — FSMA §204 KDE/CTE export + Lineage & Traceability Graph API (General Food Law); RuleSet `fsma.*` / `traceability.*`.
- **WO-117** — GDPR pseudonymization on subject exit; RuleSet `gdpr.*`.
- **WO-118** — ISO 11784/11785 15-digit tag format + jurisdiction prefix; RuleSet `tag.*`.
- **WO-119** — Disease-zone spatial block (3 km / 10 km) via `geofences.polygon` + RuleSet radii.
