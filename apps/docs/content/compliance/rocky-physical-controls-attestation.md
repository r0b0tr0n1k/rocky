---
title: Physical & Environmental Controls Attestation
sidebarTitle: Physical Controls Attestation
---

# Physical & Environmental Controls Attestation — Rocky

> _sniffs_ Rocky does not own a server room. The physical perimeter — fences,
> cameras, generators, cooling — is the hosting/cloud provider's responsibility
> under a shared-responsibility model. This document records that fact and pins
> the inherited-control evidence to a provider attestation we shall obtain.

| Document field | Value |
| --- | --- |
| **Title** | Physical & Environmental Controls Attestation — Rocky |
| **Reference** | ROCKY-PHY-001 |
| **Version** | 0.1.0-draft (shared-responsibility statement; attestation to be obtained) |
| **Status** | Draft — provider responsibility stated; attestation placeholder attached |
| **Owner** | Docs Bot, co-owned with Execution Bot |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0103 acceptance; attestation refreshed on provider re-certification |
| **Related** | ADR-0103 (governing, A.7._); ADR-0003 (ExecutionPipeline environment stages); ADR-0067 (ISMS roadmap); [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md) (A.7._) |

---

## 1. Purpose

This attestation records Rocky's position on the physical and environmental controls of Annex A.7
(Physical controls). It states the shared-responsibility model under which those controls are
delivered by the hosting/cloud provider, and it pins the inherited-control evidence to a provider
attestation to be obtained and maintained.

## 2. Scope

- **In scope:** the physical and environmental controls of A.7 — perimeters, entry, offices/facilities,
  utilities, cabling, equipment, media, off-premises assets, clear-desk/clear-screen, environmental
  threats, secure areas, monitoring.
- **Out of scope:** logical/technical controls (those are implemented in Rocky and recorded elsewhere
  in ROCKY-ISMS-001). This document addresses only the **physical** layer.

## 3. Terms and definitions

- **shared-responsibility model** — the division under which the cloud/hosting provider is responsible
  for the security of the cloud (the physical estate) and the customer is responsible for security in
  the cloud (configuration, identity, data).
- **inherited control** — a control whose implementation and evidence are provided by the supplier and
  adopted by Rocky without re-implementation.
- **provider attestation** — a third-party certification (ISO/IEC 27001 / SOC 2 Type II) issued to the
  hosting/cloud provider.

## 4. Normative references

- ISO/IEC 27001:2022 — Annex A.7 (Physical controls).
- ISO/IEC 17788 / ISO/IEC 22123 — cloud computing vocabulary and reference architecture (the
  shared-responsibility context).
- ADR-0103 — the governing decision for this attestation.
- ADR-0003 — ExecutionPipeline (environment stages; the boundary at which provider physical care ends
  and Rocky's logical control begins).
- ADR-0067 — ISMS Posture roadmap (Phase 2 governance).

## 5. Shared-responsibility statement

Table 1 sets out the division. Rocky shall rely on the provider for the physical estate and shall
evidence that reliance through the attestation in Clause 6.

| Layer | Responsibility | Evidence |
| --- | --- | --- |
| Physical perimeter, entry, facilities, utilities, cabling, environmental threats | Hosting/cloud provider | Provider ISO/IEC 27001 / SOC 2 attestation (Clause 6) |
| Equipment siting, media, off-premises assets (provider-managed) | Hosting/cloud provider | Provider attestation |
| Logical access, configuration, identity, data classification | Rocky | ROCKY-ISMS-001 (RLS/RBAC, ADR-0006 / ADR-0022) |

**Table 1 — Physical-control shared-responsibility division**

## 6. Provider attestation (to be obtained)

Rocky shall obtain and retain the current **ISO/IEC 27001** certificate and/or **SOC 2 Type II** report
for the hosting/cloud provider. Until that artifact is collected, this is a **placeholder**:

> **[PROVIDER ATTESTATION PLACEHOLDER]** — attach the provider's current ISO/IEC 27001 certificate
> and/or SOC 2 Type II report here, with the certification period and the in-scope data-centre
> locations. This document shall not claim an attestation that has not been collected.

The attestation shall be refreshed on each provider re-certification and its reference date recorded in
this document.

## 7. Relationship to the Statement of Applicability

Control **A.7.1** (Physical security perimeters) in ROCKY-ISMS-001 is recorded as **PARTIAL** on the
basis of provider responsibility; this attestation is added as its evidence and extends the
provider-responsibility position to the whole A.7 block. The remaining A.7 controls remain **PLANNED**
pending the collected attestation; this document makes the PARTIAL control defensible and states the
path for the rest. The in-scope jurisdiction for Rocky remains **North Macedonia (MK LPDP)**; Albanian
Law 124 is out of scope for this conformity claim and is not referenced here.

## 8. Bibliography

- ISO/IEC 27001:2022 — Information security management systems — Requirements (Annex A.7).
- ISO/IEC 17788 — Information technology — Cloud computing — Overview and vocabulary.
- ISO/IEC 22123 — Information technology — Cloud computing — Reference architecture.
- ADR-0103 — Physical & Environmental Controls Attestation (governing).
- ADR-0003 — ExecutionPipeline (environment stages).
- ADR-0067 — ISMS Posture & ISO 27001 / ISO 27701:2025 Conformity Roadmap.
- [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md).
