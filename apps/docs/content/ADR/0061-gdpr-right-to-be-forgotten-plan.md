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
and log. The registry is the single source of truth — no field is "PII by intuition".

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
  stored unencrypted at rest.
- **Crypto-shredding.** Erasure = destroy (or rotate) the per-subject DEK in KMS. The vault row and
  operational rows become unrecoverable ciphertext with ZERO row churn — scales to millions.
- **Backups are covered for free.** Because erasure destroys the DEK in KMS, every backup copy of the vault (and any PII-bearing export) is ALSO unrecoverable — crypto-shred is the only erasure method that reaches tape / object-store. Key-rotation policy must destroy retired DEKs too. Pair with TLS in transit and DB-level TDE as defense in depth.
- **Column-level hygiene.** Post-migration, no PII column exists in `subjects`; only
  `subject_pseudonym` + flags. The plaintext PII exists nowhere in the operational schema.
- **RLS + permission defense in depth.** The vault is RLS-protected and system-only; `pii:read`
  permission plus farm/tenant scoping is required to even attempt decryption.

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
  `actor_id` is anonymized (replaced with a salted hash) to limit the log's own PII footprint.
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

## Implementation (deferred — plan only)

Owning Bot: a new `@rocky/domains-privacy` (or extend `@rocky/domains-system`) for erasure /
retention / pseudonymize; Validators for erasure-request + audit-entry Zod; API crons in `apps/api`;
tRPC endpoints gated by `pii:read` / `gdpr:*` permissions; audit wired to ExecutionPipeline. RobotFarm
pass: add WO-117 (pseudonymization) + WO-122 (GDPR exception / precedence) rows to WORKORDER and
update root AGENTS.md Bot descriptions.

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

## Related ADRs

- **ADR-0054** — regulatory framework; strike 7 + R7/R10 are the parent of this plan.
- **ADR-0030** — RuleSet; every threshold / override here is a jurisdiction param, not a constant.
- **ADR-0023** — traceability; the epidemiological continuity that justifies keeping facts.
- **root AGENTS.md** — ExecutionPipeline `ExecutionEventEmitter`; RLS; Error Sovereignty doctrine.
