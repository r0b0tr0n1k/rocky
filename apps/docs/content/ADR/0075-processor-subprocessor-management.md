# ADR-0075: Processor & Subprocessor Management (GDPR Art 28(4) / MK LPDP Art 28 / ISO 27701 B.5.2.1 + B.2.2.1)

> The builder of the tool is not the master of the data. We are a subprocessor in the chain;
> the chain itself is what the law demands we govern.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status** | Proposed |
| **Phase**  | Phase 2 -- governance, pending expert review |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Compliance homework)                                    |
| **Supersedes** | — |
| **Superseded** | — |
| **Source**     | User clarification (subprocessor position); GDPR Art 28(4); MK LPDP Art 28; ISO/IEC 27701:2025 B.5.2.1, B.2.2.1; ADR-0067 |
| **Related**    | ADR-0067 (ISMS roadmap); ADR-0061 (GDPR spine); ADR-0072 (breach); ADR-0054 (regulatory); rocky-dpa.md (Art 28 DPA template); eu-b2b-procurement-pack.md |

## Context

Rocky is **built by us (the developer) and operated by a controller** -- the VD / veterinary
administration that offers the service to data subjects (farmers, keepers, vets). As the user
stated: *"if I create this software I'm a subprocessor, I'm not the one that provides the service."*

That places us **not as the controller** but inside the processing chain:

```
data subject
   -> controller        (VD / service operator -- owns purposes + means, Art 25 by-design)
      -> processor       (host / operator of Rocky, if distinct from the VD)
         -> subprocessor (us -- we build + may host Rocky)        [B.2.2.1 processor obligations]
            -> subprocessors (cloud host, KMS/vault, SaaS)        [B.5.2.1 subcontractor authorization]
```

The law mandates the chain be contracted end-to-end:

- **GDPR Art 28(4)** -- a processor may engage a subprocessor only with the controller's
  *prior specific or general written authorization*, and the subprocessor contract imposes
  the same data-protection obligations (Art 28(3)) downstream.
- **MK LPDP Art 28** -- the national equivalent: responsibility of the controller
  (data-protection-by-design/default, analogous to GDPR Art 25); the controller must ensure
  its processors/subprocessors are bound by contract.
- **ISO/IEC 27701:2025 B.2.2.1** -- processor obligation requirements (the PIMS control that
  expresses Art 28(3) for the processor/subprocessor link).
- **ISO/IEC 27701:2025 B.5.2.1** -- subcontractor authorization requirements (the PIMS control
  that expresses Art 28(4) for engaging subprocessors).

These are **mandated**, not optional (the user confirmed: "Yes it does").

## Decision

**Maintain a processor / subprocessor register + an Art 28 DPA library, and bind every link in
the chain by written contract before any personal data is processed.**

1. **Identity of parties (who owns each link).**
   - The **controller** is the VD / service operator -- *not us*. They carry MK LPDP Art 28 /
     GDPR Art 25(1) by-design and the top of the Art 28(4) authorization.
   - **We (the builder)** are the subprocessor: we owe **processor obligations** to the
     controller (B.2.2.1 / Art 28(3)) and we manage **our own subprocessors** (B.5.2.1 / Art 28(4)).
2. **Our downstream subprocessors (inventory, TBD before sign-off):** the cloud / hosting
   provider (DB + app + the off-server vault/KMS from ADR-0071), any managed KMS, any SaaS
   (email/analytics, if any). Each gets an **Art 28 DPA** before processing.
3. **Rocky must be able to SUPPORT the controller's Art 28 chain** -- record processor /
   subprocessor relationships + produce the evidence a DPA audit expects (the software is the
   subprocessor's tool; the DPA signing is organizational, not code).
4. **No processing without a signed DPA.** The Art 28(4) "prior authorization" is the gate.

## Consequences

### Positive

- Turns the four mandated clauses into an implementable procedure (register + DPA library).
- Correctly locates accountability: the controller (VD) owns by-design; we own our link + our
  subprocessors. No false claim of being the controller.

### Negative / Cost

- Organizational work: enumerate subprocessors, negotiate Art 28 DPAs (legal, not code).
- Requires counsel review of each DPA (the mappings in ADR-0067 are unverified).

### Neutral

- Sits beside (not inside) the enforcement code; complements ADR-0061 / 0072.

## Implementation

- Owning Bot: **Docs Bot** (register + DPA procedure) + **Organization / Legal** (DPA signing,
  not a code bot) + **Validators Bot** (record schema if the register is machine-readable).
- RobotFarm pass: add a WO (Phase 2 governance -- processor/subprocessor register + DPA library)
  to WORKORDER on user direction; update Bot descriptions in root AGENTS.md.
- This ADR is the Phase-2 decomposition of ADR-0067 (the "supplier/processor agreements" gap).

## Verification (Definition of Done)

```bash
# a processor/subprocessor register artifact exists
ls apps/docs/content/compliance/processor-register.md
# every listed subprocessor has an Art 28 DPA reference
rg -n "Art 28|DPA|subprocessor" apps/docs/content/compliance/processor-register.md
# ADR-0067 cites this ADR
rg -n "ADR-0075" 0067-*.md
```

## Anti-Patterns

1. **Claiming to be the controller** when we are the subprocessor -- mislocates accountability.
2. **Processing before a signed DPA** -- violates Art 28(4) prior-authorization.
3. **Inventing regulatory literals** in code -- cite the clauses in docs; pull canonical IDs
   from the compliance module, do not hardcode.
4. Treating the DPA as the software's job -- signing is organizational; the software supports it.

## Related ADRs

- **ADR-0067** -- ISMS roadmap; this ADR closes the "supplier/processor agreements" gap (A.2 / B.5.2.1 / B.2.2.1).
- **ADR-0061** -- GDPR spine; the register feeds RoPA (ADR-0070).
- **ADR-0072** -- breach; a subprocessor breach flows up to the controller's notification.
- **ADR-0054** -- Regulatory Compliance Framework; the legal spine.
- **ADR-0071** -- the off-server vault/KMS is one of our subprocessors.
