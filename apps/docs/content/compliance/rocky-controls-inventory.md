---
document_title: "Rocky — As-Built Security & Privacy Controls Inventory"
document_title_mk: "Роки — Инвентар на имплементирани контроли за безбедност и приватност"
document_identifier: "ROCKY-INV-001"
version_number: "0.1.0-draft"
date_of_issue: "2026-07-11"
author_organization: "RobotFarm / Architecture Review"
document_type: "As-Built Inventory (not a conformity assessment)"
scope: "Technical security & privacy controls implemented in the Rocky platform as of this revision"
purpose: >
  Record what Rocky actually ships today — the concrete, implemented controls —
  and point each to its standards mapping. This is the as-built register that
  underpins the ISMS policy (ROCKY-ISMS-001, Adopted) and the gap analysis.
  It is the starting point for documentation: we describe the Real before the Ideal.
applicability: "All Rocky packages and apps (api, web, mob, domains, shared packages)"
references:
  - "ROCKY-ISMS-001 (isms-policy.md) — Adopted ISMS posture"
  - "iso27701-2025-gap-analysis.md — MET / PENDING posture"
  - "MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md — clause crosswalk"
  - "Standardization/iso27001_2022.md, Standardization/iso27701_2025.md — the standard-of-standards"
confidentiality_level: "Internal"
change_history:
  - "0.1.0-draft — initial as-built inventory authored from codebase inspection"
review_date: "2026-10-11"
status: "DRAFT — INVENTORY ONLY"
---

# Rocky — As-Built Security & Privacy Controls Inventory

> **This document is NOT an ISO/IEC 27001:2022 or ISO/IEC 27701:2025 conformity
> assessment. It makes NO claim of certification.** It records what Rocky
> *implements today* (the as-built state) so the standards can be mapped onto a
> real substrate rather than an imaginary one. Precise clause-by-clause mapping
> is maintained in `MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md`; this
> inventory records the *implementation reality* and cites the evidence.

## How this fits the documentation stack

| Document | Role | Status |
| --- | --- | --- |
| `Standardization/iso27001_2022.md`, `iso27701_2025.md` | The standard-of-standards (reference, ~80% documentation/procedure) | Reference |
| `MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md` | Crosswalk: LPDP → GDPR → ISO 27701 → ISO 27001 → SCF → Implementation → Evidence | Crosswalk |
| `ROCKY-ISMS-001` (`isms-policy.md`) | Adopted ISMS posture (engineering homework, not a conformity assessment) | Adopted |
| `iso27701-2025-gap-analysis.md` | To-be posture: MET vs PENDING | Assessment |
| **`ROCKY-INV-001` (this file)** | **As-built inventory: what Rocky ships today** | **Inventory** |

## Implemented controls (as-built)

Each row is a real subsystem observed in the codebase. `Evidence` points to the
package, router, or ADR that proves implementation. Standards references are
*families*; the exact subclause is resolved in the controls matrix.

### 1. Authentication & session management

- **What Rocky has:** Better Auth singleton (`Auth.getInstance()`), email/password
  credential auth, `admin()` plugin (SUPER_ADMIN), `customSession` RBAC enrichment
  (roles, permissions, orgId, language, status), `nextCookies()` / `expo()` plugins.
- **Evidence:** `packages/auth`, `apps/api/src/auth/auth.ts`, `apps/web/lib/auth.ts`.
- **Standards:** ISO 27001 A.5.17, A.8.5; ISO 27701 A.6.2 / A.9.2 (PII controller
  authentication); GDPR Art 32(1)(b) (pseudonymisation/encryption), Art 25.
- **Notes:** Session resolution crosses the boundary to `@rocky/authorization`
  via `AuthResult` → `Principal`; auth package never touches RBAC.

### 2. Authorization / RBAC

- **What Rocky has:** `Principal` (canonical runtime actor), `PrincipalResolver`
  (AuthResult → Principal with RBAC), `@Policy()` decorator system, static
  `PolicyRegistry`, `PolicyEngine` (evaluate action/authenticated/roles/admin).
  52 permissions seeded.
- **Evidence:** `packages/authorization` (principal, policies, permissions).
- **Standards:** ISO 27001 A.5.15, A.8.2, A.8.3; GDPR Art 25 (data protection by
  design), Art 32.
- **Notes:** Policy enforcement is explicit — router must carry `@RegisterPolicy`
  for the engine to fire.

### 3. Row-level security / data isolation

- **What Rocky has:** `rls-helpers.ts`, `injectRlsContext()`, pgPolicy
  transaction-scoped `SET LOCAL`, per-farm scoping via `farm_subjects` /
  `subject_roles`.
- **Evidence:** `packages/database/src/schema/rls-helpers.ts`,
  `packages/database/src/schema/hk/farm-subjects.ts`.
- **Standards:** ISO 27001 A.8.3, A.8.4; GDPR Art 32, Art 25.
- **Notes:** Context must be injected before a query or RLS blocks it.

### 4. Audit logging

- **What Rocky has:** `AuditService` + `audit.router` recording lifecycle events
  across domains; structured audit records.
- **Evidence:** `packages/domains/audit` (audit.service, audit.router).
- **Standards:** ISO 27001 A.5.15, A.5.28, A.8.12; GDPR Art 30 (records of
  processing), Art 5(2) (accountability), Art 33 (breach log).
- **Notes:** Audit is the backbone of accountability — the Real trace of who did what.

### 5. Data validation & integrity (Diamond Seal)

- **What Rocky has:** Zod 4 schemas, `satisfies` on every schema export, `as const`
  enums, NoDrift guillotine (generated vs hand schema parity), shared API surface
  (`@rocky/validators/api`).
- **Evidence:** `packages/validators` (api, rbac, compliance).
- **Standards:** ISO 27001 A.5.33 (protection of records — accuracy/integrity),
  A.8.11 (data masking where applied); GDPR Art 5(1)(d) (accuracy).
- **Notes:** Validation is the Church/State boundary — domain never imports
  `@rocky/database`; frontends import enums, never inline arrays.

### 6. Offline-first sync & conflict resolution

- **What Rocky has:** `expo-sqlite` local store (no ORM on phone), sync queue,
  background sync, conflict resolution (LWW + domain rules), PII purpose-scoped
  sync with TTL/reveal/audit (field-role edge protocol).
- **Evidence:** `apps/mob/lib/offline/*`, `packages/domains/sync`,
  ADR-0036 (offline architecture), ADR-0015 (conflict resolution),
  ADR-0043 (push/background/deeplink), ADR-0074 (field-role edge protocol).
- **Standards:** ISO 27001 A.5.14 (transfer of information), A.8.10;
  GDPR Chapter V (transfers), Art 25 (purpose limitation via ADR-0074), Art 32.
- **Notes:** PII never leaves the device un-scoped; sync is permission- and
  purpose-gated.

### 7. Document generation (records)

- **What Rocky has:** `DocumentRegistry` singleton, pluggable `DocumentTemplate`
  (fetchData → mapToModel → serializeToYaml), templates for inspection-form /
  passport / movement, stable YAML/XML intermediate output (PDF/A deferred).
- **Evidence:** `packages/pdf`.
- **Standards:** ISO 27001 A.5.33, A.8.13; GDPR Art 30 (records), Art 5(1)(e)
  (storage limitation).
- **Notes:** Templates are plain classes, instantiated via `useFactory`.

### 8. Cryptographic primitives

- **What Rocky has:** Password hashing via Better Auth; TLS to Postgres; DB at
  rest (platform-managed). The GDPR right-to-be-forgotten workflow (ADR-0061) is
  **PAUSED** (Proposed) — erasure is not yet automated.
- **Evidence:** `packages/auth`, `ADR-0061-gdpr-right-to-be-forgotten-plan.md`.
- **Standards:** ISO 27001 A.8.24; GDPR Art 32(1)(a) (encryption).
- **Notes:** Encryption-at-rest and in-transit are present; *erasure* (Art 17) is
  pending — see gap analysis + ADR-0061.

### 9. Retention enforcement (archive)

- **What Rocky has:** 3-tier document archive (Central CPC / VS / VI), daily
  `@Cron(EVERY_DAY_AT_2AM)` job marking expired documents destroyed; inspection
  completion triggers `archiveInspectionForm()` (fire-and-forget, idempotent).
- **Evidence:** `packages/domains/archive`, `packages/domains/inspection`.
- **Standards:** ISO 27001 A.8.10 (information deletion), A.5.33;
  GDPR Art 5(1)(e) (storage limitation).
- **Notes:** Tension between archive retention (official-control record-keeping)
  and Art 17 erasure is noted; resolved by lawful-basis (public interest) — see
  ISMS policy recitals.

### 10. Notifications / push

- **What Rocky has:** notification domain, device-token registry, push via
  Expo, permission-gated notify paths.
- **Evidence:** `packages/domains/notification`, `apps/mob/providers/notification-provider.tsx`.
- **Standards:** Operational; intersects ISO 27001 A.5.26 / A.8.13 (where records
  are involved) and GDPR Art 32 (device-token protection).
- **Notes:** Device tokens are PII-adjacent; scoped to the authenticated principal.

### 11. Domain business rules (the regulated subject matter)

- **What Rocky has:** veterinary regulatory domains — animal, farm, movement,
  eartag, passport, inspection, health, iot, correction — each with enforced
  business rules, state machines, and cross-domain wiring.
- **Evidence:** `packages/domains/*`.
- **Standards:** GDPR Art 6 (lawful basis: legal obligation / public interest for
  official controls), Art 9 exemption (health data for veterinary public health),
  Art 5(1)(a) (lawfulness).
- **Notes:** This is the *data* the security/privacy controls govern. The lawful
  basis is public-interest official control, not consent.

## Coverage summary (as-built)

| Control area | Implemented | Standards family | Evidence |
| --- | --- | --- | --- |
| Authentication | ✅ | A.5.17 / A.8.5 | packages/auth |
| Authorization / RBAC | ✅ | A.5.15 / A.8.2-3 | packages/authorization |
| Data isolation (RLS) | ✅ | A.8.3-4 | packages/database |
| Audit logging | ✅ | A.5.28 / A.8.12 | packages/domains/audit |
| Validation / integrity | ✅ | A.5.33 / A.8.11 | packages/validators |
| Sync / transfer | ✅ (PII-scoped) | A.5.14 / A.8.10 | packages/domains/sync, ADR-0074 |
| Document generation | ✅ | A.5.33 / A.8.13 | packages/pdf |
| Cryptography (at rest/in transit) | ✅ | A.8.24 | packages/auth |
| Erasure (Art 17) | ⏸ Paused | A.8.10 / GDPR Art 17 | ADR-0061 |
| Retention enforcement | ✅ | A.8.10 / A.5.33 | packages/domains/archive |
| Notifications | ✅ | A.5.26 / A.8.13 | packages/domains/notification |
| Domain business rules | ✅ | GDPR Art 6/9 | packages/domains/* |

## Open items (hand-off to gap analysis & ADRs)

- **Erasure / right-to-be-forgotten** — ADR-0061 PAUSED; WO-117 (pseudonymization)
  - WO-122 (GDPR exception) not yet created.
- **Precise subclause mapping** — this inventory uses control *families*; the
  exact ISO 27701:2025 / 27001:2022 subclause per control lives in
  `MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md` and should be the single
  source of truth for clause numbers.
- **Maturity level** — per the header template's 5-level model, Rocky is at
  L1–L2 (legal/compliance substrate implemented, ISO alignment aspirational). The
  inventory records L1–L2 reality; L3–L5 is the roadmap in the gap analysis.

## Disclaimer

This inventory documents implemented engineering. It is **not** a conformity
assessment and **does not** assert ISO/IEC 27001:2022 or ISO/IEC 27701:2025
certification, nor GDPR conformity. It exists to make the as-built state visible
so the standards can be mapped onto something real — *align and be ready, never
claim certified*.
