# Data Processing Agreement (DPA) — Rocky

> _sniffs_ The cow is tagged; the data is processed; the law (GDPR Art 28, MK LPDP Art 28)
> demands a _written_ contract before a German buyer's DPO will even open the rest of the
> packet. This is that contract — a fillable Art 28(3) template. Rocky is the processor
> (and a sub-processor in the customer's chain); the customer is the controller.

| Document field | Value |
| --- | --- |
| **Title** | Data Processing Agreement (DPA) — Rocky |
| **Reference** | ROCKY-DPA-001 |
| **Version** | 0.1.0-draft (template; controller-specific terms pending) |
| **Status** | Draft — template ready; execution per customer / DPO sign-off |
| **Owner** | Docs Bot, co-owned with Authorization / Execution Bots |
| **Classification** | External — Controller-facing (executed copy) |
| **Governs** | ADR-0075 (Processor & Subprocessor Management); rocky-processor-register.md; rocky-toms.md; rocky-breach-notification-procedure.md |

## 1. Parties

- **Controller:** {{Customer Legal Name}}, {{Address}}, represented by {{Signatory}} (the "Controller").
- **Processor:** Rocky ({{Rocky Legal Entity}}, {{Address}}), the "Processor".
- Where the Processor engages further sub-processors, the Processor acts as controller
  relative to them and as processor relative to the Controller (see §6 + rocky-processor-register.md).

## 2. Subject matter & duration (Art 28(3)(a))

- **Subject matter:** operation of the Rocky livestock / cattle-passport platform
  (registration, movement, passport, inspection, health, ear-tag, archive domains).
- **Duration:** for the term of the {{Master Agreement}}, and thereafter until deletion per §9.

## 3. Nature, purpose & processing (Art 28(3)(a))

- **Nature/purpose:** {{describe}} — provision of the Rocky SaaS to the Controller's
  farms / competent authority.
- **Types of personal data:** farmer/keeper identity, contact, role; animal-linked PII
  (ear-tag, passport, movement history); where the Health domain is used, special-category
  health data (see ROCKY-DPIA-001).
- **Categories of data subjects:** farmers/keepers, farm staff, competent-authority
  inspectors, (indirectly) animal owners.
- **Special-category data:** {{Yes/No}} — if Yes, a DPIA (ROCKY-DPIA-001) is required before processing.

## 4. Controller instructions (Art 28(3)(a))

The Processor processes only on the Controller's documented instructions, including on
international transfer and sub-processor engagement (§6). Deviations require prior written
authorization.

## 5. Processor obligations (Art 28(3)(b)–(h))

- **(b) Confidentiality** — personnel bound by confidentiality; access least-privilege (RBAC, Authorization Bot).
- **(c) Security** — implements the TOMs in rocky-toms.md (Art 32): RLS + RBAC (0006),
  crypto-at-rest (0071), tamper-evident audit (0007/0066), Cloudflare Access (0083),
  PAdES-sealed + offline-verifiable documents (0082/0084).
- **(d) Sub-processors** — engaged only under Art 28(2)/(4) + written terms; register at
  rocky-processor-register.md; Controller informed of additions/removals.
- **(e) Assistance** — assists the Controller with Art 32 (security) and Art 36 (DPIA) via the procedures named herein.
- **(f) Rights of data subjects** — assists the Controller with DSR (rocky-dsr-procedure.md).
- **(g) Deletion/return** — on termination, deletes or returns per §9 + rocky-erasure-retention-procedure.md.
- **(h) Audit** — makes available all information necessary to demonstrate compliance and allows audits/inspections (see §7).

## 6. Sub-processors (Art 28(2)/(4))

Current sub-processors: see rocky-processor-register.md (e.g., hosting/DB, tunnel/Access
provider). The Processor notifies the Controller of intended changes, affording an opportunity
to object. Each sub-processor is bound by equivalent Art 28 terms.

## 7. Audit & information rights

The Controller may audit once per {{12}} months (or on evidence of non-compliance) with
{{30}} days' notice; the Processor provides the procedures + evidence artifacts
(RoPA, TOMs, breach log, signed-document proofs) referenced herein.

## 8. International transfers

Transfers outside the EEA are governed by {{SCCs / adequacy decision}} per rocky-international-transfer-assessment.md.

## 9. Termination, deletion & return

On termination, Personal Data is deleted per rocky-erasure-retention-procedure.md unless law
requires retention (e.g., ADR-0061 mandatory-retention carve-outs).

## 10. Breach notification (Art 33)

The Processor notifies the Controller without undue delay and in any event within
{{72}} hours of becoming aware, per rocky-breach-notification-procedure.md.

## 11. Signatures

| Controller | Processor (Rocky) |
| --- | --- |
| Name: {{}} | Name: {{}} |
| Title: {{}} | Title: {{}} |
| Date: {{}} | Date: {{}} |
