# ADR-0074: Field-Role Edge Protocol -- Contact-Only PII, Purpose-Scoped Sync, TTL & Reveal Audit

> The vet must call the farmer. GDPR protects the farmer; it does not gag the vet.
> The control is not denial and not concealment -- it is necessity-limited scope,
> bounded residence, device auth, and accountability.

| Key            | Value                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | Proposed                                                                                                                                            |
| **Phase**      | Phase 2 -- mobile edge; **pending stakeholder confirmation**                                                                                        |
| **Date**       | 2026-07-11                                                                                                                                          |
| **Author**     | Architecture Review (Compliance homework)                                                                                                           |
| **Supersedes** | —                                                                                                                                                   |
| **Superseded** | —                                                                                                                                                   |
| **Source**     | user direction (vet needs name+phone; dial-from-app; 24h TTL; device auth; butcher scan); ADR-0073; ADR-0061 D5; ADR-0007; ADR-0036; role constants |
| **Related**    | ADR-0061; ADR-0067; ADR-0073; ADR-0007; ADR-0022; ADR-0068; ADR-0036; ADR-0069; ADR-0072                                                            |

## Context

The mobile surface is narrow. From the role constants: `SUPER_ADMIN`, `VD_ADMIN`,
`VD_STAFF` are back-office (web, `apps/web`) and never touch the PDA. The genuine
field roles are `FARMER`, `VETERINARIAN`, `TECHNICIAN`, `VI` (inspector), and
`SLAUGHTERHOUSE_OP` / `MARKET_OP` (own-site). Of these, `VETERINARIAN` and
`TECHNICIAN` are **not** in `FARM_READ_ROLE`, so their RLS read scope is cross-farm --
they are the aggregators. `SLAUGHTERHOUSE_OP` / `MARKET_OP` are `FARM_READ_ROLE`
(own-site scoped) but still handle third-party animals + certificates.

**Inspectors (verified from code).** There is **no distinct inspector login role**.
`USER_ROLE` (packages/database/src/constants/user-role.ts) lists SUPER_ADMIN,
VD_ADMIN, VD_STAFF, VETERINARIAN, TECHNICIAN, SLAUGHTERHOUSE_OP, MARKET_OP, FARMER --
no INSPECTOR. The inspection domain records an `inspectorId` (the performing user's
UUID) and the router gates on `authenticated` + `analysis:read` / `analysis:run`
(ADR-0054), not an inspector role. `SUBJECT_ROLE.VI` exists but is a *registry label*
for a person, not a PDA login. Conclusion: on the mobile app an inspector **is** a
veterinarian (official veterinary control); a non-vet inspector uses the web admin,
not the PDA. The mobile field-role surface therefore collapses to **FARMER +
VETERINARIAN (+ TECHNICIAN)**.

A field role **needs** keeper contact to do its lawful job: a vet calling a keeper
about a notifiable disease, an inspector contacting a holder for an official control.
Hiding the number behind VoIP so the vet cannot see it is *not* what GDPR intends
(GDPR Art 6(1)(b)/(c) -- the call is necessary and lawful). The control is therefore
neither *denial* of PII nor *concealment* of it -- it is **necessity-limited scope,
bounded residence, device auth, and accountability**.

Two rejected extremes, recorded so we do not drift back to them:

- **Deny all `pii:read` to field roles** -- defeats the job; the vet cannot contact
  the keeper.
- **Obscure via VoIP / never show the number** -- bureaucratic absurdity; GDPR
  protects the farmer while enabling the lawful call.

**Scope (jurisdiction).** Albania is out of detailed scope for this protocol; it is
present in the app from a prior GDPR project. Both North Macedonia (MK LPDP) and
Albania (AL Law 124) are GDPR-derived, so a GDPR-aligned edge protocol satisfies
both. Jurisdiction-specific *veterinary-law* variance (e.g. whether a farmer ID is
mandated) is carried by the **RuleSet domain** (ADR-0030), not hardcoded here -- if
a jurisdiction mandates farmer ID, the RuleSet expresses it and the edge protocol
honours the hidden-by-default rule above.

## Decision

Adopt a **role-aware edge data policy**. Field roles receive **contact-only PII
(name + phone + email) for purpose-scoped farms**, TTL-bounded (24h, working),
device-auth-gated, and reveal-logged. They are **denied national IDs and any
region-wide or bulk PII**. The contact-only rule governs *third-party* PII; a role's
own organisation data is showable. Back-office roles keep broader `pii:read` on the
web surface, server-audited.

```
EdgeDataPolicy = {
  role:         string;
  syncScope:    "own-farm" | "purpose-farm" | "own-site" | "region" | "web";
  piiResidency: "none" | "contact-only" | "manifest-contact" | "masked-own" | "full";
  ttlMs:         number;                  // expiry for any PII that lands on device
  revealLog:     boolean;                 // log every PII reveal by this role
  deviceAuth:    "required" | "none";     // PIN/biometric gate before PII is shown
  exclude:       string[];                // PII classes never sent to this role's device
}

vet / technician (inspectors ARE vets on mobile) = {
  syncScope: "purpose-farm", piiResidency: "contact-only",
  ttlMs: 24h, revealLog: true, deviceAuth: "required",
  exclude: ["nationalId", "otherFarms", "bulk"]
}
butcher / market_op = {
  syncScope: "own-site", piiResidency: "manifest-contact",
  ttlMs: 24h, revealLog: true, deviceAuth: "required"
  // manifest = arriving animals + death-cert / passport REFERENCE; contact-only keeper if calling
}
farmer = {
  syncScope: "own-farm", piiResidency: "masked-own",
  ttlMs: long, revealLog: false, deviceAuth: "none"
  // farmer keeps HIS OWN data on the phone; it is low-risk and offline-capable
}
back-office (web) = { syncScope: "web", piiResidency: "full", deviceAuth: "required", revealLog: true }
# GLOBAL: neverOnDevice = ["nationalId"]   -- excluded from EVERY device, all roles
# (police/warrant access is a server-side, legally-gated path, not a device cache)
```

### Hard rule: nationalId is NEVER on a field device

`personalId` / national ID (UCN) is **never** sent to any field device, for any
role. In North Macedonia its broad display is forbidden; it is accessible only to
law enforcement with a warrant -- a server-side, legally-gated path (ADR-0061 D5 /
ADR-0068: legal obligation / official authority), never the PDA. The butcher's
manifest uses the death-certificate / passport *reference* (a document key), which
is distinct from the keeper's national ID. (AL jurisdiction: to be confirmed; the
default remains EXCLUDE until a legal basis says otherwise.)

The only natural person who *might* carry a mandated ID is the **farmer**, and only
where a law/jurisdiction requires it (e.g. subsidy / registration). Even then it is
**hidden by default** -- stored server-side if mandated, never rendered on a device
in the normal flow, shown only under a specific legal basis + logged. There is no
reason to *display* a national ID in the app that would warrant it appearing in the
DPIA as a shown field. So in practice: nationalId is never on a device.

### What is IN the field-role offline bundle (per visit / per site)

- Animal / health / movement operational data for the synced farm or site.
- Keeper **name + phone + email** for that farm (necessary contact; click-to-dial
  and click-to-mail; the dial/mail action IS the logged reveal).
- Farm location for the visit.
- Butcher: the arrival **manifest** (animals + death-certificate / passport
  *reference*) for animals reaching their plant; scan ear tags to match.
The butcher is typically an *employee of a legal entity* (the slaughterhouse
company); the manifest is company-scoped. A company is not a natural-person data
subject under GDPR Art 4(1), so the butcher's PII sensitivity is low (company data +
their own employee record). Contact-only keeper PII applies only if the butcher must
call a keeper.

### What is NOT in it

- `personalId` / national ID (almost never needed to place a call).
- Any other farm's keepers.
- Any region-wide or bulk PII dump.

Three (+ one) bounds do the work: **scope** (per-farm/site, not region),
**residence** (TTL, visit-bound, purged -- we minimize what *lingers*, not what is
*seen*), **device auth** (PIN/biometric before any PII shows, for third-party-PII
roles), and **accountability** (every view reveal-logged). The "mass PII on a stolen
phone" risk is bounded to the current visit's contacts, behind a device lock.

### Online vs offline

When network is present the app **syncs and shows live server data** (server-audited
via ADR-0007 on the read). The TTL and contact-only projection govern only the
*offline residue* -- a temporary mirror. We never force workers offline; online is
the preferred path.

## Server part (the mechanism that enforces the above)

The phone is castrated (ADR-0036): it cannot enforce this itself. The server owns
the Symbolic order. Two server changes implement the policy:

### S1. Offline projection variant on `syncDownload` (contact-only)

The sync server already scopes rows by RLS. Add an **offline-profile projection**
so that, for a field role's *offline cache*, the per-farm payload emits operational
data plus the keeper's `firstName` / `lastName` / `phoneNumber` / `email` (the
`contact-only` subset) for **that** farm, and omits `personalId` and every other
farm's subjects.

- Source of truth: `PII_FIELD_REGISTRY` (`packages/validators/src/pii`). Contact
  fields = the subset the registry marks as `type: "name" | "contact"`; `exclude` =
  `nationalId` + non-synced farms. The registry is consulted **server-side** -- the
  app never imports it (per ADR-0073).
- Location: `packages/domains/sync` (syncDownload projection) + `apps/api` (sync
  router). RLS decides *which rows*; this projection decides *which columns*.

### S2. Reveal-log mutation `audit.logReveal`

A tRPC mutation that receives a reveal event -- `actor` (anonymised salted hash),
`farm`, `entity`, `column`, `purpose`, `decision: ALLOWED` -- and writes it via the
ExecutionPipeline (`RLSStage` + lifecycle `event-emitter`) to the tamper-evident,
hash-chained audit store (ADR-0007). The mobile `<PiiText onReveal>` (fired by the
dial / mail / view action) ships the event through the outbox to this mutation. The
server **re-validates** the principal and `pii:read` before logging -- the castrated
client is never trusted.

### S3. Integration points

- **RLS** (already scopes syncDownload) + **`@Policy` / `pii:read`** (gates online
  reveals) + **offline projection** (contact-only default) + **RuleSet** (jurisdiction
  `ttlMs` for contact PII).
- The discriminator `FARM_READ_ROLE` membership remains the clean signal: in it ->
  relaxed/own-site; not in it -> contact-only strict.

### S4. TTL -- lazy / opportunistic purge (NOT a background timer)

A killed app cannot run JavaScript, so no in-app timer guarantees deletion. Instead:

- At sync, every cached contact record is stamped `expires_at = synced_at + ttlMs`.
- Purge is **opportunistic**: on app launch, on app resume (foreground), on every
  sync, and *best-effort* via `expo-background-fetch` (WO-092). Expired contact PII is
  scrubbed **before it is next shown**.
- Guarantee: *expired PII is gone before next use / next launch*, not "deleted within
  exactly ttlMs of the app being killed." Honest and achievable.

### S5. Device auth (PIN / biometric) for third-party-PII roles

Field roles that handle third-party PII (vet / technician / VI / butcher / market_op)
require a device PIN or biometric unlock before any PII is rendered. The farmer is
exempt (own data, low risk). This is ADR-0072 (re-auth lock) concretized for the edge.

- Mechanism: gate the PII-rendering path behind `expo-local-authentication`
  (or the OS credential); the unlock is session-scoped, not per-field.

### S6. Device loss & breach assessment (Q5 resolved)

A lost / stolen field device is handled by **procedure**, not panic:

- **Accountability.** The device is issued to a named user (vet / technician / butcher /
  market_op) under the **controller** (VD). That user must safeguard it + report loss
  promptly; the controller (via DPO) owns the breach assessment. (GDPR has no literal
  'maintainer of the equipment' role -- the accountable party is the *controller*; the
  device user is an authorised person under Art 29, acting on the controller's instructions.)
- **What was on the phone.** The reveal-log (S2) + the contact-only offline bundle (S1)
  for that `deviceId` *are* the 'PII-on-device-at-loss' inventory. No extra register.
- **Posture at loss.** Offline PII lives in an encrypted store unlocked only by device
  PIN / biometric (S5). The data is therefore unintelligible to an unauthorised person --
  the **Art 34(3)(a) exemption** from breach notification applies by default.
- **Risk is trivial.** Offline data is contact-only (name + phone + email), purpose-scoped,
  24h TTL-bounded; not a user database -- at most one or two extra contacts per device.
  With encryption-at-rest + access control, a routine loss does not warrant Art 33
  notification. No further measures are required.
- **Procedure.** On reported loss: (1) revoke the device session + `deviceId`; (2) pull the
  reveal-log + offline inventory for `deviceId` from the server; (3) DPO assesses using
  Art 34(3)(a) and records the outcome; (4) only if there is evidence of compromise
  (device was unlocked / breached) escalate per ADR-0072. Default: documented, not notifiable.
- **Key custody.** The offline-store key is device-bound (OS secure enclave); the server-side
  KEK + audit-log key live in a **vault on a separate server** by default (contract may state
  otherwise) -- never co-located with the database (ADR-0071).

## Consequences

### Positive

- Necessary PII is available to do the lawful job (dial/mail a keeper); the region-wide
  dump is prevented; every view is accountable; a stolen device is locked and its PII
  residue is TTL-bounded. Satisfies GDPR Art 5(1)(c) (minimization by scope) and
  Art 25 (by-design), without gagging the field worker.

### Negative / Cost

- Server changes S1 + S2 are required (sync projection + audit mutation) and are
  verifiable here; the device TTL sweep (S4) and device auth (S5) need the native gate.
- **All stakeholder questions are now answered** (see below); implementation may proceed
  on the user's go-ahead. No WORKORDER yet per standing directive.

### Neutral

- Reuses ADR-0073's `<PiiText>` + reveal-log shape, the registry, and the audit store.
- Deliberately excludes behavioural profiling of field roles (velocity / Anomaly caps)
  unless a later DPIA (ADR-0069) justifies it.

## Stakeholder confirmation (REQUIRED before implementation)

All stakeholder questions are now **answered** (below). The ADR moves from *pending
review* to *review complete*; a WORKORDER is created only on the user's go-ahead.

1. ~~Which contact fields~~ -> **answered**: name + phone + email, clickable + logged.
2. ~~TTL length / mechanism~~ -> **answered**: 24h working; lazy opportunistic purge
   (S4); never force offline.
3. ~~Does `personalId` / national ID ever appear?~~ -> **RESOLVED (MK)**: no, for any
   field role and any device. In North Macedonia its broad display is forbidden; it is
   police-with-warrant only, server-side and legally gated. The butcher uses the
   death-certificate / passport *reference* (document key), not the keeper's national ID.
   AL jurisdiction: default EXCLUDE until a legal basis says otherwise -- **confirm**.
4. ~~Cross-border (MK <-> AL) implications~~ -> **RESOLVED by scope**: Albania is
   out of detailed scope (prior GDPR project); both MK LPDP and AL Law 124 are
   GDPR-derived, so the GDPR-aligned edge protocol satisfies both. Veterinary-law
   variance per jurisdiction is carried by the RuleSet domain (ADR-0030), not here.
5. ~~Who owns the reveal-log retention + breach assessment on device loss~~ -> **RESOLVED**:
   device issued to a named user under the controller; the reveal-log + contact-only
   bundle *are* the 'PII-on-device' inventory; encrypted + biometric-locked + TTL-bounded
   => Art 34(3)(a) exemption; trivial risk; DPO assesses, default not notifiable (S6).

No WORKORDER entry is created until these are answered.

## Implementation

- Owning Bot: **Mobile Bot** (TTL sweep S4, device auth S5, `<PiiText>` reveal,
  per-role cache policy, butcher scan flow) + **API Bot** (offline projection S1 in
  sync router, `audit.logReveal` S2) + **Sync domain** (projection) + **Execution Bot**
  (audit write) + **Validators Bot** (registry contact subset).
- RobotFarm pass: **NO WORKORDER yet** (user directive). Add a WO only after
  stakeholder sign-off; note in Mobile Bot AGENTS.md that field caches are
  contact-only + TTL-bounded + device-auth-gated.

## Verification (Definition of Done)

```bash
rg -n "contact-only|purpose-farm|manifest-contact|expires_at|logReveal|deviceAuth" apps/api packages/domains/sync apps/mob
# a field-role offline bundle contains name+phone+email for the synced farm ONLY,
# and contains NO personalId and NO other-farm subjects (assert in test)
# a reveal event from a field device is present in the tamper-evident server log
# after ttlMs, cached contact PII is purged on next app launch (native gate)
# PII does not render until device auth passes (native gate)
# on reported device loss, the reveal-log + offline bundle for deviceId = the PII-on-device inventory
# DPO assessment cites Art 34(3)(a) (encrypted + access-controlled => not notifiable)
```

## Anti-Patterns

1. Denying all PII to field roles (defeats the lawful call).
2. Obscuring the number via VoIP / never showing it (absurd; not GDPR's intent).
3. Sending a region-wide / bulk PII dump to the device.
4. Revealing PII without logging it.
5. Relying on a background JS timer for TTL (a killed app cannot run it) -- purge must
   be lazy / opportunistic.
6. Forcing workers offline -- online sync + live data is the preferred path.
7. Creating a WORKORDER before stakeholder confirmation.

## Compliance & Standards

This ADR's field-role edge protocol (contact-only PII, purpose-scoped sync, TTL, reveal-audit)
reinforces controls in the canonical Statement of Applicability:

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — A.1.4.5 (data minimisation), A.8.11 (data in transit), A.5.34 (privacy in the SDLC).

## Related ADRs

- **ADR-0061** -- GDPR erasure / retention; D5 mask-by-default (this ADR makes the
  field case *contact-only*, not merely masked).
- **ADR-0067** -- ISMS roadmap; this is the high-risk-role decomposition.
- **ADR-0073** -- mobile edge compliance; this ADR specifies the field-role policy
  within that framework (measures 2, 3, 5, 6 concretized + server part).
- **ADR-0007** -- audit via lifecycle events; the reveal log lands here.
- **ADR-0022** -- RBAC / `pii:read` policy (gates online reveals).
- **ADR-0068** -- lawful-basis register; the reveal `purpose` is recorded against it.
- **ADR-0072** -- breach / re-auth; device auth (S5) is its edge form.
- **ADR-0036** -- offline-first contract (background-fetch TTL sweep host).
- **ADR-0069** -- DPIA; the stakeholder review below is its field-input.
