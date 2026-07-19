# Plan: ISO Standards Layer — Coherence & Governance (CORRECTED)

> **Supersedes** the stale planner draft written 16:20, which assumed ADRs 0096–0104 and the
> companion compliance docs did not yet exist and proposed *creating* them. Re-verified
> 2026-07-15 18:48: they **already exist**. Only the tasks below are real remaining work.
> Executing the stale draft would recreate existing ADRs/docs and cause duplication — do NOT.
>
> **Governing anchors:** ADR-0033 (ADR house standard), ADR-0052 (Diátaxis + guardians),
> ADR-0067 (ISMS/PIMS roadmap — the ruling ADR, still `Proposed`), ADR-0104 (diagram + SW-eng map).

---

## Verified current state (do NOT recreate — confirmed 18:48)

- `isms-policy.md` (ROCKY-ISMS-001, Adopted) is the **canonical SoA** with **one verdict per
  control** already: A.5.1=PARTIAL, A.5.3=IMPLEMENTED, A.5.4=PARTIAL, A.5.9=PARTIAL. No
  in-file contradiction.
- **ADR-0092 + ADR-0084 already cited** in the SoA (A.5.15, A.5.28, A.8.20, A.8.22). The
  "orphaned code controls" finding was wrong.
- **A.8.24 crypto already PLANNED / risk-accepted paused** (ROCKY-CRYPTO-001 / ADR-0071). No
  overclaim remains.
- **ADRs 0096–0104 all exist** (0097 incident-response, 0098 supplier, 0099 bcp, 0100 training,
  0101 non-PII, 0102 change-config, 0103 physical, 0104 arch-diagrams).
- **Companion docs present:** `rocky-incident-response-plan.md` (0097), `rocky-bcp-ict-readiness.md`
  (0099), `rocky-training-awareness.md` (0100), `rocky-non-pii-asset-inventory.md` (0101),
  `rocky-physical-controls-attestation.md` (0103), `rocky-cryptography-policy.md` (0071),
  `rocky-obligation-register.md` (0054).
- `compliance/index.mdx` exists. `VALIDATED_CROSSWALK` exists at
  `packages/validators/src/compliance/gdpr-articles.ts`.

## Remaining gaps (the real work)

| # | Gap | Evidence |
|---|---|---|
| G1 | `rocky-soa.md` is a **2nd divergent SoA** (Draft v0.1.0, divergent verdicts on A.5.1/.3/.9) | both files present |
| G2 | **ADR-0067 still `Proposed`** while `isms-policy.md` is `Adopted` | status mismatch |
| G3 | **2 missing companion docs:** `rocky-supplier-assessment.md` (ADR-0098) and `rocky-change-config-mgmt.md` (ADR-0102) are NOT written | ADRs exist, docs missing |
| G4 | **Albania (AL Law 124)** named in-scope but no doc (MK-LPDP family ~3.2k lines; AL = 0) | no `AL` doc |
| G5 | **10 ADRs** touch PII/privacy/records but don't cross-link `/compliance/` or `/Standardization/` | 0062,0065,0073,0074,0082,0084,0086,0092,0093,0094 |
| G6 | **4 parallel crosswalks**, no single source cited; code `VALIDATED_CROSSWALK` is the only machine-checked anchor but its `iso27701` field is "pending review" | 4 files |
| G7 | `Standardization/index.md` title says "ISO/IEC 27701:2025" but indexes both standards | cosmetic |
| G8 | **No `check:standards` guardian** enforces the Standardization style guides | scripts/ has none |
| G9 | **No `how-to/maintain-standards-layer.mdx`** | missing |

## Pre-reqs already DONE & committed separately (not in this plan)

- `apps/web/components/dashboard/analytics.tsx` — `enabled` moved from tRPC input to React Query
  options (fixed `unrecognized_keys` on dashboard list queries).
- `apps/docs/next.config.ts` + `apps/docs/scripts/mermaid-source-loader.mjs` — Turbopack `.mmd`
  loader so `pnpm build` (docs) passes (`EXIT=0`).

---

## Approach (PDCA-aligned, single canonical spine)

1. **PLAN** — retire the 2nd SoA (`rocky-soa.md`); accept ADR-0067 (ratify the policy).
2. **DO** — write the 2 missing companion docs (G3); resolve AL Law 124 (G4); cross-link the 10
   ADRs (G5); anchor the 4 crosswalks to the code anchor (G6); fix the index title (G7).
3. **CHECK** — add a `check:standards` guardian (G8) + a maintain-standards `how-to` (G9).
4. **ACT** — wire the guardian into `ci:checks`; the spine cannot silently re-diverge.

**Why not a rewrite:** the enforcement is real and well-documented; the symptom is *drift between
registers + missing paperwork*, not missing controls. Consolidating to one spine + a guardian closes
the gap without re-authoring 80 standards files (most already exist).

---

## Tasks (the saved list)

| ID | Task | Addresses | Artifact |
|---|---|---|---|
| **T-A** | Retire `rocky-soa.md` (delete + remove `_meta.ts` entry + redirect links to `isms-policy.md`); fold `iso27701-2025-gap-analysis.md` §4 into a provenance note (canonical verdicts now live in `isms-policy.md`). | G1 | `compliance/rocky-soa.md`, `compliance/_meta.ts`, `compliance/iso27701-2025-gap-analysis.md` |
| **T-B** | Accept **ADR-0067**: `Status: Proposed → Accepted`; add `Date`+`Author`; confirm `isms-policy.md` A.8.24 names crypto-pause **owner + review date** (risk-accepted gap). | G2 | `ADR/0067-isms-posture-iso27001-27701-roadmap.md`, `compliance/isms-policy.md` |
| **T-C** | Author `compliance/rocky-supplier-assessment.md` (ROCKY-SUP-001) per **ADR-0098**: cloud/supplier security assessment + processor eval (Better Auth et al.), A.5.19–.23 / A.2.2 / A.3.10. Cite `rocky-dpa.md` + `rocky-processor-register.md` (don't duplicate them). | G3 | `compliance/rocky-supplier-assessment.md` |
| **T-D** | Author `compliance/rocky-change-config-mgmt.md` (ROCKY-CM-001) per **ADR-0102**: change authorisation, config register, SoD sign-off (A.8.32/.9); reference NoDrift as the enforcing mechanism. | G3 | `compliance/rocky-change-config-mgmt.md` |
| **T-E** | Resolve **AL Law 124**: record an explicit, justified decision. Recommend: mark **out of scope** in ADR-0067 + `isms-policy.md` recitals (carried from a separate project; MK LPDP is the in-scope jurisdiction), retaining the `alLaw124` code field for future use. (Alternative: write a lean `compliance/ALBANIAN_LPDP.md` mirroring MK structure — only if user prefers.) | G4 | ADR-0067 / `isms-policy.md` (or new doc) |
| **T-F** | Cross-link 10 ADRs → standards layer: add a `## Standards / Compliance` line citing the relevant `/compliance/` + `/Standardization/` docs + SoA control IDs. Targets: 0062,0065,0073,0074,0082,0084,0086,0092,0093,0094. Add matching back-links in target docs. | G5 | 10 ADR files + target docs |
| **T-G** | Crosswalk consolidation: ensure each crosswalk doc with GDPR/LPDP/AL content **cites `VALIDATED_CROSSWALK`** (symbol + path `packages/validators/src/compliance/gdpr-articles.ts`) as the single source of truth; keep `iso27001-2022-annex-a-mapping.md` (pure 2013→2022 renumber, no GDPR content — no citation needed); flag `VALIDATED_CROSSWALK.iso27701` as "pending expert review" in prose. | G6 | `MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md`, `iso27001-2022-controls.md`, `iso27701_2025.md`, `iso27701-2025-gap-analysis.md`, code comment |
| **T-H** | Fix `Standardization/index.md` title to "Rocky Standards & Compliance" (indexes both ISO 27001 + 27701). | G7 | `Standardization/index.md` |
| **T-I** | Add `scripts/check-standards.mjs` guardian + wire `check:standards` into root `package.json` `ci:checks` after `check:agents`. | G8 | `scripts/check-standards.mjs`, `package.json` |
| **T-J** | Author `how-to/maintain-standards-layer.mdx` referencing `internal-standard-style.md` + `writing-iso-compatible-documentation.md` + the `check:standards` guardian + the canonical-SoA rule (no 2nd SoA). | G9 | `how-to/maintain-standards-layer.mdx` |

---

## Guardian sketch (`scripts/check-standards.mjs`)

```js
// Enforces the standards layer's internal coherence (G8). Runs in ci:checks. Exits non-zero on violation.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CROSSWALK_SRC = "packages/validators/src/compliance/gdpr-articles.ts";
const STATUS_TOKENS = ["IMPLEMENTED", "PARTIAL", "PLANNED"];
const errors = [];
const note = (f, m) => errors.push(`${f}: ${m}`);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    if (e === "_meta.ts" || e === "node_modules") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(e) && !/^index\.mdx?$/.test(e)) out.push(p);
  }
  return out;
}

// (a) single canonical SoA: rocky-soa.md must be gone OR explicitly derived.
const soa2 = join(ROOT, "apps/docs/content/compliance/rocky-soa.md");
if (existsSync(soa2) && !/DERIVED FROM ROCKY-ISMS-001/i.test(readFileSync(soa2, "utf8")))
  note(soa2, "rocky-soa.md must be deleted or marked DERIVED FROM ROCKY-ISMS-001");

// (b) canonical SoA — exactly one status token per control row.
const soa = join(ROOT, "apps/docs/content/compliance/isms-policy.md");
for (const line of readFileSync(soa, "utf8").split("\n")) {
  if (!/^\|\s*A\.\d/.test(line)) continue;
  const found = STATUS_TOKENS.filter((t) => new RegExp(`\\*\\*${t}\\*\\*`, "i").test(line));
  if (found.length !== 1) note(soa, `row has ${found.length} status token(s): ${line.trim().slice(0, 64)}`);
}

// (c) crosswalk docs must cite VALIDATED_CROSSWALK as the single source of truth.
for (const f of [...walk(join(ROOT, "apps/docs/content/Standardization")),
                  ...walk(join(ROOT, "apps/docs/content/compliance"))]) {
  const txt = readFileSync(f, "utf8");
  const isCrosswalk = /gdprMapping|MK_LPDP|AL_LAW124|controls[ _-]matrix|VALIDATED_CROSSWALK/i.test(txt);
  if (isCrosswalk && !/VALIDATED_CROSSWALK/.test(txt) && !txt.includes(CROSSWALK_SRC))
    note(f, `crosswalk doc does not cite VALIDATED_CROSSWALK (${CROSSWALK_SRC})`);
}

if (errors.length) {
  console.error("check:standards FAILED:\n" + errors.map((e) => "  ✗ " + e).join("\n"));
  process.exit(1);
}
console.log("check:standards OK — single canonical SoA, all controls traceable, crosswalks anchored");
```

> The guardian is minimal and non-breaking: it asserts the **single-canonical-SoA** invariant
> (G1 can't recur) and **SoA traceability**. ADR↔standards cross-link liveness is already enforced
> by the existing `check:md-links` (fence-aware) — no duplication.

---

## Execution order (sequential — same git repo, parallel workers conflict on commits)

1. **Worker 1 — Reconcile & ratify:** T-A, T-B, T-H.
2. **Worker 2 — Missing companion docs:** T-C, T-D.
3. **Worker 3 — AL Law 124:** T-E.
4. **Worker 4 — Cross-link & crosswalk:** T-F, T-G.
5. **Worker 5 — Governance:** T-I, T-J (+ wire `ci:checks`).

Each worker runs `pnpm check:adrs && pnpm check:md-links` after doc/ADR edits and commits with a
polished message. Do **not** create ADRs 0096–0104 or docs that already exist (verified present).

## Verification (Definition of Done)

- `pnpm check:adrs` → all ADRs conform (ADR-0067 now Accepted).
- `pnpm check:md-links` → 0 broken (new cross-links resolve).
- `pnpm check:standards` → single canonical SoA, all SoA rows traceable, crosswalks anchored.
- `pnpm ci:checks` → green with `check:standards` wired in.
- `pnpm --filter docs build` → `EXIT=0` (no `.mmd` regression).

## Premortem

- **2nd SoA re-diverges** → T-A deletes it; T-I guardian fails CI if it returns without the DERIVED marker.
- **AL scope creep** → T-E forces an explicit recorded choice (out-of-scope preferred).
- **Cross-links broken** → T-F + `check:md-links` gate.
- **`rocky-soa.md` re-created** → T-I guardian fails CI.
