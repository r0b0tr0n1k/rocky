# Plan — Frontend Conformity & UX Controls (Rocky)

- **Plan ID:** 2026-07-15-frontend-conformity
- **Governing ADR:** ADR-0105 (Accepted)
- **Posture paper:** ROCKY-FE-001 `compliance/frontend-conformity.md`
- **Canonical SoA:** ROCKY-ISMS-001 `compliance/isms-policy.md`
- **Date:** 2026-07-15
- **Mode:** Draft for execution (sequential workers, like the ISO-standards plan)

---

## 1. Executive summary

The backend conformity story is documented (RBAC, RLS, signed-QR, geofence lockdown,
GDPR / MK LPDP paperwork). The **frontend** carries most of the still-open ISO 27001/27701,
GDPR, and enterprise obligations. This plan makes `apps/web` (admin) and `apps/mob`
(field app) a first-class conformance surface, with **ergonomics (ISO 9241 / WCAG 2.1 AA)
as a first-class workstream** and **browser-verified acceptance** built in. It is governed
by ADR-0105 and anchored to the SoA via ROCKY-FE-001.

## 2. Current state (verified)

- RBAC is **enforced** in the UI (`apps/web/lib/permissions.tsx` → `usePermissions` /
  `useCan`; mob tabs gate on `*:read`). Authority stays server-side via `@Policy`.
- Browser-verified on `/auth/sign-in` (2026-07-15): `lang="en"`, labeled inputs, named
  button — but **no semantic landmarks** and **no skip-link** (WCAG 1.3.1 / 2.4.1 gap).
- **Absent:** CSP/security headers, cookie/consent UI, DSR/erasure UI, i18n (MK↔EN),
  WCAG program, E2E testing, UI audit logging, PII-free telemetry, session-timeout UX.

## 3. Scope & boundaries

- **In scope:** `apps/web`, `apps/mob/app`, `packages/ui` (design system + a11y primitives).
- **Law (GDPR + MK LPDP):** quoted verbatim and claimed as compliance — consent (Art 7),
  DSR/erasure (Arts 12, 15–22), transparency (Art 12–14), local language (MK LPDP).
- **ISO/IEC published standards (27001, 27701, 27034, 25010, 25012, 9241, 40500, 29119,
  25023):** referenced, benchmarked, and strived toward — **never claimed as present-day
  certified conformity**, and no certification mark is used. "Conformity" in ROCKY-FE-001
  means the *posture mapping*, not a certificate.
- **Albanian Law 124:** OUT OF SCOPE (carried from another project; not part of Rocky's
  claim). MK LPDP stays in scope.

## 4. Guiding principles

1. UI permission gating is **presentation**; authority is server-side `@Policy`. Never
   treat client gating as security.
2. Law = claimable compliance. ISO = benchmark, not certification.
3. Ergonomics is a deliverable, verified with the browser harness — not lint alone.
4. No PII (or stack traces) in client telemetry, toasts, or error boundaries.

## 5. Governance

- ADR-0105 (Accepted) governs the program; sub-ADRs 0106+ may be raised for consent / DSR /
  i18n / a11y as they mature.
- ROCKY-FE-001 (`frontend-conformity.md`) is the frontend SoA anchor; it links ADR-0105
  (satisfies `check:standards` invariant a).
- Each landed Wave adds evidence links from the relevant SoA rows (A.5.15/.16/.18, A.5.28,
  A.5.34, A.8.15, A.8.23, A.8.26/.28, A.8.16) to ROCKY-FE-001.
- `check:standards` is unchanged (4 invariants); ROCKY-FE-001 satisfies invariant (a), and
  the SoA stays single-source (invariant b).

## 6. Waves

### Wave 0 — Security baseline (Admin Bot)

- T01 CSP + `X-Frame-Options` / `HSTS` / `X-Content-Type-Options` / `Referrer-Policy` /
  `Permissions-Policy` in `apps/web/next.config.ts` (F-02).
- T02 Record RBAC-as-presentation in ROCKY-FE-001; add SoA evidence link for
  A.5.15/.16/.18 (F-01, maintain).

### Wave 1 — GDPR operational UI (Frontend + Admin Bot)

- T03 Honest cookie-transparency disclosure (NO consent banner — exempt per ROCKY-COOK-001); surfaced in admin shell (F-03, ePrivacy Art 5(3) / GDPR 6(1)(e)).
- T04 DSR / erasure / access-request UI + status wired to `rocky-dsr-procedure.md`
  (ROCKY-DSR-001) and `rocky-erasure-retention-procedure.md` (ROCKY-ERP-001) (F-04, Arts 12, 15–22).
- T05 Privacy-notice presentation + data-minimization cues in forms (F-05, Arts 12–14, 25).

### Wave 2 — Ergonomics & localization (UI + Frontend Bot)

- T06 Semantic landmarks (`<main>` / `<nav>`) + skip-link across the admin shell (F-06).
  **Browser gate:** exactly one `<main>`, `<nav>` present, skip-link first focusable.
- T07 WCAG contrast / focus-order / keyboard pass + a11y lint in CI (F-07). **Browser gate:**
  `inputsNoLabel === 0`, `btnsNoName === 0`, contrast ≥ 4.5:1, full keyboard path.
- T08 i18n MK↔EN scaffolding + locale switcher (F-08, GDPR 12(1), MK LPDP).

### Wave 3 — Quality & assurance (Frontend Bot)

- T09 Playwright E2E + component tests (F-09, ISO 29119).
- T10 SQuaRE 25010 KPI definitions + 25023 measurement harness (F-10).
- T11 UI audit-action logging + PII-free telemetry guard (F-11 / F-12, A.5.28 / A.8.15).

### Wave 4 — Hardening (Admin + Frontend Bot)

- T12 Session timeout + step-up re-auth UX for sensitive admin ops (F-13, A.5.16/.18).
- T13 Frontend SCA / dependency scanning in CI (F-14, A.8.28, ISO 27034).
- T14 PII-safe error boundaries (F-15, GDPR 5(1)(f)).

### Close-out (orchestrator)

- T15 Fold SoA evidence links for all F-xx rows into `isms-policy.md`; list ROCKY-FE-001 in
  `compliance/index.mdx`; run `check:adrs` / `check:md-links` / `check:standards`.
- T16 Browser-verified DoD sweep across key authenticated admin pages (landmarks, skip-link,
  labels, focus order, contrast, keyboard path).

## 7. File inventory

- **Create:** `compliance/frontend-conformity.md` (ROCKY-FE-001), `ADR/0105-*.md`.
- **Modify:** `apps/web/next.config.ts` (headers), `apps/web/app/(admin)/*` + `components/admin-shell.tsx`
  (landmarks, skip-link, RBAC surfacing), `apps/web/lib/*` (consent/DSR/i18n/telemetry hooks),
  `apps/mob/app/*` (consent/DSR/i18n parity), `packages/ui/*` (a11y primitives),
  `compliance/index.mdx`, `compliance/isms-policy.md` (evidence links), `compliance/_meta.ts`.
- **CI:** add a11y lint + Playwright + frontend SCA jobs.

## 8. Verification (Definition of Done)

```
pnpm check:adrs        # 105 ADRs conform
pnpm check:md-links    # no broken links (frontend-conformity.md <-> ADR-0105)
pnpm check:standards  # ROCKY-FE-001 links ADR-0105; SoA single-source
# Browser gate (authenticated admin session) — T06/T07/T16:
#   one <main> + <nav>; skip-link first focusable; inputsNoLabel===0;
#   btnsNoName===0; heading order sane; contrast >= 4.5:1; keyboard path complete
```

## 9. Risks

- WCAG 2.1 AA + EU EAA 2025 is an ongoing program, not a one-shot.
- E2E (Playwright) adds CI time + flake discipline.
- i18n touches many strings; scope Wave 2 to MK↔EN with a clear fallback.

## 10. RobotFarm pass

Update ADR-0105 Related list + ROCKY-FE-001 when a Wave lands; no new Bot description needed
(Admin / Frontend / UI Bots already own the scopes).
