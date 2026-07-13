# ADR-0062: IMSOC / CHED-A Document Generation (WO-121)

> The CHED is not a report about a compliant movement. The CHED IS the compliance.
> It can only be born from a movement that already obeys the law — the document is the validator.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (regulatory strike, prompted by user directive) |
| **Source** | IMSOC Reg (EU) 2019/1715; TRACES NT; CHED-A (Common Health Entry Document — Animals); ADR-0054 R9; ADR-0061 (GDPR); ADR-0030 (RuleSet) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0054 (regulatory framework, strike 9 / R9); ADR-0061 (GDPR — CHED as lawful PII disclosure); ADR-0030 (RuleSet); PDF Bot `packages/pdf`; Movement domain; ADR-0009 (document-generation architecture — CHED as a PDF/document template); ADR-0082 (PAdES signing — IMSOC e-seal/timestamp); ADR-0084 (offline signed QR — IMSOC contingency); rocky-withdrawal-recall-procedure.md (iRASFF alert → recall); iso27701-2025-gap-analysis.md §13 |

## Context

ADR-0054 strike 9 (R9 IMSOC 2019/1715) mandates that outbound movements emit a CHED-compliant
document for TRACES NT. WO-116 dropped a `packages/pdf/src/templates/ched.template.ts` stub, but it
is incomplete and partly WRONG:

- It emits `CHED-P` / `CVED-P` — that is the **plant** CHED. Live cattle need **CHED-A** (Animals).
- It has **no precondition guillotine** — it will happily emit a CHED for a non-compliant consignment.
- It fetches only `movement` + one `animal`; no farm / keeper / BCP / health attestations.
- It reads **no RuleSet** (`imsoc.*` params do not exist yet).
- It emits **no audit event**.
- It registers as type `"ched"` with only 2 repos in `app.module.ts` (no farm/health/passport data).

This ADR completes WO-121: a correct **CHED-A** template with a precondition guillotine, rich data
fetch, RuleSet params, real XML output, validators, audit, and tests — reusing the existing PDF
`DocumentTemplate` framework and the `document.generate` tRPC endpoint (already gated by
`@Policy({ authenticated: true })` + `@RegisterPolicy("document")`).

## Decision

### D1 — Document type corrected to CHED-A

`ChedTemplate.type` becomes `"ched-a"`. The model carries `chedType: "CHED-A"` and
`documentType: "SANITARY_AND_PHYTOSANITARY"` (TRACES NT consignment vocabulary). The plant `CHED-P`
stub fields are removed. This is not cosmetic — emitting the wrong CHED type at a Border Control Post
is a rejection, not a warning.

### D2 — Precondition guillotine (the document is the validator)

`ChedTemplate.mapToModel` runs the checks BEFORE building the model; any failure throws
`documentErr(CHED_PRECONDITION_FAILED, { reasons })`, which the PDF `DocumentService` wraps as a
`DocumentError` and the tRPC layer maps to `TRPCError` (400). Checks:

1. `ruleSet.imsoc.enabled === true` (ADR-0030 param; jurisdiction may disable CHED generation).
2. **Animal has a passport** (`PassportRepository.existsByAnimal`) — identity proof.
3. **No active treatment withdrawal** — extract a shared `HealthRepository.findActiveWithdrawalTreatments(animalId, now)` (the SAME predicate WO-113 enforces at movement creation: `diagnosis_date + withdrawal_period > now`); it is reused, not reimplemented, so the CHED guillotine and the movement-create block cannot drift (NoDrift). No `treatments` row with
   `diagnosis_date + withdrawal_period > now` for the animal (slaughter/export block).
4. **Vaccinations current** — required vaccinations present per `ruleSet.imsoc.requireVaccinations`.
5. **No active disease hold** — config-gated (`ruleSet.imsoc.requireDiseaseClear`); checks the animal /
   source holding is not under an active disease flag (ties WO-119 disease zones, which is pending —
   the check is a no-op until that lands, but the hook is wired now).

The CHED is the *proof* of compliance, so it can only be born from a compliant movement. That is the
dialectical knot: output and validator in one.

### D3 — Rich data fetch (the model a CHED-A actually carries)

`ChedTemplate` is injected with `MovementRepository`, `AnimalRepository`, `FarmRepository`,
`HealthRepository`, `PassportRepository`, `SystemService` (for `getRuleSet`), and
`ExecutionEventEmitter` (audit). `mapToModel` assembles:

| CHED-A section | Source |
| --- | --- |
| Consignment | movement id, issue date, TRACES/CHED reference |
| Origin holding | `farms` (approval no., name) + `addresses` + keeper (ADR-0061: real PII, lawful disclosure) |
| Destination | EU BCP (`ruleSet.imsoc.destinationBcp`) + consignee name/address |
| Animals | `animals` + `ear_tags` + `passports` (species=bovine, count, IDs, age, sex) |
| Health attestations | `vaccinations`, disease-free status, official-vet sign-off, inspection date |
| Transport | vehicle, journey duration (`movements` legs) |
| Attestation | official vet name + date + signature block |

NOTE: `farms` address is a separate `addresses` table (FarmRepository has `findAddressById`); the
keeper linkage is via `farm_subjects`. Where the seed data lacks a filled address/keeper, the field is
`null` (same honesty as the existing `movement.template.ts`) — the schema is correct even if some
rows are sparse.

### D4 — RuleSet params (ADR-0030 — no hardcoded constants)

```
imsoc: {
  enabled: boolean,
  chedFormat: "xml" | "json",   // TRACES NT import format
  schemaVersion: string,
  destinationBcp: string,        // default EU Border Control Post
  requireWithdrawalClear: true,
  requirePassport: true,
  requireVaccinations: true,
  requireDiseaseClear: true
}
```

Added to `RuleSet` interface + `buildRuleSet` (read from `IMSOC_*` system_parameters with safe
fallbacks, like `fsma` / `traceability`). MK is the seeded default; an EU deployment overrides
`destinationBcp` / `schemaVersion` without a code fork.

### D5 — Real XML serialization (fix latent bug)

`DocumentService.generate` validates `format` against `["yaml","xml"]` but ALWAYS calls
`serializeToYaml` — requesting `xml` silently returns YAML. WO-121 adds `serializeToXml` (a small
recursive node serializer to TRACES-NT-shaped XML) and branches in `DocumentService.generate` by
format. CHED defaults to `imsoc.chedFormat` (xml). The stable API stays YAML/XML (PDF/A deferred per
PDF Bot charter).

### D6 — Validators (NoDrift)

`packages/validators/src/api/ched.api.ts`:

- `generateChedRequestSchema` — wraps the generic request but constrains `type` to the literal
  `"ched-a"` (defends against typos / wrong-doc generation).
- `chedModelSchema` — the CHED-A data model (consignment / origin / destination / animals / health /
  transport / attestation), used by the template and by NoDrift checks.
Exported from `packages/validators/src/api/index.ts`.

### D7 — Audit + the GDPR dialectic

On successful generation, `ChedTemplate` emits `CHED_GENERATED` via `ExecutionEventEmitter`
(actor, movementId, chedRef). This is the defensible artifact for both TRACES NT submission tracking
and the regulatory audit.

**The dialectical twist (ADR-0061):** the CHED demands the exporter's REAL name, holding, and
address — exactly the PII ADR-0061 hides by default (D5). The resolution is already specified: CHED
generation is a lawful disclosure under GDPR Art.6(1)(c)/(e) (legal obligation / public task). It is
gated by `pii:read`, carries `purpose: regulatory`, and is written to the signed audit log (ADR-0061
D6/D7). So the template fetches the *decrypted* keeper identity through the audited access procedure.
Privacy plan and trade document are not enemies — they are the two faces of the same legal subject.

### D8 — Registration fix

`apps/api/src/app.module.ts` currently does `new ChedTemplate(movementRepo, animalRepo)` and may omit
the `registry.register(this.chedTemplate)` call (the other three templates register explicitly).
WO-121 provides `ChedTemplate` with all six deps and adds the explicit `registry.register(...)`.

### D9 — Tests

- **Unit** (`ched.template.test.ts`): guillotine PASS (compliant movement -> model) and FAIL
  (missing passport / active withdrawal / disabled `imsoc.enabled` -> `CHED_PRECONDITION_FAILED`);
  XML output is well-formed when `format:"xml"`.
- **e2e** (API): `document.generate({ type: "ched-a", refId, format: "xml" })` returns XML content
  with `CHED-A` markers.

## Consequences

### Positive

- One deployment serves MK / EU; CHED generation is config (destination BCP, format, schema version).
- The CHED is emitted ONLY for compliant consignments — the guillotine is in the document itself.
- Real XML output (latent YAML-for-XML bug fixed) matches TRACES NT import expectations.
- Lawful, audited PII disclosure reconciles with ADR-0061 instead of contradicting it.

### Negative / Cost

- `ChedTemplate` grows its dependency surface (6 injectables).
- Precondition queries add latency to generation (acceptable — generation is not hot-path).
- XML serializer is a new (small) surface to maintain.

### Neutral

- Reuses the existing PDF `DocumentTemplate` framework and `document.generate` endpoint — no new
  transport, no new router.

## Implementation (this WO)

Owning Bot: **PDF Bot** (template + serializer) with **Validation Bot** (ched.api.ts) and **System
Bot** (`imsoc` RuleSet params). Audit via **Execution Bot** `ExecutionEventEmitter`. RobotFarm pass:
mark WO-121 Done in WORKORDER; no root AGENTS.md Bot-change needed (PDF/Validation/System already
described).

## Verification (Definition of Done)

```bash
# ched-a template registered + type corrected
rg -n "type = "ched-a"" packages/pdf/src/templates/ched.template.ts
# guillotine present
rg -n "CHED_PRECONDITION_FAILED" packages/pdf/src packages/validators/src
# imsoc RuleSet params
rg -n "imsoc" packages/domains/system/src/rule-set.ts
# xml serialization branched
rg -n "serializeToXml" packages/pdf/src/engine
# tests green
pnpm --filter @rocky/domains-pdf test   # (or the package owning ched tests)
pnpm test
```

## Anti-Patterns (do not repeat)

1. Emitting `CHED-P` for cattle — wrong document class, rejected at the BCP.
2. Generating a CHED without the precondition guillotine — a non-compliant cert is worse than none.
3. Requesting `xml` and silently returning YAML — the latent bug this ADR fixes.
4. Hardcoding destination BCP / schema version — a jurisdiction override must be a RuleSet param.
5. Treating the CHED PII as a GDPR violation — it is the lawful, audited exception (ADR-0061 D7).

## Open Questions (resolve during implementation)

1. **TRACES NT XSD verification.** The exact CHED-A field names / nesting must be verified against the
   primary TRACES NT schema before the model is frozen (ADR-0054 verification discipline). The ADR
   gives the structural sections; the leaf field names are a research task.
2. **Farm keeper / address data availability.** Seed data may leave `addresses` / `farm_subjects`
   sparse; confirm what is populated and null-guard honestly (as `movement.template.ts` does).
3. **Level 2 (direct TRACES NT API push)** is explicitly OUT of scope — credentials / BCP
   registration / handshake are a separate epic. This WO is Level 1 (generate XML/JSON + cert).
4. **Disease-clear check** depends on WO-119 (disease zones); the hook is wired but the check is a
   no-op until WO-119 lands.

## Related ADRs

- **ADR-0054** — regulatory framework; R9 / strike 9 is the parent of this plan.
- **ADR-0061** — GDPR; the CHED as lawful, audited PII disclosure (D7 here).
- **ADR-0030** — RuleSet; `imsoc.*` is a jurisdiction param set, not constants.
- **PDF Bot `packages/pdf`** — `DocumentTemplate` / `DocumentRegistry` / `DocumentService`.
