# ADR-0103: Physical & Environmental Controls Attestation — A.7.*

> Rocky does not own a server room. The physical perimeter is the hosting/cloud
> provider's under a shared-responsibility model. This ADR records that fact and
> pins the inherited-control evidence to a provider attestation we shall obtain —
> it does not claim physical controls Rocky does not operate.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The physical and environmental controls of Annex A.7 were recorded as **PARTIAL** (A.7.1, on the basis
of provider responsibility) or **PLANNED** in ROCKY-ISMS-001. Rocky is a software system deployed on a
hosting/cloud provider; it operates no physical perimeter, server room, or utility plant of its own.
Claiming those controls as implemented would be a fabrication. Under a shared-responsibility model the
physical estate is the provider's, and Rocky's evidence is the provider's third-party attestation
(ISO/IEC 27001 / SOC 2). That attestation had not been collected or recorded, leaving the A.7 position
unbacked.

## Decision

1. Author **ROCKY-PHY-001** (Physical & Environmental Controls Attestation) stating the
   shared-responsibility division (Table 1) and pinning the inherited-control evidence to a provider
   attestation to be obtained and maintained.
2. The attestation is recorded as a **placeholder** until collected; the document shall not claim an
   attestation that does not exist. Albanian Law 124 is explicitly out of scope; the in-scope
   jurisdiction remains North Macedonia (MK LPDP).
3. The SoA row A.7.1 (PARTIAL) receives ROCKY-PHY-001 as evidence and the provider-responsibility
   position is extended to the whole A.7 block. The remaining A.7 controls stay **PLANNED** pending the
   collected attestation. No A.7 control is flipped to IMPLEMENTED by this ADR.

## Consequences

### Positive

- A.7.1 becomes defensible as PARTIAL with an explicit shared-responsibility statement and a concrete
  evidence path (the provider attestation).
- The honesty bar is held: no physical control is claimed that Rocky does not operate.

### Negative / Cost

- A provider attestation to obtain and refresh on re-certification — a recurring governance task.

### Neutral

- No code change; this is a documentation/governance artifact only.

## Implementation

- **Owning Bot:** Docs Bot, co-owned with Execution Bot (ADR-0033 §D5).
- RobotFarm pass: filed under the compliance/standards layer; the ExecutionPipeline environment stages
  (ADR-0003) are the boundary at which provider physical care ends and Rocky's logical control begins.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/rocky-physical-controls-attestation.md   # exists
rg -n "A.7.1" apps/docs/content/compliance/isms-policy.md                # SoA row cites ROCKY-PHY-001
rg -n "ADR-0003" apps/docs/content/ADR/0103-isms-physical-controls-attestation.md   # environment-boundary dep cited
```

## Anti-Patterns (do not repeat)

1. Claiming Rocky operates physical perimeters — it does not; the provider does (shared responsibility).
2. Fabricating an attestation that has not been collected — keep the placeholder until obtained.
3. Referencing Albanian Law 124 — it is out of scope; MK LPDP is the in-scope jurisdiction.

## Related ADRs

- **ADR-0003** — ExecutionPipeline (environment stages; the boundary of provider responsibility).
- **ADR-0067** — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
- **ADR-0061** — PII erasure/retention (logical controls; distinct from the physical layer).

## Compliance & Standards

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — controls A.7.* (Physical controls).
- [Physical & Environmental Controls Attestation — ROCKY-PHY-001](../compliance/rocky-physical-controls-attestation.md) — the attestation this ADR governs.
