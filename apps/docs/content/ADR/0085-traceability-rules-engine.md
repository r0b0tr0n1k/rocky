# ADR-0085: Traceability Rules Engine (Implementing Reg (EU) 2021/520 as a toggleable registry)

> The four bovine/terrestrial-animal traceability Articles from **Commission Implementing
> Regulation (EU) 2021/520** (Art. 3 transmission window, Art. 12 numeric code, Art. 13(4)
> tag-before-move, Art. 19(4) dual-code) were scattered as ad-hoc booleans on `RuleSetTraceability`.
> A jurisdiction must be able to **enable, disable, or re-parameterise each Article
> independently** — without a code change. This ADR promotes them to a single, named,
> toggleable rule registry: a traceability rules engine.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-12 |
| **Author** | Architecture Review (prompted by user directive) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0033 (ADR standard) · ADR-0018 / ADR-0019 (validators) · ADR-0084 (signed-QR credentials) · WO-022 (birth-deadline farm lock) · Movement / Animal / EarTag / Validation bots |

---

## Context

The traceability Articles of (EU) 2021/520 are **mandatory EU floors**, but a jurisdiction
(e.g. North Macedonia, our `MK` default) may (a) align with stricter national rules, or
(b) — for non-EU deployments — want to switch individual Articles off or tune their
parameters (a 14-day transmission window, a 9-month tagging deadline, etc.).

The **symptom** today: the four rules lived as undifferentiated `requireTagBeforeMove` /
`transmissionDeadlineDays` / `enforceTransmissionDeadline` / `requireDualCodeOnReplacement`
booleans on `RuleSetTraceability`. There was no single place to see *which* Articles apply,
no per-Article enable/disable, and no per-Article parameter override. Operators could not
"choose what we apply."

Backend dependencies (ADR-0033 §D4): validators → ADR-0018 / ADR-0019; the `RuleSet` config
already exists (ADR-0030 system parameters); movement enforcement lives in the Movement
bot. No new package or bot is introduced — the engine is a module inside `@rocky/domains-system`.

## Decision

Promote the four Articles into a **named, toggleable rule registry** — a traceability
rules engine — inside `@rocky/domains-system`:

- `packages/domains/system/src/traceability-rules.ts` defines `TraceabilityRule`
  (`id`, `article`, `title`, `description`, `enabled`, `params`) and
  `DEFAULT_TRACABILITY_RULES` — the four Articles, **all `enabled: true` at their EU
  floors** by default.
- `resolveTraceabilityRules(rows)` merges seeded `system_parameters` over the defaults so a
  jurisdiction can toggle/re-parameterise each Article with no code change:
  - `<RULE_ID>_ENABLED` = `"true"` | `"false"` (e.g. `ART3_TRANSMISSION_WINDOW_ENABLED=false`)
  - `<RULE_ID>_PARAM_<key>` = value (e.g. `ART3_TRANSMISSION_WINDOW_PARAM_transmissionDeadlineDays=14`)
- `TraceabilityRuleEngine` exposes `getRule` / `isEnabled` / `getParam` query helpers.
- `RuleSet` gains `traceabilityRules: TraceabilityRule[]`; the ad-hoc `RuleSetTraceability`
  booleans are removed.
- **Enforcement wiring:**
  - **Art. 13(4)** + **Art. 3** → `MovementService.create` consults the engine
    (`ART13_TAG_BEFORE_MOVE`, `ART3_TRANSMISSION_WINDOW`) and blocks accordingly.
  - **Per-species first-identification (Art. 13/14/15/21)** → `AnimalService.create`
    resolves the species' tagging rule via `SPECIES_TAGGING_RULE[species]` and blocks when
    the animal is older than `speciesTaggingMaxDays(species)` of birth with no in-window
    `taggingDate` (`ANIMAL_TAGGING_DEADLINE_EXCEEDED`). `animals.species` is a `NOT NULL`
    enum column (default `BOVINE`); the rule is armed in the engine and now enforced at the
    animal layer (2026-07-13).
  - **Art. 12** → `makeEarTagSchema(format)` in `@rocky/validators` enforces the numeric
    code from `RuleSetTag.format` (`MK_8` 8-digit + check digit, `ISO_11784_15` 15-digit);
    the `ART12_NUMERIC_CODE` rule is registered for visibility/parameterisation.
  - **Art. 19(4)** → `requiresDualCodeRecording()` + the `ART19_DUAL_CODE_ON_REPLACEMENT`
    rule are armed in the engine; enforcement activates when the ear-tag replacement flow
    is built (currently only the `ear-tag-replacements` table exists).

```mermaid
graph TD
  SP[("system_parameters<br/>(per jurisdiction)")] --> RES[resolveTraceabilityRules]
  DEF[DEFAULT_TRACABILITY_RULES<br/>4 Articles, enabled @ EU floors] --> RES
  RES --> RS[RuleSet.traceabilityRules]
  RS --> ENG[TraceabilityRuleEngine<br/>isEnabled / getParam]
  ENG --> M[MovementService.create<br/>Art.13(4) + Art.3 guards]
  ENG --> A[AnimalService.create<br/>per-species tagging Art.13/14/15/21]
  ENG --> V[makeEarTagSchema<br/>Art.12 numeric code]
  ENG --> E[EarTag replacement<br/>Art.19(4) — armed]
```

## Regulatory Sources (EU Commission → national transposition)

Per the directive, the EU Commission regulation is quoted **first**, then the local
(irish) government transposition.

### 1. EU — Commission Implementing Regulation (EU) 2021/520

*(traceability of kept bovine, ovine, caprine and porcine animals)*

> **Art. 3 (Notification of movements)** — Operators shall transmit the information on each
> movement of animals to the computerised database … *within 7 days following the day of the
> movement*.
>
> **Art. 12 (Identification code)** — The unique identification code … shall consist of the
> ISO 3166-1 alpha-2 or numeric country code … followed by the animal's own code, composed of
> *numeric characters, the length of which shall not exceed 12 characters*.
>
> **Art. 13 (Bovine animals)** — (1) Bovine animals shall be identified … *within 20 days
> following birth or before they leave the holding of birth, whichever is earlier*.
>
> **Art. 14 (Ovine and caprine animals)** — (1) Ovine and caprine animals shall be identified
> *within 9 months following birth or before they leave the holding of birth, whichever is
> earlier*.
>
> **Art. 15 (Porcine animals)** — (1) Porcine animals shall be identified *within 9 months
> following birth or before they leave the holding of birth*.
>
> **Art. 17 (After entry into the Union)** — Animals shall be identified *within 20 days
> following the day of entry*.
>
> **Art. 19 (Replacement)** — (1) … within *7 days* following the day on which the operator
> observes that the means of identification is lost or has become illegible … (4) Where the
> electronic identifier cannot reproduce the visual identification code, *both the visual
> identification code and the electronic identifier's code shall be recorded*.

Equine traceability is in **Commission Implementing Regulation (EU) 2021/963**: Art. 9
(notification, 7 days), Art. 14 (30 days), Art. 21 (first identification *within 12 months of
birth or before leaving the establishment of birth*).

### 2. Ireland — S.I. No. 254 of 2023

*European Union (Animal Identification and Tracing) Regulations 2023* (the local transposition
that gives the above Articles force in Irish law)

> **Reg. 11(2)(b)** — a person shall not contravene *Regulation 2021/520 in respect of the
> traceability of kept bovine animals*.
>
> **Reg. 11(5)** — the applicable period set in the State: *(a) for Article 3, the deadline is
> 7 days, and (b) for Article 13, the deadline is 20 days or on leaving the establishment of
> birth, if that date is earlier*.
>
> **Reg. 12(6)** — ovine/caprine: *(a) for Article 3, the deadline is 7 days, and (b) for
> Article 14, the deadline is 9 months or on leaving the establishment of birth, if that date is
> earlier*.
>
> **Reg. 14(5)** — porcine: *(a) for Article 3, the deadline is 7 days, and (b) for Article 15,
> the deadline is 9 months*.
>
> **Reg. 13(5)** — equine (under 2021/963): *(a)(i) Article 9 — 7 days; (a)(ii) Article 14 —
> 30 days; (a)(v) Article 21 — 12 months*; and *(b) pursuant to Article 59(3)(b) of Regulation
> 2019/2035 the deadline is 6 months from the date of birth*.
>
> **Reg. 17(2)** — replace a lost/illegible means of identification *within 7 days* (Art. 19).
> **Reg. 17(6) & (7)** — a person shall not acquire, move, sell, supply, slaughter or export a
> relevant animal *unless it is identified with approved means of identification* (applies to
> all kept terrestrial animals — the basis for the cross-species `ART13_TAG_BEFORE_MOVE` rule).

## Consequences

### Positive

- A jurisdiction can independently enable/disable or tune **each** Article via config —
  the "choose what we apply" requirement is met.
- One registry to audit ("which traceability rules are live?") instead of buried booleans.
- EU floors remain the defaults; `validateSovereignLimits` still guards the birth deadlines.
- No new package/bot; the engine is a focused module in the existing System domain.

### Negative / Cost

- Call sites read rules via `TraceabilityRuleEngine.isEnabled(...)` rather than a boolean
  field — marginally more verbose (acceptable; it is the point).
- Art. 19(4) is registered but not yet enforced end-to-end (no replacement service method).

### Neutral

- `RuleSetTraceability` keeps `maxDepth` / `retentionYears`; only the four booleans moved.

## Implementation

Owning bots (ADR-0033 §D5): **System Bot** (engine + `RuleSet`), **Movement Bot**
(`create` guards), **Validation Bot** (`makeEarTagSchema`). RobotFarm pass: root
`AGENTS.md` Bot descriptions + `packages/domains/movement/AGENTS.md` updated.

Roll-out: the four rules are **active by default**; to switch one off or retune it, seed a
`system_parameters` row (e.g. `ART3_TRANSMISSION_WINDOW_ENABLED=false`). No migration
required — `resolveTraceabilityRules` falls back to defaults when the row is absent.

## Verification (Definition of Done)

```bash
# 1. ADR exists in the canonical set and cites validator + ADR-0033 deps
ls apps/docs/content/ADR/0085-traceability-rules-engine.md
rg -n "ADR-0033|ADR-0018|ADR-0019" apps/docs/content/ADR/0085-traceability-rules-engine.md

# 2. The four Article rules exist as a toggleable registry, all enabled by default
rg -n "ART12_NUMERIC_CODE|ART13_TAG_BEFORE_MOVE|ART3_TRANSMISSION_WINDOW|ART19_DUAL_CODE_ON_REPLACEMENT" \
  packages/domains/system/src/traceability-rules.ts

# 3. Movement guards consult the engine (not a boolean field)
rg -n "TraceabilityRuleEngine.isEnabled" packages/domains/movement/src/services/movement.service.ts

# 4. Tests prove enable/disable + re-parameterisation
pnpm --filter @rocky/domains-system exec vitest run src/rule-set.traceability.test.ts
pnpm --filter @rocky/domains-movement exec vitest run src/services/movement.service.traceability.test.ts
```

## Anti-Patterns (do not repeat)

1. **Re-introducing ad-hoc booleans** — new traceability Articles go in the registry, not as
   fresh `traceability.*` flags.
2. **Loosening an EU floor** — `validateSovereignLimits` guards birth deadlines; keep the
   floors as hard maxima even when a rule is toggled.
3. **Hard-coding a 7/20-day constant at the call site** — read it from the rule's `params`
   via the engine so it stays jurisdiction-data.

## Related ADRs

- **ADR-0033** — ADR house standard (this document conforms).
- **ADR-0018 / ADR-0019** — validators (Diamond Seal); `makeEarTagSchema` enforces Art. 12.
- **ADR-0084** — offline signed-QR credentials (shares the traceability identity model).
- **WO-022** — birth-deadline farm lock (overlaps Art. 3 for birth notifications).
- **Implementing Reg (EU) 2021/520** — the source regulation (Art. 3 / 12 / 13 / 19).
