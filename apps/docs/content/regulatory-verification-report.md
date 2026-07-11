# Architectural and Legal-Technical Verification Report: Digital International Law and Regulatory Compliance for RobotFarm

> _sniffs_ This report verifies ADR-0054 (Regulatory Compliance Framework). It translates sovereign
> legislative structures into direct validation logic and domain-level constraints, eliminating hardcoded
> constants. The biological asset is simultaneously a securitized agricultural commodity, an
> epidemiological disease vector, an ecological footprint, and a direct data-privacy liability.
> Status of each claim: see ADR-0054 Evidence Register (promoted CITED -> VERIFIED by this report).

## Comparative Jurisdictional Analysis of Spatial and Territorial Standards

The spatial foundation maps geofences, cadastral parcels, and regional boundaries to physical geography.
Reconciling sovereign spatial databases requires strict mapping of coordinate systems, regional
nomenclature, and geocoding restrictions.

### Coordinate Reference Systems and Axis Order Standardization

INSPIRE (Directive 2007/2/EC) establishes core standards for spatial data exchange. Geographic coordinate
data uses ETRS89 (EPSG:4258) for 2D spatial data; global positioning uses WGS84 (EPSG:4326).

**Axis-order trap:** EPSG formally defines EPSG:4326 as **latitude first, then longitude**. But GeoJSON
specifications, mapping libraries, and PostGIS spatial-index implementations require **longitude first,
then latitude**. The ingestion layer MUST normalize axis order: validate the input array and map it to the
standardized geospatial format. Persist in EPSG:4326; transform to a metric projection (EPSG:3857) for
proximity queries (e.g. distance-based disease containment).

### Territorial Tiers and Regional Aggregation (NUTS)

NUTS (Reg (EC) 1059/2003) divides economic territories into population tiers:

| Territorial Level | Database Mapping Entity |
| --- | --- |
| NUTS 1 | Macro-region / State Zone |
| NUTS 2 | Province / Regional Authority |
| NUTS 3 | District / Municipality Cluster |
| LAU | Local Administrative Unit (< NUTS 3) |

NUTS 3 classifications drive disease-reporting; an outbreak flags affected herds and triggers automated
transport bans across matching administrative boundaries.

### Public Geocoding Rate Limits and Fail-safes (OSM / Nominatim)

Nominatim acceptable use policy requires:

- Hard limit **1 request per second**.
- Custom, unique `User-Agent` with system contact details.
- Mandatory local caching (in-memory or DB-backed).
- Fallbacks to commercial providers (Geofabrik, OpenCage, Stadia Maps) when limits exceeded.

## Technical Design of Regulatory Compliance Guillotines

A guillotine is a non-bypassable programmatic validation block at the domain layer.

[Flow: Livestock Transaction -> Ingestion & Coordinate Validation -> (EUDR | AMR | Welfare) -> Domain
RuleSet Evaluator -> Commit (Valid) / Abort (Invalid)]

### R1 — EUDR 2023/1115 (Spatial Engine)

Live bovine (HS CN 0102) traced to precise land parcels. Parcels **> 4 ha = closed polygon**; **<= 4 ha =
point with >= 6 decimal precision**. Invalid boundary blocks pasture registration. Intersect parcel vs
satellite forest-loss layers (Copernicus) after cutoff **2020-12-31**; if deforestation area > 0, pasture
non-compliant; assets grazing there restricted from export. Penalties up to **4% of consolidated annual EU
turnover**. No volume/value threshold.

### R2 — USDA APHIS ADT (9 CFR Part 86) RFID

Covered cattle (intact beef >= 18 months, all female dairy, male dairy born after 2013-03-11) need EID ear
tags conforming to **ISO 11784/11785** (134.2 kHz, HDX/FDX-B). **15-digit** code, country prefix **840 =
USA**. Grandfathered NUES metal tags applied before **2024-11-05** accepted for life of animal. After
that date, visual-only or missing prefix -> flag, block ICVI + interstate movement.

### R3 — FDA FSMA 204 (21 CFR Part 1 Subpart S)

KDEs at CTEs; records retained **>= 2 years**. Export interface delivers sortable spreadsheet within
**24 h** of request (S 1.1455(b)(2)). Exemptions: total exemption if 3-yr avg sales <= $25,000 or < 3,000
laying hens; spreadsheet exemption if avg sales <= $250,000.

### R4 — Vet Meds / AMR (EU 2019/6, Art. 108)

Keepers record all treatments; retain **>= 5 years**. Withdrawal period product AND species specific.
Cascade multipliers for off-label/unauthorized: meat/offal x2 (min 28 d); milk x4 (min 7 d); aquatic x3
degree-days (min 500). Movement to SLAUGHTERHOUSE before clearance -> block, 403 WITHDRAWAL_PERIOD_ACTIVE.

### R5 — Transport Welfare (EC 1/2005, Chapter V)

Species-specific maxima:

- Unweaned calves/lambs/kids/piglets: **9 h + >=1 h rest + 9 h**.
- Pigs: **24 h** with continuous water.
- Horses: **24 h**, water/feed >= every 8 h.
- Standard adult cattle: **14 h + >=1 h rest + 14 h**.
After maxima: unload/feed/water/rest >= 24 h at approved control post. Missing rest-stop leg -> flag
non-compliant + alert inspector.

### R6 — General Food Law (EC 178/2002, Art. 18)

"One step back, one step forward" traceability via recursive spatial-temporal graph of movements +
parenting. From a slaughter record id: compile source holdings (back), destination facilities (forward),
and coordinate/containment histories.

### R7 / R10 — GDPR vs Public Health

Art. 17 erasure limited by Art. 17(3)(b) (legal obligation, e.g. 5-yr vet record mandate) and Art. 17(3)(c)
(public-health interest, e.g. AHL transmissible-disease tracking). Pseudonymize: scrub names/phone/email;
KEEP subject_id + movement logs to preserve epidemiological graph.

## Technical Corrigenda and Software Impact

### R8 — Tagging/Notification as Hardcoded Minimums

Initial design treated 7/20 as flexible RuleSet params. Primary sources prove they are **hardcoded EU
mandates**: Delegated Reg (EU) 2019/2035 Art. 42 (tag <= 20 days of birth) + Implementing Reg (EU) 2021/520
Art. 14 (notify births/deaths/movements <= 7 days). Absolute maximums; a RuleSet may be stricter (14-day
tag, 3-day notify) but NEVER looser. Reject any config extending tagging > 20 d or notification > 7 d.

Illustrative sovereign validator (our stack is TypeScript/NestJS — see ADR-0054 note; this Elixir is
conceptual only):

```elixir
defmodule RobotFarm.Domain.SovereignRuleValidator do
  @absolute_max_tagging_days 20
  @absolute_max_notification_days 7
  def validate_sovereign_limits!(ruleset) do
    cond do
      ruleset.eu_aligned && ruleset.tagging_days_limit > @absolute_max_tagging_days ->
        {:error, "Sovereign validation failure: Tagging window cannot exceed 20 days."}
      ruleset.eu_aligned && ruleset.notification_days_limit > @absolute_max_notification_days ->
        {:error, "Sovereign validation failure: Notification SLA cannot exceed 7 days."}
      true -> {:ok, :valid}
    end
  end
end
```

### R9 — IMSOC / TRACES NT (Implementing Reg (EU) 2019/1715)

Outbound transport records generate CHED-compliant JSON/XML (verified animal ids, origin holding, vet
treatment logs, transit checks) so receiving authorities verify import compliance pre-arrival.

## Programmatic Workorder Strikes (detailed specs in this report)

- WO-113 AMR withdrawal guillotine (MovementService / SlaughterEligibilityValidator)
- WO-114 transport welfare audit (MovementService / TransitAuditLogger)
- WO-115 EUDR pasture compliance (GeospatialService / DueDiligenceValidator)
- WO-116 FSMA 204 KDE export (LineageService / TraceabilityReportingEngine)
- WO-117 GDPR pseudonymization (IdentityService / AnonymizationEngine)
- WO-118 ISO EID tag validator (AssetRegistrationService / EartagValidator)
- WO-119 disease-zone containment (MovementService / GeospatialService; protectionZoneKm=3, surveillanceZoneKm=10)

## Works cited

Primary sources (URLs) supplied by author — see ADR-0054 Evidence Register rows promoted to VERIFIED.
Key: EUR-Lex 2007/2/EC, 1059/2003, 2021/520, 2019/2035, 2019/1715, 2023/1115, 2019/6, 1/2005, 178/2002,
2016/679; eCFR 9 CFR 86, 21 CFR 1 Subpart S; FDA FSMA traceability rule; USDA APHIS ADT; OSM Nominatim
usage policy.
