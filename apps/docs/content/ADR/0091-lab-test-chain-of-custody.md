# ADR-0091: Lab Test Chain-of-Custody Status + PDA/Lab Workflow

> A veterinary test does not simply "appear" — a sample is taken, shipped, received, and reported.
> This ADR adds the chain-of-custody status to `lab_tests` and emits a `LabTestCompletedEvent` that
> drives the Zone-of-Alienation automation (ADR-0092) and the epidemiologist dashboard (ADR-0093).

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-13 |
| **Author** | Architecture Review (user directive: expand Veterinary & Sanitary modules) |
| **Supersedes** | None |
| **Superseded** | None |

## Context

`packages/database/src/schema/hd/lab-tests.ts` records a test with only `sampleDate` and
`resultDate` — there is **no chain-of-custody status**. In real veterinary bureaucracy the workflow
is: suspected disease → sample taken (blood/tissue) → sent to lab → received → result published.
The field vet logs the sample on their PDA; the State lab logs the result on their portal. Without a
status the system cannot tell "sample in transit" from "result pending", and nothing fires when a
result lands.

## Decision

1. **Add `sampleStatus` enum to `lab_tests`:** `SAMPLE_COLLECTED → IN_TRANSIT → PROCESSING →
   COMPLETED`.
   - `SAMPLE_COLLECTED` — field vet logs the sample on the PDA (with `labSampleId`, collection geo).
   - `IN_TRANSIT` — sample dispatched to the lab.
   - `PROCESSING` — State lab receives and begins analysis.
   - `COMPLETED` — result published (`result` + `resultDate` already exist).
2. **Outbox event:** on transition to `COMPLETED`, emit **`LabTestCompletedEvent`** (via the existing
   Outbox pattern) carrying `diseaseId`, `result`, `farmId`, `animalId`, `sampleStatus` history.
3. **Role split:** the field vet writes `SAMPLE_COLLECTED`/`IN_TRANSIT` from the PDA; the State lab
   writes `PROCESSING`/`COMPLETED` from the web portal. RLS already scopes `lab_tests` to
   adminAndVetWrite per farm.
4. **No schema break:** existing `result`/`resultDate`/`certificateRef` columns stay; `sampleStatus`
   is additive.

## Consequences

- A real custody workflow: every result is traceable from sample to publication.
- `LabTestCompletedEvent` becomes the single trigger for zone lockdown (ADR-0092) and surveillance
  heatmaps (ADR-0093) — event-driven, not polled.
- Backward compatible: additive column; existing writes default to `COMPLETED` during migration.
- Cost: one enum + one Outbox emitter; PDA/lab UI for the two role-specific transitions.

## Sources

- **Reg (EU) 2017/625 (OCR)** — official laboratory controls and result reporting.
- Existing: `packages/database/src/schema/hd/lab-tests.ts` (no status today);
  `outbox_events` table (`outbox_event_status` enum); ADR-0088 (Component 2).
