# ADR-0089: Disease Master Data — AHL Annex II Categories + WOAH WAHIS Codes

> The current `diseases` table models a disease as a single `notifiable` boolean with no
> international code. The EU Animal Health Law tiers diseases by response (eradication vs control vs
> surveillance), and WOAH WAHIS is the canonical international source of disease identity. This ADR
> replaces the boolean with a category enum + WOAH code, seeded — never invented — from those lists.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Author** | Architecture Review (user directive: expand Veterinary & Sanitary modules) |
| **Supersedes** | None |
| **Superseded** | None |

## Context

`packages/database/src/schema/hd/diseases.ts` today models a disease as:

```ts
name: varchar(100) unique
notifiable: boolean default false
quarantineDays: integer
```

A single `notifiable` boolean cannot express the EU's tiered disease-response model, and carries no
international code. The AHL (Reg (EU) 2016/429) lists diseases in **Annex II**; the response tiering
(eradication vs control vs surveillance) is defined per disease and reported under **Delegated Reg
(EU) 2018/1629** animal disease categories; the **WOAH WAHIS** list is the canonical international
source of disease identities and codes. Rocky needs a disease row that (a) carries its EU category,
(b) carries its WOAH code, and (c) drives the right downstream behaviour (inspection flag, zone
lockdown) without bespoke per-disease code.

## Decision

1. **Replace `notifiable: boolean` with `diseaseCategory`** — a pgEnum `disease_category` whose
   values are sourced from Delegated Reg (EU) 2018/1629 / the WOAH response model:
   - `CATEGORY_A` — eradication / stamping-out (e.g., Foot & Mouth, Anthrax, Rabies-class
     emergencies). Triggers immediate culling + 3 km / 10 km restriction zones.
   - `CATEGORY_B` — mandatory control programmes (e.g., Bovine brucellosis, Bovine tuberculosis,
     Rabies). Triggers testing + movement bans.
   - `CATEGORY_C` / `CATEGORY_D` / `CATEGORY_E` — voluntary eradication, movement rules,
     surveillance.
   - Keep a **derived `notifiable` view** (Category A/B → notifiable) so the existing
     `flagFarmForInspection` path is preserved unchanged.
2. **Add identity / reference columns** to `diseases`:
   - `woahCode` — WOAH WAHIS disease code (`varchar`, unique) — the international key.
   - `euAnnexRef` — Annex II part / reference (`varchar`).
   - `controlMeasures` — `stamping_out | control_programme | surveillance` (enum), driving the
     default response.
3. **Seed, never invent.** `diseases` is populated from the **WOAH WAHIS** master list,
   cross-referenced with **AHL Annex II**. Confirmed Annex II entries already in the regulation:
   Foot and Mouth, Bovine tuberculosis, Bovine brucellosis (*B. abortus*), Ovine/caprine brucellosis
   (*B. melitensis*), Anthrax, Rabies. The seed is a versioned, idempotent import script — not
   hand-typed rows.
4. **Cross-domain wiring (data-driven, no new code):** `CATEGORY_A`/`CATEGORY_B` diseases continue
   to call `InspectionRepository.flagFarmForInspection()`; `CATEGORY_A` is the trigger for the
   Zone-of-Alienation automation (ADR-0092).

## Consequences

- Epidemiology becomes tier-accurate: zone triggers, reporting, and inspection flags key off
  `diseaseCategory`, not a coarse boolean.
- International interoperability: `woahCode` lets Rocky exchange disease data with WOAH / EMA
  ecosystems.
- Backward compatible: the derived `notifiable` view means Health / Inspection services keep working
  without rewrites.
- Cost: a one-time WOAH WAHIS → `diseases` import script + a migration adding the enum / columns.
  Seed data is owned by the importing script, not committed by hand.

## Sources

- `docs/reference/AHL_EU_CELEX_02016R0429-20191214_EN_TXT.pdf` — Annex II disease list (Foot and
  Mouth, Bovine TB, Brucellosis, Anthrax, Rabies confirmed present); zone definitions Art 2(42)/(43).
- **Delegated Reg (EU) 2018/1629** — animal disease categories for reporting.
- **WOAH WAHIS** — master disease list + codes (`https://wahis.woah.org/`).
- Existing: `packages/database/src/schema/hd/diseases.ts`, `packages/domains/health/AGENTS.md`
  (notifiable trigger), `packages/domains/inspection` (`flagFarmForInspection`).
