# Information Security & Privacy Management System (ISMS / PIMS) — Rocky

> _sniffs_ The cow is already tagged, chipped, access-controlled, and tamper-evidently
> logged. What the auditor demands next is the **paper** that says we meant to.
> This document is that paper — written in the register of Brussels, so the territory
> may be held against the map.

| Document field | Value |
| --- | --- |
| **Title** | Information Security & Privacy Management System (ISMS / PIMS) — Rocky |
| **Reference** | ROCKY-ISMS-001 |
| **Version** | 1.0 (Phase 1 — harvest of existing enforcement) |
| **Status** | Adopted (engineering homework; **not** a conformity assessment) |
| **Owner** | Architecture Review (Docs Bot), co-owned with Validators / Authorization / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On Phase 2 completion (see ADR-0067) |
| **Related** | ADR-0061 (GDPR erasure/retention); ADR-0066 (Error Sovereignty); ADR-0030 (RuleSet); ADR-0054 (Regulatory); ADR-0007 (audit); ADR-0067 (ISMS roadmap); `apps/docs/content/compliance/iso27701-2025-gap-analysis.md` |

---

## Recitals

**Whereas** Rocky operates a livestock identification, movement, health and inspection
information system that processes the personal data of natural persons — keepers,
holders, farm operators, veterinarians and system users — within the jurisdictions
of North Macedonia and the Republic of Albania, and therefore falls within the
material scope of Regulation (EU) 2016/679 (GDPR) as transposed, and
of the local equivalents MK LPDP and AL Law 124;

**Whereas** the system enforces access control at the database tier through
Row-Level Security (pgPolicy), role-based access control, and a canonical
Principal resolved per session, thereby restricting every personal-data query to
the actor's lawful farm and tenant scope, and never to the raw table;

**Whereas** a single machine-readable source of truth — the PII Field Registry —
inventories and classifies every personal-data column across more than twenty
tables as `direct`, `indirect` or `derived`, and a mask-by-default projection
with a purpose-bound reveal-gate omits personal fields from any response
unless the caller holds `pii:read` and supplies a recorded purpose, so that
the cheapest breach is the one that never reaches the wire;

**Whereas** all state transitions emit tamper-evident lifecycle events recorded
in an append-only, hash-chained audit store, and domain services
communicate failure through a typed `Result<T,E>` monad rather than
leaking internal state to the client — the Real of failure is expressed as
typed error, not exception crossing the boundary;

**Whereas**, notwithstanding the foregoing technical enforcement, the organisation
has not yet issued a documented Information Security Management System
policy, recorded a lawful basis per processing activity, designated a
data-protection officer, nor established formal awareness training — the
**Symbolic** enforcement having been constructed in advance of the **Imaginary**
commitment, in the dialectical inverse of the typical failing organisation;

**Whereas** ISO/IEC 27001:2022 establishes the requirements for an
information security management system, and ISO/IEC 27701:2025 extends
those requirements with privacy-specific controls for controllers and processors;

**Whereas** this document constitutes **engineering homework and not legal advice**,
and the per-control GDPR mappings contained in the source standards are
machine-derived and require confirmation by counsel competent in both
technology and data-protection law before any claim of conformity is made;

**Whereas** the Statement of Applicability herein records, for each control,
the implemented mechanism, its status (Implemented / Partial / Planned),
and the supporting evidence, so that the map and the territory are held side
by side rather than confused;

**Whereas** Phase 1 consists of documenting the enforcement already in
operation; Phase 2 consists of the governance layer — policy, lawful
basis, consent, data-protection impact assessment, records of processing,
officer designation, awareness, supplier agreements, cryptography at rest,
breach workflow, and enforced retention and erasure; Phase 3 consists of
independent audit and certification;

**Whereas** the controls already implemented satisfy a substantial portion of
Annex A of ISO/IEC 27001:2022 and of the normative PIMS tables of
ISO/IEC 27701:2025, and the residual gaps are, overwhelmingly,
governance-layer rather than code;

**Whereas** the graphgrc engine from which the source standards were
extracted will not build in this environment and its local data files are
orphaned by its own generator, and therefore only the validated cross-walk
and the per-control mappings were ingested, as homework and not as authority;

**Whereas**, in accordance with the foregoing, the organisation ADOPTS the
following Information Security & Privacy Management System.

---

## Article 1 — Subject matter and objectives

This Management System establishes, implements, maintains and continually
improves a coordinated set of controls that secure the confidentiality,
integrity and availability of information, and protect the personal data
processed by the Rocky system, consistent with the requirements of
ISO/IEC 27001:2022 and ISO/IEC 27701:2025 as read through the
local equivalents MK LPDP and AL Law 124.

## Article 2 — Scope

The System applies to all information-processing facilities, applications and
services comprising Rocky, and to all personal data of natural persons
processed therein. Out of direct scope for Phase 1: physical perimeters
(hosted by the cloud provider), formal supplier data-processing agreements
(with Better Auth and analogous processors), and international-transfer
safeguards (the data is domestic to North Macedonia and Albania). These
are recorded as Planned in the Statement of Applicability and scheduled
under ADR-0067 Phase 2 / Phase 3.

## Article 3 — Leadership commitment

Top management commits to the policy set out in this document and to the
allocation of the resources necessary for its operation. _(Formal sign-off
and the appointment of a named owner are recorded as Phase 2 actions under
ADR-0067 G1 / G9; the commitment is declared here in advance of the
ink.)_ The organisation further commits to continual improvement of the
System and to making the System available to relevant interested parties
on request.

## Article 4 — Control objectives and implementation

The control objectives and the implemented mechanisms are set out in the
Statement of Applicability below, which comprises:

- **Annex A** — ISO/IEC 27001:2022, Annex A (93 controls across
  Organisational, People, Physical and Technological blocks); and
- **Annex B** — ISO/IEC 27701:2025, normative PIMS tables
  (A.1 controllers, A.2 processors, A.3 controllers and processors).

Each entry states the control, the mechanism already operating in Rocky,
its status, and the evidence. Status is one of:

- **Implemented** — enforced by running code today;
- **Partial** — present and to be wrapped or formalised;
- **Planned** — absent; a governance-layer procedure, scheduled under
  ADR-0067 Phase 2 / Phase 3.

---

**Statement of Applicability (SoA) — 158 normative controls**

- **Implemented (code enforces today):** 31
- **Partial (present, to be wrapped/formalised):** 11
- **Planned (governance layer, ADR-0067 Phase 2):** 116

The distribution is the dialectical inverse of the typical failing organisation: Rocky has built the *Symbolic* enforcement machinery (RLS, RBAC, a PII inventory, mask-by-default, tamper-evident logging, Result sovereignty) while the *Imaginary* commitment (the documented ISMS, the trained workforce, the designated officer) and the certified *Real* (the independent audit) remain Phase 2 work.


### A.5 - Organizational Controls

| Ref | Control | Rocky implementation | Status | Evidence |
| --- | --- | --- | --- | --- |
| A.5.1 | Policies for information security | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.10 | Acceptable use of information and other associated assets | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.11 | Return of assets | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.12 | Classification of information | Each PII field is assigned a category (direct / indirect / derived), effecting classification of personal information. | **IMPLEMENTED** | pii-field-registry.ts |
| A.5.13 | Labelling of information | The registry's `type` field (name/contact/nationalId/geo/linkage/derived) labells each asset by sensitivity class. | **IMPLEMENTED** | pii-field-registry.ts |
| A.5.14 | Information transfer | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.15 | Access control | Row-Level Security enforced via pgPolicy + the ExecutionPipeline RLSStage binds every query to the actor's farm/tenant scope. | **IMPLEMENTED** | packages/database (RLS policies); ADR-0006; packages/execution |
| A.5.16 | Identity management | Better Auth resolves a canonical Principal (subject/role/admin) per session; identity is centralised, not per-app. | **IMPLEMENTED** | packages/auth; ADR-0021 |
| A.5.17 | Authentication information | Better Auth issues signed session cookies; authentication material is managed, rotated and bound to the device. | **IMPLEMENTED** | packages/auth; ADR-0021 |
| A.5.18 | Access rights | Authorization Bot: Principal + PolicyRegistry + PolicyEngine evaluate action/role/admin at every router boundary. | **IMPLEMENTED** | packages/authorization; ADR-0022 |
| A.5.19 | Information security in supplier relationships | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.2 | Information security roles and responsibilities | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.20 | Addressing information security within supplier agreements | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.21 | Managing information security in the information and communication technology (ICT) supply chain | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.22 | Monitoring, review and change management of supplier services | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.23 | Information security for use of cloud services | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.24 | Information security incident management planning and preparation | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.25 | Assessment and decision on information security events | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.26 | Response to information security incidents | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.27 | Learning from information security incidents | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.28 | Collection of evidence | The tamper-evident access log records actor (anonymised salted hash), table+entity reference, column, purpose, decision and an Ed25519 hash-chain over prior entries. | **IMPLEMENTED** | ADR-0061 reveal-gate; event-emitter |
| A.5.29 | Information security during disruption | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.3 | Segregation of duties | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.30 | ICT readiness for business continuity | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.31 | Legal, statutory, regulatory and contractual requirements | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.32 | Intellectual property rights | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.33 | Protection of records | Records (audit log, PII registry) are protected by RLS + the append-only, hash-chained store. | **IMPLEMENTED** | ADR-0007; piiaudit log |
| A.5.34 | Privacy and protection of personal identifiable information (PII) | Privacy of PII is protected by the registry (single source of truth for 'what is PII'), mask-by-default and the reveal-gate. | **IMPLEMENTED** | ADR-0061; piiaudit log |
| A.5.35 | Independent review of information security | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.36 | Compliance with policies, rules and standards for information security | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.37 | Documented operating procedures | Operating procedures exist as AGENTS.md (RobotFarm contracts) and the Diamond Seal doctrine; they are not yet packaged as a signed ISMS procedure set. | **PARTIAL** | AGENTS.md; ADR-0011 |
| A.5.4 | Management responsibilities | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.5 | Contact with authorities | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.6 | Contact with special interest groups | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.7 | Threat intelligence | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.8 | Information security in project management | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.5.9 | Inventory of information and other associated assets | PII_FIELD_REGISTRY enumerates every personal-data column (50+ fields across 20+ tables) as the formal information-asset inventory. | **IMPLEMENTED** | packages/validators/src/pii/pii-field-registry.ts; ADR-0061 D1 |

### A.6 - People Controls

| Ref | Control | Rocky implementation | Status | Evidence |
| --- | --- | --- | --- | --- |
| A.6.1 | Screening | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.6.2 | Terms and conditions of employment | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.6.3 | Information security awareness, education and training | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.6.4 | Disciplinary process | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.6.5 | Responsibilities after termination or change of employment | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.6.6 | Confidentiality or non-disclosure agreements | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.6.7 | Remote working | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.6.8 | Information security event reporting | Security events are emitted as lifecycle events and written to the tamper-evident log; a formal reporting workflow to a named function is pending. | **PARTIAL** | ADR-0007; event-emitter |

### A.7 - Physical Controls

| Ref | Control | Rocky implementation | Status | Evidence |
| --- | --- | --- | --- | --- |
| A.7.1 | Physical security perimeters | Logical access to assets is secured (RLS/RBAC); physical perimeters are the responsibility of the hosting/cloud provider and are out of Rocky's direct control. | **PARTIAL** | Hosting provider SoW; ADR-0003 |
| A.7.10 | Storage media | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.11 | Supporting utilities | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.12 | Cabling security | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.13 | Equipment maintenance | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.14 | Secure disposal or re-use of equipment | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.2 | Physical entry | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.3 | Securing offices, rooms and facilities | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.4 | Physical security monitoring | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.5 | Protecting against physical and environmental threats | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.6 | Working in secure areas | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.7 | Clear desk and clear screen | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.8 | Equipment siting and protection | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.7.9 | Security of assets off-premises | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |

### A.8 - Technological Controls

| Ref | Control | Rocky implementation | Status | Evidence |
| --- | --- | --- | --- | --- |
| A.8.1 | User end point devices | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.10 | Information deletion | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.11 | Data masking | Data masking is the default: the API projection layer omits `defaultExcluded` columns unless the caller holds pii:read and supplies a purpose; the mobile UI blurs even what is sent. | **IMPLEMENTED** | ADR-0061 D5; piiaudit log |
| A.8.12 | Data leakage prevention | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.13 | Information backup | Database state is reproducible via the recreate script (schema regenerate + idempotent seed); a formal backup/restore SLA is pending. | **PARTIAL** | scripts/db-recreate.sh |
| A.8.14 | Redundancy of information processing facilities | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.15 | Logging | Audit lifecycle events are emitted for every state transition and persisted to the tamper-evident log. | **IMPLEMENTED** | ADR-0007; event-emitter |
| A.8.16 | Monitoring activities | Monitoring is effected through the Result/Error-Sovereignty boundary: domain services return typed Result<T,E>; the router maps failures to TRPCError, never leaking internals. | **IMPLEMENTED** | ADR-0066; packages/domains/shared/result.ts |
| A.8.17 | Clock synchronization | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.18 | Use of privileged utility programs | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.19 | Installation of software on operational systems | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.2 | Privileged access rights | Privileged (admin/SUPER_ADMIN) and per-farm access are separated via RoleBot roles + RLS scoping. | **IMPLEMENTED** | packages/authorization; ADR-0022 |
| A.8.20 | Networks security | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.21 | Security of network services | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.22 | Segregation of networks | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.23 | Web filtering | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.24 | Use of cryptography | Cryptography at rest (envelope encryption, off-server KEK) is designed but PAUSED pending key-custody decision. | **PLANNED** | ADR-0061 (Phase 2); ADR-0067 G5 |
| A.8.25 | Secure development life cycle | Secure development is enforced by the Diamond Seal: every API schema claims a Dumb Zod, every router output is typed, NoDrift CI checks block schema drift. | **IMPLEMENTED** | packages/validators; ADR-0018/0019 |
| A.8.26 | Application security requirements | Security requirements are expressed as Zod schemas and ADR contracts reviewed before merge. | **IMPLEMENTED** | ADR-0018; AGENTS.md |
| A.8.27 | Secure system architecture and engineering principles | Secure architecture is the RobotFarm contract chain: every edit re-reads the owning AGENTS.md; RLS is the enforced isolation boundary. | **IMPLEMENTED** | AGENTS.md; packages/database RLS |
| A.8.28 | Secure coding | Coding standards are enforced via AGENTS.md conventions (no console.log, Result monad, satisfies on schemas). | **IMPLEMENTED** | AGENTS.md |
| A.8.29 | Security testing in development and acceptance | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.3 | Information access restriction | Information access is restricted by RLS predicates and by mask-by-default projection (fields omitted unless pii:read+purpose). | **IMPLEMENTED** | ADR-0006; ADR-0061 D5 |
| A.8.30 | Outsourced development | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.31 | Separation of development, test and production environments | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.32 | Change management | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.33 | Test information | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.34 | Protection of information systems during audit testing | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.4 | Access to source code | Source-code access is controlled via the repository platform and AGENTS.md review rules; a formal access-approval record is pending. | **PARTIAL** | AGENTS.md |
| A.8.5 | Secure authentication | Better Auth provides secure authentication (signed cookies, expo origin binding, password reset flows). | **IMPLEMENTED** | packages/auth; ADR-0021; ADR-email/password |
| A.8.6 | Capacity management | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.7 | Protection against malware | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.8 | Management of technical vulnerabilities | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.8.9 | Configuration management | Configuration is managed through typed Zod schemas + the Diamond Seal NoDrift guillotine; a change-authorisation register is pending. | **PARTIAL** | packages/validators; ADR-0018 |

### Table A.1 - Control objectives and controls for PII controllers

| Ref | Control | Rocky implementation | Status | Evidence |
| --- | --- | --- | --- | --- |
| A.1.2.2 | Identify and document purpose | Processing purposes are captured at the point of reveal (the reveal-gate requires a stated purpose); a central purpose register is pending. | **PARTIAL** | ADR-0061 reveal-gate; ADR-0067 G1 |
| A.1.2.3 | Identify lawful basis | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.2.4 | Determine when and how consent is to be obtained | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.2.5 | Obtain and record consent | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.2.6 | Privacy impact assessment | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.2.7 | Contracts with PII processors | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.2.8 | Joint PII controller | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.2.9 | Records related to processing PII | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.2 | Determining and fulfilling obligations to PII principals | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.3 | Determining information for PII principals | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.4 | Providing information to PII principals | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.5 | Providing mechanism to modify or withdraw consent | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.6 | Providing mechanism to object to PII processing | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.7 | Access, correction or erasure | Access/correction is served by the registry + reveal-gate; erasure (deletion/crypto-shred) is deferred to ADR-0061 Phase 2. | **PARTIAL** | ADR-0061 D5 + Phase 2 |
| A.1.3.8 | PII controllers' obligations to inform third parties | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.9 | Providing copy of PII processed | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.10 | Handling requests | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.3.11 | Automated decision making | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.4.2 | Limit collection | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.4.3 | Limit processing | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.4.4 | Accuracy and quality | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.4.5 | PII minimization objectives | Minimisation is enforced by mask-by-default: only non-excluded fields reach the wire. | **IMPLEMENTED** | ADR-0061 D5 |
| A.1.4.6 | PII de-identification and deletion at the end of processing | De-identification is effected by masking + the anonymised audit reference; full cryptographic erasure is Phase 2. | **PARTIAL** | ADR-0061 D5 + Phase 2 |
| A.1.4.7 | Temporary files | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.4.8 | Retention | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.4.9 | Disposal | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.4.10 | PII transmission controls | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.5.2 | Identify basis for PII transfer between jurisdictions | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.5.3 | Countries and international organizations to which PII can be transferred | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.5.4 | Records of transfer of PII | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.1.5.5 | Records of PII disclosures to third parties | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |

### Table A.2 - Control objectives and controls for PII processors

| Ref | Control | Rocky implementation | Status | Evidence |
| --- | --- | --- | --- | --- |
| A.2.2.2 | Customer agreement | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.2.2.3 | Organization's purposes | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.2.2.4 | Marketing and advertising use | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.2.2.5 | Infringing instruction | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.2.2.6 | Customer obligations | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.2.2.7 | Records related to processing PII | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.2.3.2 | Comply with obligations to PII principals | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |

### Table A.3 - Control objectives and controls for PII controllers and PII processors

| Ref | Control | Rocky implementation | Status | Evidence |
| --- | --- | --- | --- | --- |
| A.3.5 | Classification of information | Classification of PII is the registry category field. | **IMPLEMENTED** | pii-field-registry.ts |
| A.3.6 | Labelling of information | Labelling is the registry `type` field. | **IMPLEMENTED** | pii-field-registry.ts |
| A.3.7 | Information transfer | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.8 | Identity management | Identity management = Better Auth Principal resolution. | **IMPLEMENTED** | packages/auth; ADR-0021 |
| A.3.9 | Access rights | Access rights = RLS + Authorization Bot policy evaluation. | **IMPLEMENTED** | packages/authorization; ADR-0006 |
| A.3.10 | Addressing information security within supplier agreements | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.11 | Information security incident management planning and preparation | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.12 | Response to information security incidents | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.13 | Legal, statutory, regulatory and contractual requirements | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.14 | Protection of records | Records protected by the append-only, hash-chained audit store. | **IMPLEMENTED** | ADR-0007; piiaudit log |
| A.3.15 | Independent review of information security | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.16 | Compliance with policies, rules and standards for information security | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.17 | Information security awareness, education and training | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.18 | Confidentiality or non-disclosure agreements | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.19 | Clear desk and clear screen | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.20 | Storage media | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.21 | Secure disposal or re-use of equipment | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.22 | User endpoint devices | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |
| A.3.23 | Secure authentication | Authentication = Better Auth secure session. | **IMPLEMENTED** | packages/auth |
| A.3.24 | Information backup | Backup via recreate script; formal SLA pending. | **PARTIAL** | scripts/db-recreate.sh |
| A.3.25 | Logging | Logging = tamper-evident audit lifecycle events. | **IMPLEMENTED** | ADR-0007; ADR-0061 reveal-gate |
| A.3.26 | Use of cryptography | Cryptography at rest paused (key custody). | **PLANNED** | ADR-0061 P2; ADR-0067 G5 |
| A.3.27 | Secure development life cycle | Secure architecture = RobotFarm AGENTS.md contract chain. | **IMPLEMENTED** | AGENTS.md |
| A.3.28 | Application security requirements | Application security = typed Zod + Result boundaries. | **IMPLEMENTED** | ADR-0018; ADR-0066 |
| A.3.29 | Secure system architecture and engineering principles | Secure engineering = Diamond Seal NoDrift guillotine. | **IMPLEMENTED** | ADR-0011; packages/validators |
| A.3.30 | Outsourced development | Outsourced development (Better Auth SaaS) is used; a formal supplier security assessment is pending. | **PARTIAL** | ADR-0067 G7 |
| A.3.31 | Test information | Governance-layer control. ISMS procedure to be issued per ADR-0067 Phase 2 (P2). | **PLANNED** | ADR-0067 Decision P2 |