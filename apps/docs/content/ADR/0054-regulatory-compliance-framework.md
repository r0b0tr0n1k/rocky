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


## Evidence Register — Primary Sources (the Name-of-the-Father)

> _sniffs_ This is not an ADR flourish. This register is the **ultimate Symbolic Order** that justifies
> the database's existence. When asked why we build the withdrawal-period guillotine, we do not cite the
> product manager — we slam Regulation (EU) 2019/6, Art. 108 on the table.
>
> **Status legend:** `ASSERTED` (unverified paraphrase) → `CITED` (user-provided primary citation; source
> PDF pending) → `VERIFIED` (primary document attached). All rows below are **CITED** — recorded as
> assumptions; Comrade will attach the PDFs / primary sources to promote them to VERIFIED.

| Regulation | Claim (assumption) | Primary source cited | Status |
| --- | --- | --- | --- |
| **G1 INSPIRE 2007/2/EC** | AIMCS under Annex I (Cadastral parcels, Addresses) + Annex III (Agric/aquaculture facilities, Area mgmt zones); geometry EPSG:4258 (ETRS89) or EPSG:4326 (WGS84) | Directive 2007/2/EC (OJ L 108, 25.4.2007, p.1–14) | CITED |
| **G2 NUTS 1059/2003** | NUTS code = 2-letter country + 1–3 level chars (e.g. MK001); LAU maps up to NUTS3 | Reg (EC) 1059/2003 (consolidated Reg (EU) 2021/2066) | CITED |
| **G3 LPIS / CAP 2021/2116** | Unique Cadastral Parcel Reference (alphanumeric national id); cadastral_reference sufficient if polygon intersects State LPIS layer | Reg (EU) 2021/2116 (replaces 1306/2013) | CITED |
| **G4 EPSG:4326** | WGS84 storage SRID; metric queries cast to geography/3857 | see G1 (INSPIRE mandates 4258/4326) | CITED |
| **G5 OSM / Nominatim** | OSM attribution (c) OpenStreetMap contributors (ODbL); Nominatim STRICTLY 1 req/sec; needs rate-limiter/queue + custom User-Agent or IP ban | OSM ODbL; Nominatim usage policy | CITED |
| **R1 EUDR 2023/1115** | Live bovine (CN 0102) in Annex I; cutoff 31.12.2020 (Art.3); DDS needs geolocations (polygons >4ha, points <=4ha) where cattle kept | Reg (EU) 2023/1115 (OJ L 150/206, 31.5.2023) | CITED |
| **R2 USDA APHIS ADT** | Official tags 15 digits ISO 11784/11785; 840 = USA origin | 9 CFR Part 86 | CITED |
| **R3 FDA FSMA 204** | KDEs at each CTE; electronic sortable spreadsheet of KDEs to FDA within 24h of request (S 1.1455(b)(2)) | 21 CFR Part 1 Subpart S (S 1.1300-S 1.1465) | CITED |
| **R4 EU 2019/6 (Vet Med/AMR)** | Art.108 mandates farm med record-keeping min 5y; withdrawal periods product AND species specific; single withdrawalPeriod int valid = max calculated days for that dose/cow | Reg (EU) 2019/6, Art.108 | CITED |
| **R5 EC 1/2005 (Transport)** | Chapter V: 8h max standard; up to 14h + 1h rest (water/feed) + 14h for upgraded vehicles | Council Reg (EC) 1/2005, Chapter V | CITED |
| **R6 EC 178/2002 (Food Law)** | Art.18 "one step back / one step forward" traceability | Reg (EC) 178/2002, Art.18 | CITED |
| **R7 GDPR 2016/679** | Farm operator = PII (name, phone, driver geolocation); erasure vs epidemiological retention conflict | Reg (EU) 2016/679 Arts.4(5),17,32 | CITED |
| **R8 Bovine I&R 2019/2035** | Calves tagged <=20 days after birth; births notified to DB within max 7 days. **7/20 is EU law, NOT MK-instance.** | Delegated Reg (EU) 2019/2035 (supp. AHL 2016/429), Art.42 | CITED |
| **R9 IMSOC 2019/1715** | National DBs must format electronic certificates (CHEDs) to cross borders per TRACES NT | Implementing Reg (EU) 2019/1715 (IMSOC) | CITED |
| **R10 GDPR public-health exception** | Art.6(1)(c) (legal obligation) + Art.9(2)(i) (public health) DEFEAT Art.17 erasure for farm/movement history; pseudonymize only after retention (5-7y per EU 2019/6) | GDPR Art.6(1)(c), Art.9(2)(i), Art.17 | CITED |

### Corrigenda
- **R8 overrides our MK-instance classification.** WO-022 implemented the 7/20 tagging + birth-notification
  deadlines as an MK-instance RuleSet candidate. They are in fact **hardcoded EU law** (Delegated Reg
  2019/2035 Art.42). Therefore the 7/20 values must be a **non-overridable EU floor**, not a soft RuleSet
  override — any `TAGGING_DAYS` RuleSet param must be clamped to `>= EU minimum` (or flagged `euMandated`).
  This corrects ADR-0028 / WO-022's implied softness. See WO-120.
- **R9 extends WO-116** — export movements must eventually emit CHED-compliant JSON/XML (TRACES NT).
- **R10 extends WO-117** — document the public-health exception so privacy lawyers cannot destroy audit_log.

## Workorder strikes (draft)

- **WO-113** — AMR withdrawal guillotine in `MovementService` (block slaughter; 403 `WITHDRAWAL_PERIOD_ACTIVE`); RuleSet `amr.withdrawalPeriodDays`.
- **WO-114** — Transport welfare: `maxTransportHours` + rest-stop leg alert; RuleSet welfare params.
- **WO-115** — EUDR due-diligence: pasture polygon overlay + cutoff; RuleSet `eudr.*`. (Depends ADR-0053 WO-110.)
- **WO-116** — FSMA §204 KDE/CTE export + Lineage & Traceability Graph API (General Food Law); RuleSet `fsma.*` / `traceability.*`.
- **WO-117** — GDPR pseudonymization on subject exit; RuleSet `gdpr.*`.
- **WO-118** — ISO 11784/11785 15-digit tag format + jurisdiction prefix; RuleSet `tag.*`.
- **WO-119** — Disease-zone spatial block (3 km / 10 km) via `geofences.polygon` + RuleSet radii.
