# ADR-0074: Field-Role Edge Protocol -- Contact-Only PII, Purpose-Scoped Sync, TTL & Reveal Audit

> The vet must call the farmer. GDPR protects the farmer; it does not gag the vet.
> The control is not denial and not concealment -- it is necessity-limited scope,
> bounded residence, and accountability.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status**     | Proposed (Phase 2 -- mobile edge; **pending stakeholder confirmation**)      |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Compliance homework)                                    |
| **Source**     | user direction (vet needs name + phone; no VoIP-concealment); ADR-0073; ADR-0061 D5; ADR-0007; ADR-0036; role constants |
| **Related**    | ADR-0061; ADR-0067; ADR-0073; ADR-0007; ADR-0022; ADR-0068; ADR-0036; ADR-0069 |

## Context

The mobile surface is narrow. From the role constants: `SUPER_ADMIN`, `VD_ADMIN`,
`VD_STAFF` are back-office (web, `apps/web`) and never touch the PDA. The genuine
field roles are `FARMER`, `VETERINARIAN`, `TECHNICIAN`, and `VI` (inspector). Of
these, `VETERINARIAN` and `TECHNICIAN` are **not** in `FARM_READ_ROLE`, so their RLS
read scope is cross-farm -- they are the aggregators.

A field role **needs** keeper contact to do its lawful job: a vet calling a keeper
about a notifiable disease, an inspector contacting a holder for an official control.
Hiding the number behind VoIP so the vet cannot see it is *not* what GDPR intends
(GDPR Art 6(1)(b)/(c) -- the call is necessary and lawful). The control is therefore
neither *denial* of PII nor *concealment* of it -- it is **necessity-limited scope,
bounded residence, and accountability**.

Two rejected extremes, recorded so we do not drift back to them:
- **Deny all `pii:read` to field roles** -- defeats the job; the vet cannot contact
  the keeper.
- **Obscure via VoIP / never show the number** -- bureaucratic absurdity; GDPR
  protects the farmer while enabling the lawful call.

## Decision

Adopt a **role-aware edge data policy**. Field roles receive **contact-only PII
(name + phone) for purpose-scoped farms**, TTL-bounded on the device, and
reveal-logged. They are **denied national IDs and any region-wide or bulk PII**.
Back-office roles keep broader `pii:read` on the web surface, server-audited.

```
EdgeDataPolicy = {
  role:        string;
  syncScope:   "own-farm" | "purpose-farm" | "region" | "web";
  piiResidency: "none" | "contact-only" | "masked-own" | "full";
  ttlMs:        number;                  // expiry for any PII that lands on device
  revealLog:    boolean;                 // log every PII reveal by this role
  exclude:      string[];                // PII classes never sent to this role's device
}

vet / technician / VI = {
  syncScope: "purpose-farm", piiResidency: "contact-only",
  ttlMs: SHORT, revealLog: true,
  exclude: ["nationalId", "otherFarms", "bulk"]
}
farmer              = { syncScope: "own-farm",  piiResidency: "masked-own", ttlMs: LONG,  revealLog: false }
slaughterhouse_op /  = { syncScope: "own-site", piiResidency: "masked-own", ttlMs: LONG,  revealLog: false }
  market_op
back-office (web)   = { syncScope: "web", piiResidency: "full", ttlMs: n/a, revealLog: true }
```

### What is IN the field-role offline bundle (per visit)
- Animal / health / movement operational data for the synced farm.
- Keeper **name + phone** for that farm (necessary contact).
- Farm location for the visit.

### What is NOT in it
- `personalId` / national ID (almost never needed to place a call).
- Any other farm's keepers.
- Any region-wide or bulk PII dump.

Three bounds do the work: **scope** (per-farm, not region), **residence** (TTL,
visit-bound, purged -- we minimize what *lingers*, not what is *seen*), and
**accountability** (every view reveal-logged). The "mass PII on a stolen phone"
risk is bounded to the current visit's contacts.

## Server part (the mechanism that enforces the above)

The phone is castrated (ADR-0036): it cannot enforce this itself. The server owns
the Symbolic order. Two server changes implement the policy:

### S1. Offline projection variant on `syncDownload` (contact-only)
The sync server already scopes rows by RLS. Add an **offline-profile projection**
so that, for a field role's *offline cache*, the per-farm payload emits operational
data plus the keeper's `firstName` / `lastName` / `phoneNumber` (the `contact-only`
subset) for **that** farm, and omits `personalId` and every other farm's subjects.
- Source of truth: `PII_FIELD_REGISTRY` (`packages/validators/src/pii`). Contact
  fields = the subset the registry marks as `type: "name" | "contact"` and needed
  for contact; `exclude` = `nationalId` + non-synced farms. The registry is consulted
  **server-side** -- the app never imports it (per ADR-0073).
- Location: `packages/domains/sync` (syncDownload projection) + `apps/api` (sync
  router). RLS decides *which rows*; this projection decides *which columns*.

### S2. Reveal-log mutation `audit.logReveal`
A tRPC mutation that receives a reveal event -- `actor` (anonymised salted hash),
`farm`, `entity`, `column`, `purpose`, `decision: ALLOWED` -- and writes it via the
ExecutionPipeline (`RLSStage` + lifecycle `event-emitter`) to the tamper-evident,
hash-chained audit store (ADR-0007). The mobile `<PiiText onReveal>` ships the event
through the outbox to this mutation. The server **re-validates** the principal and
`pii:read` before logging -- the castrated client is never trusted.

### S3. Integration points
- **RLS** (already scopes syncDownload) + **`@Policy` / `pii:read`** (gates online
  reveals) + **offline projection** (contact-only default) + **`audit.logReveal`**
  (accountability) + **RuleSet** (jurisdiction `ttlMs` for contact PII).
- The discriminator `FARM_READ_ROLE` membership remains the clean signal: in it ->
  relaxed; not in it -> contact-only strict.

### S4. TTL
The server stamps cached contact records with `expires_at` (= sync time + policy
`ttlMs`); the device's background-fetch sweep (ADR-0036 WO-092) purges expired
contact PII and scrubs on app resume. Device behaviour waits for the WO-082 native
gate to certify.

## Consequences

### Positive
- Necessary PII is available to do the lawful job; the region-wide dump is prevented;
  every view is accountable. Satisfies GDPR Art 5(1)(c) minimization (by scope) and
  Art 25 by-design (necessity-limited), without gagging the field worker.

### Negative / Cost
- Server changes S1 + S2 are required (sync projection + audit mutation) and are
  verifiable here; the device TTL sweep needs the native gate.
- **Pending stakeholder confirmation** (see below) before any build / WORKORDER.

### Neutral
- Reuses ADR-0073's `<PiiText>` + reveal-log shape, the registry, and the audit store.
- Deliberately excludes behavioural profiling of field roles (velocity / Anomaly
  caps) unless a later DPIA (ADR-0069) justifies it.

## Stakeholder confirmation (REQUIRED before implementation)

This ADR is Proposed and explicitly **subject to stakeholder review** (user
directive: "I will need to check all the stakeholders"). Open questions to resolve
with vets, inspectors, the Veterinary Directorate, and the DPO:
1. Exactly which contact fields -- name + phone only, or also email?
2. TTL length for contact PII on device (visit-bound vs longer)?
3. Does `personalId` / national ID ever legitimately appear for an official control?
4. Cross-border / cross-jurisdiction (MK <-> AL) implications for contact PII?
5. Who owns the reveal-log retention and the breach assessment if a device is lost?

No WORKORDER entry is created until these are answered.

## Implementation

- Owning Bot: **Mobile Bot** (TTL sweep, `<PiiText>` reveal, per-role cache policy)
  + **API Bot** (offline projection in sync router, `audit.logReveal` mutation)
  + **Sync domain** (projection) + **Execution Bot** (audit write)
  + **Validators Bot** (registry contact subset).
- RobotFarm pass: **NO WORKORDER yet** (user directive). Add a WO only after
  stakeholder sign-off; note in Mobile Bot AGENTS.md that field caches are
  contact-only + TTL-bounded.

## Verification (Definition of Done)

```bash
rg -n "contact-only|purpose-farm|expires_at|logReveal" apps/api packages/domains/sync
# a field-role offline bundle contains name+phone for the synced farm ONLY,
# and contains NO personalId and NO other-farm subjects (assert in test)
# a reveal event from a field device is present in the tamper-evident server log
# after ttlMs, cached contact PII is purged on device (native gate)
```

## Anti-Patterns

1. Denying all PII to field roles (defeats the lawful call).
2. Obscuring the number via VoIP / never showing it (absurd; not GDPR's intent).
3. Sending a region-wide / bulk PII dump to the device.
4. Revealing PII without logging it.
5. Infinite TTL -- any device PII must expire.
6. Creating a WORKORDER before stakeholder confirmation.

## Related ADRs

- **ADR-0061** -- GDPR erasure / retention; D5 mask-by-default (this ADR makes the
  field case *contact-only*, not merely masked).
- **ADR-0067** -- ISMS roadmap; this is the high-risk-role decomposition.
- **ADR-0073** -- mobile edge compliance; this ADR specifies the field-role policy
  within that framework (measures 2, 3, 5, 6 concretized + server part).
- **ADR-0007** -- audit via lifecycle events; the reveal log lands here.
- **ADR-0022** -- RBAC / `pii:read` policy (gates online reveals).
- **ADR-0068** -- lawful-basis register; the reveal `purpose` is recorded against it.
- **ADR-0036** -- offline-first contract (background-fetch TTL sweep host).
- **ADR-0069** -- DPIA; the stakeholder review below is its field-input.
