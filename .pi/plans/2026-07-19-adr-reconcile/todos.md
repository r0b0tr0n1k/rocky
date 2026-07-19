# Todos — ADR Reconciliation: Flip 17 Proposed → Accepted, Keep 9 Proposed

**Tag:** `adr-reconcile`
**Plan:** `.pi/plans/2026-07-19-adr-reconcile/plan.md`
**Order:** T01 (C1) → T02 (C3/C4/C6/C8) → T03 (C2 governance) → T04 (confirm keep-Proposed) → T05 (verify).
**Rule:** each todo is independently committable. Only the `Status` header cell changes — no body edits. Every flip todo embeds the exact `perl` command + file list. Read the plan §"Exact Edit Spec" before editing.

---

## T01 — Flip C1 Web UI tiers (0056, 0057, 0058, 0059, 0060) → Accepted

**tags:** [`adr-reconcile`]
**files:**

- `apps/docs/content/ADR/0056-web-ui-tier0-presence.md`
- `apps/docs/content/ADR/0057-web-ui-tier1-lifecycle.md`
- `apps/docs/content/ADR/0058-web-ui-tier1-operational.md`
- `apps/docs/content/ADR/0059-web-ui-tier2-deepen.md`
- `apps/docs/content/ADR/0060-web-ui-component-feedback-map.md`

**constraints:**

- Change ONLY the `| **Status** | … | Proposed` header cell to `Accepted`. Do NOT touch the body.
- **Padding caveat:** the status row is not column-fixed. Some files use `| **Status** | Proposed |`, others `| **Status**     | Proposed            |`. Match the literal `Proposed` token after `**Status**` — never a fixed column width. First `read` the header (lines ~1–12) of each file to confirm the exact text.
- Evidence (why flip): 0056–0059 web parity pages exist under `apps/web/app/(admin)/`; 0060 `components/shared/timeline.tsx` + `stepper.tsx` built (Map deferred per ADR-0031). See plan grid rows.

**exact edit (run once per file):**

```bash
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0056-web-ui-tier0-presence.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0057-web-ui-tier1-lifecycle.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0058-web-ui-tier1-operational.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0059-web-ui-tier2-deepen.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0060-web-ui-component-feedback-map.md
```

(or loop the 5 filenames through the same `perl` command).
**anti-patterns:** do NOT edit body text; do NOT assume single-space `| **Status** | Proposed |` (padded files would silently no-op); do NOT flip 0061 (it is in C2, kept Proposed).
**acceptance:** each of the 5 files now shows `| **Status** … | Accepted`; `grep -rlE '^\|\s*\*\*Status\*\*\s*\| *Proposed' apps/docs/content/ADR/005[6-9]-*.md apps/docs/content/ADR/0060-*.md` returns nothing.

---

## T02 — Flip C3/C4/C6/C8 (0066, 0078, 0089, 0090, 0091, 0095, 0096) → Accepted

**tags:** [`adr-reconcile`]
**files:**

- `apps/docs/content/ADR/0066-error-sovereignty-result.md` (C3 — Result monad; 404 `ok()/err()/Result` matches)
- `apps/docs/content/ADR/0078-geo-spatial-service.md` (C4 — `packages/geo/` extracted)
- `apps/docs/content/ADR/0089-disease-master-data-ahl-categories-woah.md` (C6)
- `apps/docs/content/ADR/0090-sanitary-inspections-ante-post-mortem.md` (C6)
- `apps/docs/content/ADR/0091-lab-test-chain-of-custody.md` (C6)
- `apps/docs/content/ADR/0095-ahl-disease-reference-and-events.md` (C6)
- `apps/docs/content/ADR/0096-docker-multi-stage-build.md` (C8 — 3 multi-stage Dockerfiles)

**constraints:**

- Change ONLY the `Status` header cell to `Accepted`.
- **Padding caveat:** 0066 and 0095 use the padded form `| **Status**     | Proposed            |`. Match the `Proposed` token after `**Status**`, not a fixed width. `read` each header first.
- Evidence: 0066 `packages/domains/sync/src/services/sync.service.ts:10`; 0078 `apps/api/src/app.module.ts:91/:566` + `packages/geo/src/services/geo.service.ts:13`; 0089 `packages/database/src/schema/hd/diseases.ts:20`; 0090 `packages/database/src/schema/an/sanitary-inspections.ts:33`; 0091 `packages/database/src/schema/hd/lab-tests.ts:47` + `packages/domains/health/src/services/health.service.ts:358`; 0095 `packages/database/src/seed/ahl-reference.ts`; 0096 `apps/{api,web,docs}/Dockerfile`.

**exact edit (run once per file):**

```bash
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0066-error-sovereignty-result.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0078-geo-spatial-service.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0089-disease-master-data-ahl-categories-woah.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0090-sanitary-inspections-ante-post-mortem.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0091-lab-test-chain-of-custody.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0095-ahl-disease-reference-and-events.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0096-docker-multi-stage-build.md
```

**anti-patterns:** do NOT edit body text; do NOT assume single-space padding (0066/0095 are padded); do NOT flip 0093 (C7, kept Proposed — no role-specific dashboards exist).
**acceptance:** each of the 7 files now shows `| **Status** … | Accepted`; `grep -rlE '^\|\s*\*\*Status\*\*\s*\| *Proposed' apps/docs/content/ADR/0066-*.md apps/docs/content/ADR/0078-*.md apps/docs/content/ADR/0089-*.md apps/docs/content/ADR/0090-*.md apps/docs/content/ADR/0091-*.md apps/docs/content/ADR/0095-*.md apps/docs/content/ADR/0096-*.md` returns nothing.

---

## T03 — Flip C2 governance artifacts (0068, 0069, 0070, 0072, 0075) → Accepted

**tags:** [`adr-reconcile`]
**files:**

- `apps/docs/content/ADR/0068-lawful-basis-register-a-1-2-3-gdpr-art-6.md`
- `apps/docs/content/ADR/0069-data-protection-impact-assessment-template-a-1-2-5-gdpr-art-35.md`
- `apps/docs/content/ADR/0070-records-of-processing-activities-derived-not-stored-a-1-2-9-gdpr-art-30.md`
- `apps/docs/content/ADR/0072-personal-data-breach-notification-workflow-a-3-11-12-gdpr-art-33-34.md`
- `apps/docs/content/ADR/0075-processor-subprocessor-management.md`

**constraints:**

- Change ONLY the `Status` header cell to `Accepted`.
- These 5 are the **governance-artifact** ADRs of C2: each one's mandated compliance artifact already exists under `apps/docs/content/compliance/` (lawful-basis-register, dpia-health, ropa, breach-notification-procedure, processor-register). That satisfied the decision → flip to Accepted.
- **Padding caveat:** single-space form observed for all 5, but still `read` each header first to confirm before editing.
- Do NOT flip the other C2 members: 0061, 0071, 0073, 0074 are kept Proposed (deferred / partial / spec-only — see plan grid).

**exact edit (run once per file):**

```bash
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0068-lawful-basis-register-a-1-2-3-gdpr-art-6.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0069-data-protection-impact-assessment-template-a-1-2-5-gdpr-art-35.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0070-records-of-processing-activities-derived-not-stored-a-1-2-9-gdpr-art-30.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0072-personal-data-breach-notification-workflow-a-3-11-12-gdpr-art-33-34.md
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/0075-processor-subprocessor-management.md
```

**anti-patterns:** do NOT edit body text; do NOT flip 0061/0071/0073/0074 (kept Proposed); do NOT alter the compliance artifacts themselves.
**acceptance:** each of the 5 files now shows `| **Status** … | Accepted`; `grep -rlE '^\|\s*\*\*Status\*\*\s*\| *Proposed' apps/docs/content/ADR/006[89]-*.md apps/docs/content/ADR/0070-*.md apps/docs/content/ADR/0072-*.md apps/docs/content/ADR/0075-*.md` returns nothing.

---

## T04 — Confirm keep-Proposed (0061, 0065, 0071, 0073, 0074, 0081, 0093, 0106, 0107) — no status edits

**tags:** [`adr-reconcile`]
**files (intentionally LEFT as `Proposed` — do NOT edit):**

- `apps/docs/content/ADR/0061-gdpr-right-to-be-forgotten-plan.md` (Not-done — erasure deferred)
- `apps/docs/content/ADR/0065-mobile-regulatory-gating.md` (Partial — server gate yes, device mirror no)
- `apps/docs/content/ADR/0071-cryptography-at-rest-via-off-server-envelope-encryption-a-8-24-gdpr-art-32.md` (Not-done — no code)
- `apps/docs/content/ADR/0073-mobile-edge-compliance-pii-at-the-edge.md` (Partial — primitive built & tested, not wired)
- `apps/docs/content/ADR/0074-field-role-edge-protocol-contact-only-pii-purpose-scoped-sync-ttl-reveal-audit.md` (Not-done — spec only)
- `apps/docs/content/ADR/0081-accept-and-flag-validation-doctrine.md` (Partial — config yes, schema pending)
- `apps/docs/content/ADR/0093-dual-dashboards-vet-vs-epidemiologist.md` (Not-done — only generic dashboard)
- `apps/docs/content/ADR/0106-state-vet-capability.md` (Not-done — not started)
- `apps/docs/content/ADR/0107-pdf-template-system.md` (Not-done — engine only)

**constraints:**

- **No edits** to any of these files. Their `Status` must remain `Proposed` (decision Q1=keep, Q2=keep).
- Do not run the `perl` flip command against any of these paths.
- (`ADR-TEMPLATE.md` is also `Proposed` but is a template, not a numbered ADR, and is excluded from `check:adrs` — leave it untouched too.)

**verification (read-only):** confirm none of the 9 still needs a flip:

```bash
grep -rlE '^\|\s*\*\*Status\*\*\s*\| *Proposed' apps/docs/content/ADR \
  | grep -E '[0-9]{4}-' | sort
```

Expected: exactly the 9 paths listed above.
**anti-patterns:** do NOT flip any of these 9; do NOT change their body; do NOT "tidy" the template.
**acceptance:** the 9 files are unchanged and still `Proposed`; the read-only grep lists exactly these 9.

---

## T05 — Verify: re-grep Proposed count = 9 and run pnpm check:adrs

**tags:** [`adr-reconcile`]
**files:** (verification across `apps/docs/content/ADR/` — no edits)

**constraints:**

- Run AFTER T01–T04. Must be the final step before declaring done.
- The guardian `scripts/check-adrs.mjs` only validates files matching `^(\d{4})-.*\.md$`; `ADR-TEMPLATE.md` is intentionally `Proposed` and excluded. Use the guard-aligned grep to get an exact 9.

**exact verification commands:**

```bash
# 1) Among real (numbered) ADRs, exactly 9 remain Proposed:
grep -rlE '^\|\s*\*\*Status\*\*\s*\| *Proposed' apps/docs/content/ADR \
  | grep -E '[0-9]{4}-' | sort
# → must print exactly:
#   apps/docs/content/ADR/0061-gdpr-right-to-be-forgotten-plan.md
#   apps/docs/content/ADR/0065-mobile-regulatory-gating.md
#   apps/docs/content/ADR/0071-cryptography-at-rest-via-off-server-envelope-a-8-24-gdpr-art-32.md
#   apps/docs/content/ADR/0073-mobile-edge-compliance-pii-at-the-edge.md
#   apps/docs/content/ADR/0074-field-role-edge-protocol-contact-only-pii-purpose-scoped-sync-ttl-reveal-audit.md
#   apps/docs/content/ADR/0081-accept-and-flag-validation-doctrine.md
#   apps/docs/content/ADR/0093-dual-dashboards-vet-vs-epidemiologist.md
#   apps/docs/content/ADR/0106-state-vet-capability.md
#   apps/docs/content/ADR/0107-pdf-template-system.md

# 2) Guardians pass:
pnpm check:adrs
# → must exit 0 (header tables still valid; Status ∈ {Proposed,Accepted,…})

# 3) (optional) full gate stays green:
pnpm ci:checks
```

**anti-patterns:** do NOT report success if the grep returns ≠ 9 numbered files; do NOT skip `pnpm check:adrs`; do NOT be confused by `ADR-TEMPLATE.md` appearing in the *raw* (unguarded) grep — it is expected and correct.
**acceptance:** guard-aligned grep returns exactly the 9 kept-Proposed files; `pnpm check:adrs` exits 0; optionally `pnpm ci:checks` green.
