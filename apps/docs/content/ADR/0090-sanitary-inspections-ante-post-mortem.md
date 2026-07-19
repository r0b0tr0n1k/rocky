# ADR-0090: Sanitary Inspections (Ante/Post-Mortem) — OCR 2017/625 / 853/2004 / 1069/2009

> An animal arriving at a slaughterhouse is not food until the State says so. This ADR adds the
> sanitary chokepoint — ante- and post-mortem inspections — as a new entity in the inspection
> domain, linked to the slaughter-arrival movement. It maps to the official-controls legislation
> (OCR 2017/625 + hygiene Reg 853/2004 + ABP Reg 1069/2009), **not** the Animal Health Law.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Author** | Architecture Review (user directive: expand Veterinary & Sanitary modules) |
| **Supersedes** | None |
| **Superseded** | None |

## Context

`MovementService.recordSlaughter()` records an animal as slaughtered, but performs **no sanitary
gate**. Under **Reg (EU) 2017/625 (OCR)**, an official inspector must clear the animal before and
after death; **Reg (EC) 853/2004** governs the hygiene pass/condemn decisions; **Reg (EC) 1069/2009
(ABP)** mandates that an animal condemned ante-mortem is killed and disposed of as **Category 1
Animal By-Product** (incineration), and meat found unfit post-mortem is condemned with a retroactive
alert to the farm of origin. Rocky has no entity for this; the inspection domain exists
(ADR-0028/0046/0080) but has no slaughter sanitary subtype.

## Decision

1. **New `sanitary_inspections` entity** in the inspection domain, linked to a `movementId` (the
   arrival at a `FARM_TYPE.SLAUGHTERHOUSE`). Core fields:
   - `anteMortemDecision` — `passed | condemned`
   - `postMortemDecision` — `passed | condemned | partial_condemnation`
   - `inspectorSubjectId` — the inspecting `SUBJECT_ROLE.SANITARY_INSPECTOR`
   - `anteMortemAt` / `postMortemAt` timestamps; `condemnationReason`.
2. **Decision consequences:**
   - Ante-mortem `condemned` → animal killed and routed to **Category 1 ABP** incineration
     (disposition `ABP_CAT1`); no meat enters the food chain.
   - Post-mortem `condemned` / `partial_condemnation` → automatic **retroactive alert** to the
     farm of origin via `InspectionRepository.flagFarmForInspection()` + a notification, and the
     relevant `lab_tests` / movement history is linked for traceback.
3. **Trigger point:** the sanitary inspection is created when a movement arrives at a slaughterhouse
   (the `recordSlaughter` path), gating the animal's transition to "food". The inspection is
   performed on the web/PDA by the SANITARY_INSPECTOR role; RLS scopes it to the slaughterhouse site.

## Consequences

- The sanitary chokepoint closes the cycle: an animal cannot become food without the State's
  explicit pass.
- Legally grounded in OCR 2017/625 + 853/2004 + 1069/2009 (ABP), not the AHL — correct attribution.
- Reuses the inspection domain, `flagFarmForInspection`, and the notification path — no new
  cross-domain machinery.
- Cost: one new table + a trigger wired into the `recordSlaughter` arrival flow.

## Sources

- **Reg (EU) 2017/625 (OCR)** — official controls, ante-/post-mortem inspection duties.
- **Reg (EC) 853/2004** — hygiene rules for food of animal origin (pass/condemn).
- **Reg (EC) 1069/2009 (ABP)** — Category 1 Animal By-Product condemnation/disposal.
- Existing: `packages/domains/movement/src/services/movement.service.ts` (`recordSlaughter`);
  `packages/domains/inspection` (`flagFarmForInspection`); ADR-0088 (Component 1).
