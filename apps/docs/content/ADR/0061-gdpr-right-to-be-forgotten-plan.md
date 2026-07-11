# ADR-0061: GDPR — Right-to-be-Forgotten vs Mandatory Retention (Detailed Plan)

> When the cow is a privacy liability (ADR-0054 G7/R7/R10), you do not delete the farmer.
> You unlink and crypto-shred. The subject is erased; the epidemiology remains.

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (regulatory strike, prompted by user directive) |
| **Source** | GDPR 2016/679 Arts.4(5),5,17,25,32; Art.17(3)(b)/(c); Art.6(1)(c); Art.9(2)(i); EU 2019/6 (Vet Med/AMR) Art.108; AHL 2016/429; IMSOC 2019/1715; national animal-health / public-health acts (per-jurisdiction, TBD); ADR-0054 R7 / R10 |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0054 (regulatory framework, strike 7 + R7/R10); ADR-0030 (RuleSet); ADR-0023 (traceability); root AGENTS.md (ExecutionPipeline event emitter, RLS) |

## Context

ADR-0054 establishes the GDPR guillotine at a high level: strike 7 scrubs PII on farmer exit while
keeping `subject_id` (epidemiological math holds), and R10 confirms GDPR Art.17(3)(b)/(c) defeat
erasure for legal-obligigation / public-health. What ADR-0054 does NOT do is define PII, close the
indirect-disclosure gap, or specify storage / access / audit mechanics.

This ADR is the **detailed plan**. It is deliberately not implemented. The force of circumstance:
GDPR fines reach 4% of global turnover or EUR 20M (Art.83) — the risk justifies writing, reading,
thinking, and re-reading before any code exists. The plan must answer, in order:

1. What IS PII (direct + indirect + derived) — exhaustively.
2. How other data must NOT re-identify the subject (linkage / inference guard).
3. How local public-health law OVERRIDES GDPR erasure (precedence matrix).
4. How PII is kept in the database (storage / encryption / vault architecture).
5. The default rule: do not show PII (minimization; mask unless strictly necessary).
6. Who may see PII and how that access is logged (procedure + permission).
7. Audit logs that are digitally signed / tamper-evident.
8. The erasure procedure (crypto-shred + unlink, with legal carve-outs).
9. The cron apparatus (retention enforcement, erasure queue, audit rotation).
10. The RuleSet param set (ADR-0030) that makes all of this jurisdiction-pluggable.

## Reframing (2026-07-11): developer-protective posture

A review of this ADR — and a hard look at GDPR in practice — **re-orders the priorities**.
GDPR is, frankly, *good intentions gone bad*: a regulation built to protect people that
mainly manufactures liability for the developers who must implement it. The lesson is NOT
to build the full erasure machinery first. It is to do the two things that are both
**achievable AND defensible**, and to treat the right-to-erasure as a theoretical ideal we
acknowledge but do not prioritize.

**What does NOT drive the build order:** *who* exercises the right, and *when*. DSAR
identity-verification, break-glass procedure, KMS custody — real concerns, but process/policy.
Chasing them first is exactly how good intentions go bad.

**What DOES matter — the achievable, defensible safeguard:**

1. **Encrypt PII at rest — the no-brainer.** Names, addresses, phone numbers, emails, and
   national IDs are encrypted at the application layer (AES-256-GCM, per-subject DEK). Critically,
   **the key is NOT stored anywhere on the server** — envelope encryption where the KEK lives
   off-server (KMS / HSM / external secret, injected at boot, never persisted). This is the
   primary, low-risk safeguard and it is buildable now, independent of erasure. It also delivers
   practical erasure for free: destroy the off-server key and the ciphertext is unrecoverable
   everywhere (D4 + Reframing principle 4).
2. **Log every access to PII.** Every view of personal data is written to the signed,
   tamper-evident audit log (D7) with actor, role, purpose, entity, fields, decision. This
   protects *us* — we can prove what was seen, by whom, under what legal basis.
3. **The log must not itself become a PII leak.** Seeing personal data must NOT reveal *who
   has seen it*. The access log records the event and is cryptographically signed for
   accountability, but the viewer's identity is minimized: the actor reference is anonymized
   (salted hash) so the log is evidence of access without becoming a re-identification vector
   or a panopticon that violates the very privacy it serves. This is the dialectical
   resolution — we comply with "log access" while refusing to let the log become a secondary
   PII exposure.
4. **Right-to-erasure: acknowledged, deferred.** In practice it is *quite impossible to ask* —
   correct implementation needs DSAR verification, lifecycle-gated holds (dog-owner refinement),
   KMS key custody. We keep it in the plan as the ideal, but it is NOT a build priority. Note:
   encryption-at-rest already delivers the *practical* erasure for free — destroying the
   per-subject DEK crypto-shreds the PII in the live DB AND every backup (D4). "Erase" becomes
   "destroy the key," not "delete the row."

**Subject scope (who the right applies to):** only *natural persons* have the right to be
  forgotten (GDPR Art.4(1) — an identified or identifiable natural person). **Animals are facts,
  not data subjects** — never erasure-eligible. **Companies / legal entities** (`companyName`,
  `vatNumber`) are likewise outside the erasure right. Therefore erasure logic targets the
  *individual keeper* PII only (firstName, lastName, personalId, phoneNumber, email, address).
  That said, company and animal-linked PII is still **encrypted** as good practice — encryption
  is universal; erasure is person-specific.

**Revised build order (pragmatic):**
   - **(0) reveal-gate + tamper-evident access log — NEAR-TERM, no encryption needed** (see dedicated section).
   - (1) encrypt PII at rest + `pii_sealed` — **PAUSED** (key custody pending advisor input; the no-brainer, not rushed).
   - (2) PII masking via `PII_FIELD_REGISTRY` (`defaultExcluded`) — **DONE**, drives blur-by-default.
   - (3) RuleSet params (D10).
   - … ; (N) full erasure / crons — **deferred pending advisor input**.
access-log with viewer-anonymity; (3) PII_FIELD_REGISTRY masking (D1 — DONE); (4) RuleSet
params (D10); … ; (N) full erasure / crons — **deferred pending advisor input**.

This reframing does not contradict the detailed Decision below; it re-orders it. The
mechanics in D1-D10 remain the design, but encryption + access-logging + log-minimization
are the fist we make first.

## Decision

### D1 — PII taxonomy (define what PII IS, exhaustively)

**Direct PII** (identifies a natural person outright): `subjects.firstName`, `subjects.lastName`,
`subjects.phoneNumber`, `subjects.email`, `subjects.nationalId`, `subjects.taxId`, address lines,
postalCode, city; operator contact on `farms` / `farm_subjects`; `nationalIdNumber`.

**Indirect / derived PII** (identifies when combined or inferred — the trap): `subjects.subject_id`
linked to a single farm + animal holdings (singling-out); GPS tracks from `geofences`,
`sensor_readings`, `animal_geofence_events` tied to a keeper (location is personal data,
Art.9-adjacent); birth/death counts, movement frequency, herd composition (attribute disclosure);
IP / device id / session in `audit_log` (behavioral); free-text `notes` / `correspondence` in the
archive (can contain names).

**Rule**: any column or derived field that can single out, correlate, or infer a natural person is
PII and falls under this ADR. The taxonomy is enforced as a machine-readable registry
(`PII_FIELD_REGISTRY`) so validators, the API projection layer, and the UI know what to mask, sign,
and log. The registry is the single source of truth — no field is "PII by intuition". A future
refinement adds an `erasureEligible` flag: natural-person PII (firstName, lastName, personalId,
phoneNumber, email, address) is erasure-eligible; legal-entity PII (companyName, vatNumber) and
animal facts are encrypted but NOT erasure-eligible (see Reframing, Subject scope).

### D2 — Indirect-disclosure guard (other data must NOT reveal PII)

The Real: even after scrubbing `subjects` PII, the `animals` / `movements` / `geofences` rows still
point at `subject_id`; a determined reader re-identifies the keeper via herd size, geography, timing.
Mitigations:

- **Pseudonymize the linkage.** Replace `subject_id` (and `keeper_id`) everywhere in operational
  tables with `subject_pseudonym` (random, non-sequential UUID). The mapping lives ONLY in the
  encrypted vault (D4). The animal/farm facts remain; the person behind them does not.
- **k-anonymity floor for exports.** Any aggregate released externally must satisfy `k >=
  gdpr.kAnonymityFloor` (config, default 5); otherwise suppress or generalize. Enforced in the
  export/PDF layer (ADR-0054 strike 6 lineage export), not ad hoc.
- **Geo coarsening.** `sensor_readings` / `animal_geofence_events` exported only at reduced
  precision and only with `subject_pseudonym` (never the real keeper). GPS is sensitive; treat it
  as such.
- **Derived-field tagging.** The `PII_FIELD_REGISTRY` tags composite / inferred fields (herd
  composition, movement frequency) so the API projection layer auto-excludes them unless explicitly
  cleared by `pii:read` + purpose.

### D3 — Legal-precedence matrix (local / public-health law OVERRIDES GDPR erasure)

GDPR Art.17(3)(b) (compliance with a legal obligation) and Art.17(3)(c) (public-health protection)
DEFEAT the right to erasure. For each record class the overriding law + retention floor is fixed;
erasure is satisfied ONLY by pseudonymization, not deletion.

| Record class | Overriding law | Retention floor | Erasure handling |
| --- | --- | --- | --- |
| Vaccination / treatment records | EU 2019/6 Art.108 (Vet Med/AMR) | >= 5 years | Keep; pseudonymize keeper link |
| Movement / passport / animal identity | AHL 2016/429 + national I&R | Life of animal + N years | Keep; pseudonymize keeper link |
| Inspection forms | Animal-health authority (public health) | Per national act (>= 3 y) | Keep; pseudonymize keeper link |
| 3-tier archive (CPC/VS/VI) | Archive retention (3 y) + public-health hold | 3 y, extend on hold | Keep; pseudonymize keeper link |
| Subject PII (name / contact) | None overrides | — | ERASE via crypto-shred on request |
| Audit log | Accountability Art.5(2) | >= audit window (e.g., 2 y) | Anonymize actor after window |

The matrix above is EU-centric by example. For MK (North Macedonia) deployments the relevant national acts (Law on Animal Health, Law on Veterinary Activity, and any public-health / personal-data statute) MUST be enumerated with their own retention periods and loaded as `gdpr.overrides[]` entries — a national act can tighten or extend retention, and the system must honor it without a code change. Precedence resolution is a **RuleSet param set, not a code branch**: `gdpr.overrides[]` lists
`(law, recordClass, retentionYears, basis)`. If a public-health hold is active (`legal_hold=true`),
erasure is SUSPENDED until cleared by an authorized role. This is the mechanism that lets a national
animal-health act win over Art.17 without a code fork.

### D4 — Storage architecture (how PII is kept in the database)

- **Vault separation.** Real PII lives ONLY in `pseudonym_vault(pseudonym PK, encrypted_blob,
  key_ref, created_at, sealed_at)`. Operational tables (`subjects`, `farms`) store
  `subject_pseudonym` + `pii_sealed=true` — never plaintext PII.
- **Encryption at rest.** Application-layer AES-256-GCM. Per-subject DEK wrapped by a KEK from KMS
  (AWS KMS / HashiCorp Vault transit / local HSM). `key_ref` points to the KEK id; the DEK is never
  stored unencrypted at rest. **The KEK is NEVER persisted on the server or in the database** — it is
  envelope encryption: the DEK sits in the vault, the KEK is external (injected at boot). This is what
  makes crypto-shredding reach every backup and what makes 'erase = destroy the key' possible with
  zero row churn (Reframing principle 1 + 4).
- **Crypto-shredding.** Erasure = destroy (or rotate) the per-subject DEK in KMS. The vault row and
  operational rows become unrecoverable ciphertext with ZERO row churn — scales to millions.
- **Backups are covered for free.** Because erasure destroys the DEK in KMS, every backup copy of the vault (and any PII-bearing export) is ALSO unrecoverable — crypto-shred is the only erasure method that reaches tape / object-store. Key-rotation policy must destroy retired DEKs too. Pair with TLS in transit and DB-level TDE as defense in depth.
- **Column-level hygiene.** Post-migration, no PII column exists in `subjects`; only
  `subject_pseudonym` + flags. The plaintext PII exists nowhere in the operational schema.
- **RLS + permission defense in depth.** The vault is RLS-protected and system-only; `pii:read`
  permission plus farm/tenant scoping is required to even attempt decryption.

### D4b — Drizzle `encryptedVarchar` (crypto-shredding at the ORM boundary) — PAUSED

The envelope-encryption design above is realized as a custom Drizzle column type, so
PII is encrypted **before** it reaches PostgreSQL — and therefore before the `audit_log`
JSONB captures it (the log stores ciphertext, never plaintext PII — see D7 / the reveal-gate).
The same `customType` wraps the **vault's `encrypted_blob`** column (D4); operational tables
(`subjects`, `farms`) stay PII-free, holding only `subject_pseudonym` + flags.

```typescript
import { customType } from "drizzle-orm/pg-core";
import { encrypt, decrypt } from "./crypto-service"; // AES-256-GCM + KMS-wrapped DEK

export const encryptedVarchar = customType<{ data: string; driverData: string }>({
  dataType() {
    return "varchar"; // stored as standard varchar in Postgres
  },
  toDriver(value: string): string {
    return encrypt(value); // encrypt BEFORE the DB / audit log
  },
  fromDriver(value: string): string {
    return decrypt(value); // decrypt on read
  },
});

// Applied to the vault blob (the subjects table itself stays PII-free per D4):
encryptedBlob: encryptedVarchar("encrypted_blob", { length: 4096 }),
```

**Status: PAUSED.** Per the 2026-07-11 directive, DB encryption is deferred until
key-custody (KMS / KEK) is settled by advisor input. The `PII_FIELD_REGISTRY` masking
+ reveal-gate (Phase 1) ships first; this type lands in Phase 2.

### D5 — Data minimization / default-NOT-shown (the best way is to not show it)

- **API default projections EXCLUDE all PII-registry fields.** A `PIIProjection` is a distinct shape
  returned ONLY when the caller holds `pii:read` AND supplies a `purpose` (legal-basis code) that is
  logged (D6/D7).
- **UI masks by default** (e.g., `M**** K****`); reveal-on-click requires `pii:read` and logs the
  reveal.
- **tRPC routers return the non-PII shape by default**; the PII shape is a separate procedure gated
  by permission + purpose.
- This satisfies GDPR Art.25 (data protection by design) and Art.5(1)(c) (minimization): PII is not
  loaded, not serialized, not sent over the wire unless strictly necessary. The cheapest PII breach
  is the one that never reaches the response.

### D6 — Access-control procedure (who can see PII, and how it is logged)

Procedure `PII_ACCESS_PROCEDURE` (every step is enforced, not advisory):

1. Caller must hold `pii:read` (seeded RBAC permission).
2. Caller must supply a `purpose` (legal-basis code from a fixed set: `care`, `regulatory`,
   `emergency`, `audit`).
3. RLS enforces farm / tenant scoping — a reader sees only their jurisdiction's subjects.
4. EVERY access, including DENIED attempts, is written to the signed audit log (D7) with actor,
   role, purpose, entity, fields touched, timestamp, and decision.

Roles: VD_ADMIN / VD_STAFF (ADR-0054 admin roles) may hold `pii:read`; SUPER_ADMIN governs policy;
field staff on mobile generally do NOT get `pii:read` — they operate on `subject_pseudonym` only.
The procedure is the procedural guillotine that makes "who saw what, and why" auditable.

### D7 — Audit log (digitally signed, tamper-evident)

`gdpr_audit_log` is **append-only and cryptographically signed**:

- Schema: `id, seq, action, entity_type, entity_id, subject_pseudonym, actor_id, role, purpose,
  decision, payload_hash, prev_sig, sig, ts, retention_until`.
- **Hash-chain:** each row stores `prev_sig` (signature of the previous row) and its own `sig` =
  Ed25519 detached signature over `(seq || prev_sig || action || entity_id || actor_id || ts ||
  payload_hash)`, key from KMS. Tampering with any historical row breaks the chain and is detectable
  on verification (alerts fire). Verification is CONTINUOUS (a background job re-walks the chain), not only on read. Signing-key custody follows separation of duties: the KMS key that signs is distinct from any role that can edit PII, and the chain genesis (`prev_sig`) is anchored out-of-band so a total rewrite is detectable.
- **Self-minimization:** the subject is logged as `subject_pseudonym`; after `retention_until`,
  `actor_id` is anonymized (replaced with a salted hash) to limit the log's own PII footprint. The viewer's identity is minimized so that using the system never reveals *who has seen*
  the PII — the log is accountability evidence, not a re-identification vector (Reframing, principle 3). Operationalized as the reveal-gate + tamper-evident access log — see the dedicated section below.
- **Wiring:** emitted via the ExecutionPipeline `ExecutionEventEmitter` (root AGENTS.md) so access /
  erasure / retention events are signed centrally — one path, not scattered `INSERT`s.
- The log is the defensible artifact for both GDPR accountability (Art.5(2)) and the regulatory
  audits (AHL / IMSOC / archive).

### D8 — Erasure procedure (the right-to-be-forgotten, satisfied lawfully)

On `gdpr_erasure_request(subject_pseudonym, requested_by, basis)`:

1. Verify NO active `legal_hold` on the subject's records (D3). If held, SUSPEND + log.
2. Crypto-shred the per-subject DEK in KMS (destroy / rotate) — vault PII becomes unrecoverable.
3. Null / replace the `subject_pseudonym` linkage where it is the ONLY personal link; KEEP
   `subject_id` for epidemiological continuity (ADR-0054 strike 7).
4. Anonymize audit-log actor references for this subject after the audit window.
5. Emit `ERASURE_APPLIED` signed event.

Result: the data subject is erased (PII unrecoverable) while legal-retention records remain
(pseudonymized, facts intact). This is the only lawful reconciliation of Art.17 with Art.17(3).

### D9 — Cron jobs (the retention / deletion apparatus)

| Cron | Schedule | Action |
| --- | --- | --- |
| `gdpr-retention-enforcement` | daily 02:00 (sibling of archive job) | Scan records past `retention_until` with `legal_hold=false` -> final-anonymize or crypto-shred; signed event |
| `gdpr-erasure-queue-processor` | hourly | Process approved `gdpr_erasure_request` through D8 steps |
| `gdpr-audit-log-rotation` | weekly | Anonymize `actor_id` past audit window; verify hash-chain |

All run as `system` with RLS bypass (same pattern as the archive retention job); the bypass must be
verified at runtime, not assumed.

### D10 — RuleSet params (ADR-0030)

```
gdpr: {
  retentionYears,
  pseudonymizeOnExit,
  kAnonymityFloor,
  auditWindowYears,
  overrides: [{ law, recordClass, retentionYears, basis }],
  legalHoldRoles: [...]
}
```

No regulatory constant is hardcoded (ADR-0054 cross-cutting principle). Jurisdiction covers all of it.

## Reveal-gate + tamper-evident access log (near-term, achievable slice)

Encryption-at-rest is the eventual no-brainer but is **intentionally PAUSED** — we are not
comfortable shipping it until the key-custody approach is settled (advisor input). The piece
we CAN and SHOULD build now is the **access-audit pattern**, which needs **no encryption** and
already follows from the committed `PII_FIELD_REGISTRY` (its `defaultExcluded` flag).

### Flow
1. **Masked by default.** Any `defaultExcluded` column in `PII_FIELD_REGISTRY` renders **blurred**
   in the frontend (e.g. `••••••`). PII never reaches the screen unless explicitly revealed. The API
   projection layer (D5) omits these fields unless the caller holds `pii:read` + `purpose`; the UI
   blurs whatever it is nonetheless shown. Defense in depth — the registry is the single source of truth.
2. **Purpose gate (the "are you sure?" popup).** Reveal requires an explicit confirmation capturing the
   *purpose* (legal basis for the view). Only a user with `pii:read` AND a declared purpose may proceed.
   No purpose → no reveal → nothing logged as "viewed". The popup is the friction that makes the access
   *conscious* and *attributable*.
3. **Access audit entry.** On reveal, an entry is written:
   - `actor_id` — the viewer, but **anonymized** (salted hash) so the log never exposes *who has seen it*
     (Reframing principle 3).
   - `table` / `entity_id` — **the ROW that was revealed** (e.g. `subjects` / `uuid`). The log stores the
     *reference to the row*, never the decrypted name.
   - `column` — which field was revealed (e.g. `firstName`).
   - `subject_pseudonym` — stable subject reference (groups entries per subject without the plaintext).
   - `purpose`, `decision = ALLOWED`, `ts`.
   The plaintext name is **NOT in the log**. Whoever can *decrypt names* (holds the key) resolves
   `table`+`entity_id` back to the row and sees the name; a plain **log-viewer cannot** — they see only that
   row X of table Y, column Z was viewed, by an anonymized actor, for purpose W. ('not sure about the name'
   = the name is the logged *subject*, but only as a tamper-proof ROW REFERENCE, not as plaintext.)
4. **Tamper-evidence (the "break the chain" guarantee).** The log is **append-only and cryptographically
   chained**: each entry commits to `H(prev_entry_hash || payload)` and is signed (Ed25519). Altering,
   deleting, or reordering ANY entry changes its hash and severs the chain to every subsequent entry —
   detectable on verification. This is the "whatever method": change one row and the signature breaks.
   The log is evidence; it cannot be quietly edited. (D7.)

### What this buys us (now)
- We comply with "log access to PII" **without encrypting anything yet**.
- We protect the *developers*: a signed, purpose-tagged trail proves what was seen, by whom (anonymized),
  under what basis — our defense if challenged.
- The log records the **row reference** (`table`+`entity_id`), not the plaintext name — so the value PII stays
  with the data (resolvable only by name-decryption key-holders) while the *viewer's* PII is minimized
  (anonymized actor). Tamper-evident + access-controlled: an immutable accountability record, not a
  quietly-editable one.
- It is the natural front-end to the later encryption slice: when encryption lands, the SAME reveal-gate
  writes the SAME audit entry; only the storage of the value changes. No rework of the UX or the log.

## Open Questions (surfaced by the read to think to re-read loop)

These MUST be answered before any code is written — they are the gaps the first draft papered over:

1. **GDPR applicability to MK (Art.3 territorial scope).** Does GDPR trigger for a North Macedonia
   deployment at all? It applies if the controller is EU-established or processes EU data subjects'
   data; an adequacy decision or cross-border flow may pull MK in. If GDPR does NOT apply, the local
   personal-data law governs instead — but the plan's mechanics (vault, signing, minimization) still
   hold as good practice. SCOPE MUST BE DECIDED FIRST.
2. **MK national acts enumeration.** The D3 matrix uses EU examples; the actual MK animal-health /
   public-health / personal-data-protection statutes and their retention floors must be enumerated
   and loaded as `gdpr.overrides[]`.
3. **DSAR identity verification.** How does the system confirm the requester IS the data subject (or
   a lawful representative) before erasing? Erasure without verification is an abuse vector (a
   competitor could erase a rival's records).
4. **Break-glass emergency access.** During a disease outbreak an investigator may need PII without
   `pii:read`. Define a time-limited, dual-authorization, fully-logged emergency path — and confirm
   it is itself signed and reviewed.
5. **Signing-key custody and continuous verification.** Who holds the Ed25519 private key? Separate
   it from PII editors; anchor the chain genesis out-of-band; verify continuously, not only on read.
6. **Pseudonym rotation on erasure.** After erasure, `subject_pseudonym` should be re-issued (not
   reused) so it cannot be correlated across pre/post-erasure tables.
7. **Vault row lifecycle post-shred.** After DEK destruction, delete (or mark `destroyed`) the vault
   row so no orphan mapping remains; confirm `subject_id` stays but the `subject_id <-> subject_pseudonym`
   bridge is severed.

## Consequences

### Positive

- One deployment serves MK / EU / US; GDPR + local public-health law is configuration, not forks.
- The subject is lawfully erasable; the epidemiology survives — the contradiction is resolved.
- Signed, self-minimizing audit trail satisfies both GDPR accountability and regulatory audits.
- Crypto-shredding scales erasure to millions with zero row churn.

### Negative / Cost

- Larger test matrix (behavior per RuleSet + per override law).
- Vault + KMS + signing add operational surface (key rotation, chain verification on read).
- API / UI must thread `purpose` + permission through every PII path (caller burden).

### Neutral

- Schema fields largely exist; this ADR is mostly new tables (`pseudonym_vault`, `gdpr_audit_log`,
  `gdpr_erasure_request`), flags (`pii_sealed`, `legal_hold`, `retention_until`), and logic.

## Implementation stance — make it work first; compliance is phase 2

**Phase 1 (now): make it work.** Ship functional value first. The achievable, non-destructive slice:
(1) PII masking via the committed `PII_FIELD_REGISTRY` (`defaultExcluded`) — **DONE**; (2) reveal-gate
("are you sure?" purpose popup) + **tamper-evident access log** recording the ROW REFERENCE (not the
plaintext name), actor anonymized — see the dedicated section. **NO encryption yet**; the developer is
not comfortable shipping key-custody until it is settled. Functionality before formalism.

**Phase 2 (later): the "government checks".** The full GDPR/governance apparatus — DPIA (Art.35), DPO
ownership (Art.37), periodic + automated log review, separation of duties, Art.33 breach response,
ISO/IEC 27701 alignment, encryption-at-rest + `pii_sealed`, and the erasure vault/crons (D8/D9) — is a
SECOND phase, added AFTER the system works.

**Expert consultation.** The developer will consult ISO 27701 / GDPR experts. The governance/compliance
details (DPIA scope, DPO mandate, log-retention period, supervisory authority, breach procedure) will be
added to this and related ADRs as **addendums** once advised. Until then those items are explicitly OUT
OF SCOPE for coding — this ADR records the *architecture*, not a certified compliance posture. We skip
the rabbit hole for now.

**Deferred (pending expert input):** encryption-at-rest, full erasure vault + crypto-shred + lifecycle
holds + crons (D8/D9), and the `gdpr:*` / `pii:read` RBAC surface beyond what Phase 1 needs. The
right-to-erasure is acknowledged as ideal but not prioritized.

### Paused implementation checklist (the "minimal fixes now" — deferred per 2026-07-11 directive)

GDPR/ISO/DB-encryption is **paused**. When unpaused, the first concrete slices are:

1. **Redact PII from the JSONB audit log.** In `packages/domains/audit/src/services/audit.service.ts`,
   before `computeChanges` writes the JSON, if `resource === 'subject'`, mask fields
   (`personalId`, phone, email) as `{ old: '***', new: '***' }`. (Once D4b lands the log stores
   ciphertext anyway; until then, redaction prevents plaintext PII in `audit_log`.)
2. **Read-access logging for PII.** Extend the tRPC/service layer to emit `AUDIT_ACTION.READ`
   when a `subject` row or a takeover file carrying farmer details is queried/downloaded — prove
   *who* looks at people, not just animals (ISO 27001 internal-threat access control).
3. **Anonymize, never hard-delete.** `anonymizeSubject(id)`: set `firstName='Anonymized'`,
   `lastName='User'`, `personalId=hash(personalId)`, `email=null`, `phoneNumber=null`; KEEP the UUID
   so `farm_subjects` / movements / treatments links survive intact.
4. **PDA data minimization.** `syncDownload` must strip PII (`personalId`, email) from the payload —
   the PDA needs only `short_name` + `farm_id`, not every keeper's JMBG/email in the district.

All four are deferred; the Phase-1 reveal-gate + `PII_FIELD_REGISTRY` masking ships first.

Owning Bot (Phase 2): a new `@rocky/domains-privacy` (or extend `@rocky/domains-system`); Validators for
erasure-request + audit-entry Zod; API crons in `apps/api`; tRPC endpoints gated by `pii:read` / `gdpr:*`;
audit wired to ExecutionPipeline. RobotFarm pass (Phase 2): add WO-117 (pseudonymization) + WO-122 (GDPR
exception / precedence) rows to WORKORDER and update root AGENTS.md Bot descriptions.

## Verification (Definition of Done — when implemented)

```bash
# PII registry exists and is referenced by API projection + UI mask
rg -n "PII_FIELD_REGISTRY" packages/validators packages/api packages/mob
# pseudonym_vault + gdpr_audit_log + gdpr_erasure_request tables present
rg -n "pseudonym_vault|gdpr_audit_log|gdpr_erasure_request" packages/database/src
# erasure leaves subject_id, removes PII recoverability (crypto-shred)
# audit log hash-chain verifies on read; tampering is detected
# retention cron runs as system with RLS bypass verified at runtime
```

## Anti-Patterns (do not repeat)

1. Deleting the farmer row and calling it "erasure" — breaks epidemiological continuity and still
   leaks via linkage.
2. Treating `subject_id` / GPS / herd-composition as "not PII" — indirect identification is still
   identification.
3. Unsigned audit log — fails accountability and is trivially editable.
4. Hardcoding retention periods — a national act must be able to override without a code change.
5. Showing PII by default and masking on demand — inverts Art.25; mask by default, reveal on need.

## Addendum (2026-07-11): Lifecycle-gated erasure — the dog-owner thought experiment

A review of this ADR surfaced a refinement that changes the *shape* of the erasure
procedure (D8) and the precedence matrix (D3). The trigger: **"If I am a dog owner, do
I have the right to be forgotten? I don't think I have it 'right' until my dog is alive."**

### The Real that ruptures the fantasy

The ideological fantasy is: *"I am a data subject; I request erasure; you erase me now."*
GDPR Art.17(3)(c) defeats erasure for *"public-health protection."* An animal-health /
traceability record is kept for the **life of the animal + N years** (AHL 2016/429, national
I&R, EU 2019/6 Art.108 for vet/AMR). Therefore:

- **While the animal is ALIVE**, the keeper's PII is inextricably bound to a *living*
  epidemiological subject. Erasing the owner would sever the traceability chain that
  protects public health (disease outbreak, food safety). Erasure is **defeated**. The
  animal's body is the Real that anchors the record — you cannot forget the keeper of a
  cow that is still breathing.
- **When the animal DIES**, the record must persist for the retention floor (e.g. 3-10 y
  per AHL / national act). During that window erasure is **still defeated**.
- **Only after (animal dead AND retention window elapsed)** may the keeper's PII be
  crypto-shredded / pseudonymized. The animal facts (`subject_id`, birth/death, movements,
  passport) remain for epidemiology; the *person* is gone.

### Consequence for the design

`legal_hold` (D3/D8) must be **DERIVED, not merely manually set**: a subject carries an
implicit legal hold while **any linked animal is alive OR within its retention window**.
The erasure procedure must cascade-check linked animals' life-status + retention before
crypto-shredding — a manually-flipped `legal_hold` flag is necessary but NOT sufficient.
This is the dialectical resolution of Art.17 vs Art.17(3): the person is erased, but only
after the animal (and the law's memory of it) has passed. The "trickiest to implement"
erasure is therefore a **deferred, lifecycle-gated** erasure, not an on-request one.

### Status
Refinement accepted into the plan; not yet implemented (the plan remains deferred code).
It tightens D3 (precedence) and D8 (erasure steps 1 + 3) and implies a `linkedAnimalHold`
derivation in the erasure service.

## Related ADRs

- **ADR-0054** — regulatory framework; strike 7 + R7/R10 are the parent of this plan.
- **ADR-0030** — RuleSet; every threshold / override here is a jurisdiction param, not a constant.
- **ADR-0023** — traceability; the epidemiological continuity that justifies keeping facts.
- **root AGENTS.md** — ExecutionPipeline `ExecutionEventEmitter`; RLS; Error Sovereignty doctrine.
