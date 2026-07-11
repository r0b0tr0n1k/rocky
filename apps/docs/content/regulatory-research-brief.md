# Regulatory Research Brief — WHAT to bring back

> _sniffs_ A working checklist for gathering primary-source evidence. For each item, find the official
> citation + the specific data point, then paste it back so it can be transcribed into the ADR-0054
> Evidence Register (`ASSERTED` → `VERIFIED`). The MK-instance rules can be mined from `docs/old/*.md`
> without external research (marked ✅ MK-source).

## Geo foundation (feeds ADR-0053 / WO-109, WO-110)

### G1 — INSPIRE Directive 2007/2/EC

- [ ] Official citation (OJ L 108/1, 25.4.2007) + current consolidation
- [ ] Which Annex I spatial-data themes AIMCS must expose (addresses? cadastral parcels? agricultural units?)
- [ ] Does INSPIRE mandate a specific geometry standard we must align to?

### G2 — NUTS Regulation (EC) 1059/2003 (+ 2021 amendment)

- [ ] Confirm level definitions: NUTS 1 / 2 / 3 + LAU (was NUTS 4/5)
- [ ] Is `level` + `parent_id` self-reference sufficient, or does NUTS require fixed code formats?
- [ ] LAU code formatting rules (for our `nuts_code` column)

### G3 — LPIS / CAP (Reg (EU) 1307/2013, 640/2014)

- [ ] What exactly is a cadastral parcel reference (field name / format in LPIS)?
- [ ] Is the pasture polygon required to match the LPIS parcel, or just be _linked_?
- [ ] CAP subsidy linkage expectations for our `cadastral_reference`

### G4 — EPSG:4326 / SRID

- [ ] Confirm WGS 84 (EPSG:4326) as storage SRID; metric queries cast to geography/3857
- [ ] Any jurisdiction that mandates a local projected SRID instead?

### G5 — OSM / Nominatim ToS

- [ ] Confirm OSM is acceptable for base-map + routing + reverse-geocode (usage policy)
- [ ] Nominatim usage limits / attribution requirements

## Regulatory compliance (feeds ADR-0054 / WO-113 … WO-119)

### R1 — EUDR 2023/1115 (Deforestation-free products)

Why: WO-115 due-diligence overlay; RuleSet `eudr.*`

- [ ] Exact citation (OJ L 150/206, 31.5.2023) + applicability date
- [ ] Confirm cattle / live bovine in scope (CN commodity code)
- [ ] Confirm deforestation cutoff (asserted 2020-12-31) + legal article
- [ ] What a Due-Diligence Statement must contain; per-consignment or per-product?
- [ ] SME / de-minimis exemptions affecting our model

### R2 — USDA APHIS ADT (9 CFR 86)

Why: WO-118 tag format; RuleSet `tag.*`

- [ ] Confirm 15-digit ISO 11784/11785 RFID requirement for interstate movement
- [ ] Confirm `840` = US country code prefix
- [ ] Any tag-format variance per species / movement type

### R3 — FDA FSMA §204 (21 CFR 1.1100+)

Why: WO-116 KDE/CTE export + Lineage Graph; RuleSet `fsma.*` / `traceability.*`

- [ ] List of Key Data Elements (KDEs) at each Critical Tracking Event (CTE)
- [ ] Confirm ≤24 h electronic traceability list response requirement
- [ ] Which CTEs map to our `movements` table

### R4 — EU 2019/6 (Veterinary Medicinal Products / AMR)

Why: WO-113 withdrawal guillotine; RuleSet `amr.withdrawalPeriodDays`

- [ ] Confirm withdrawal period bars meat/milk from food chain until elapsed
- [ ] Is the period per-product, per-species, or per-active-substance? (our `treatments.withdrawalPeriod` is single-valued — confirm)
- [ ] Link to MRL Reg (EC) 37/2010 if relevant

### R5 — EC 1/2005 (Animal Transport Welfare) + OIE Terrestrial Code

Why: WO-114 welfare alert; RuleSet `welfare.*`

- [ ] Confirm max transport time 8 h (14 h w/ upgraded vehicle)
- [ ] Confirm mandatory rest (≥1 h, water/food) rule + how "rest stop" is evidenced
- [ ] OIE Terrestrial Code Ch. 7.3 journey-time equivalents

### R6 — EC 178/2002 (General Food Law)

Why: WO-116 Lineage & Traceability Graph; RuleSet `traceability.*`

- [ ] Confirm "one step back / one step forward" traceability duty (Art. 18)
- [ ] Rapid-alert / notification timeframe (asserted 1 business day)
- [ ] What the traceability record must link (slaughter → truck → farm → dam)

### R7 — GDPR (Reg (EU) 2016/679)

Why: WO-117 pseudonymization; RuleSet `gdpr.*`

- [ ] Confirm farm operator PII scope (name, phone, geolocation of driver)
- [ ] Confirm pseudonymization (Art. 4.5) is permitted while retaining health history
- [ ] Conflict resolution: erasure right (Art. 17) vs epidemiological retention (3–7 y)

## MK-instance rules ✅ (mine from `docs/old/*.md` — no external research needed)

- [ ] Calving gap / mother age (fs2.md) → RuleSet `calvingPeriodDays`
- [ ] Min vaccination age (deseases.md) → RuleSet `minVaccinationAgeDays`
- [ ] Ear-tag format / check-digit (fs.md, an_ea.md) → RuleSet `tag.*` / check-digit provider
- [ ] Slaughter min age / stillborn window (workflow.md, fs2.md) → RuleSet thresholds
