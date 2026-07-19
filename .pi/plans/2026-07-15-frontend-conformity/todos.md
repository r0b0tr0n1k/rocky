# Todos — Frontend Conformity & UX Controls (ADR-0105)

Sequential, worker-executable. Each todo: id, title, owner bot, files, acceptance.

## Wave 0 — Security baseline

- [ ] **T01** CSP + security headers in next.config.ts
  - Owner: Admin Bot | Files: `apps/web/next.config.ts`
  - Acceptance: `headers()` returns CSP (default-src 'self'), X-Frame-Options=DENY,
    HSTS, X-Content-Type-Options=nosniff, Referrer-Policy, Permissions-Policy.
    ROCKY-FE-001 F-02 -> PARTIAL (evidence linked). No console/CSP violations on load.
- [ ] **T02** Record RBAC-as-presentation; SoA evidence link
  - Owner: Admin Bot | Files: `compliance/frontend-conformity.md`, `compliance/isms-policy.md`
  - Acceptance: ROCKY-FE-001 F-01 notes UI gating is presentation; isms-policy A.5.15/.16/.18
    gain an evidence link to ROCKY-FE-001.

## Wave 1 — GDPR operational UI

- [ ] **T03** Honest cookie-transparency disclosure (NO consent banner — exempt per ROCKY-COOK-001)
  - Owner: Admin Bot | Files: `apps/web/components/admin-shell.tsx`
  - Acceptance: user menu carries a "Cookie & Tracking Notice" item opening a dialog stating the
    strictly-necessary session cookie is ePrivacy/GDPR 6(1)(e) exempt; no analytics/tracking cookies.
    ROCKY-FE-001 F-03 -> N/A (exempt). (ePrivacy Art 5(3) / GDPR 6(1)(e).)
- [ ] **T04** DSR / erasure / access-request UI + status
  - Owner: Admin Bot | Files: `apps/web/app/(admin)/*` (new routes)
  - Acceptance: authenticated user can open DSR/erasure request; status reflects
    ROCKY-DSR-001 / ROCKY-ERP-001. ROCKY-FE-001 F-04 -> PARTIAL. (Arts 12, 15–22.)
- [ ] **T05** Privacy-notice presentation + data-minimization cues
  - Owner: Frontend Bot | Files: `apps/web/app/*`, `packages/ui/*`
  - Acceptance: privacy notice reachable from shell; forms show why/legal-basis hint
    and minimum-field markers. ROCKY-FE-001 F-05 -> IMPLEMENTED. (Arts 12–14, 25.)

## Wave 2 — Ergonomics & localization (BROWSER-VERIFIED)

- [ ] **T06** Semantic landmarks + skip-link
  - Owner: UI Bot + Admin Bot | Files: `apps/web/components/admin-shell.tsx`, `(admin)/layout*`
  - Acceptance: **browser gate** — exactly one `<main>`, a `<nav>`, skip-link is first
    focusable element. ROCKY-FE-001 F-06 -> PARTIAL.
- [ ] **T07** WCAG contrast / focus / keyboard pass + a11y lint in CI
  - Owner: UI Bot | Files: `packages/ui/*`, `apps/web` components, CI config
  - Acceptance: **browser gate** — inputsNoLabel===0, btnsNoName===0, heading order sane,
    sampled contrast >= 4.5:1, full keyboard path reaches every primary action.
    a11y lint (jsx-a11y) green in CI. ROCKY-FE-001 F-07 -> PARTIAL.
- [ ] **T08** i18n MK<->EN scaffolding + locale switcher
  - Owner: Frontend Bot | Files: `apps/web/lib/i18n/*`, `apps/web/app/*`, `apps/mob/app/*`
  - Acceptance: MK + EN locales load; shell + key flows localize; switcher persists.
    ROCKY-FE-001 F-08 -> PARTIAL. (GDPR 12(1), MK LPDP local language.)

## Wave 3 — Quality & assurance

- [ ] **T09** Playwright E2E + component tests
  - Owner: Frontend Bot | Files: `apps/web/e2e/*`, `apps/web/**/*.test.tsx`, CI config
  - Acceptance: E2E covers sign-in, RBAC-gated route, DSR flow; component tests for
    a11y primitives. ROCKY-FE-001 F-09 -> PARTIAL. (ISO 29119.)
- [ ] **T10** SQuaRE 25010 KPI defs + 25023 measurement
  - Owner: Frontend Bot | Files: `apps/web/lib/quality/*`, dashboards
  - Acceptance: KPI definitions for the 8 SQuaRE characteristics; measurement harness
    emits 25023-style report. ROCKY-FE-001 F-10 -> PARTIAL.
- [ ] **T11** UI audit-action logging + PII-free telemetry
  - Owner: Frontend Bot + Admin Bot | Files: `apps/web/lib/audit.ts`, `apps/web/lib/telemetry.ts`
  - Acceptance: sensitive admin actions emit audit events; telemetry redacts PII
    (no email/PII in payloads). ROCKY-FE-001 F-11/F-12 -> PARTIAL. (A.5.28 / A.8.15.)

## Wave 4 — Hardening

- [ ] **T12** Session timeout + step-up re-auth UX
  - Owner: Admin Bot | Files: `apps/web/lib/session.tsx`, `apps/web/app/(admin)/*`
  - Acceptance: idle timeout warns + locks; sensitive ops require re-auth.
    ROCKY-FE-001 F-13 -> PARTIAL. (A.5.16 / .18.)
- [ ] **T13** Frontend SCA / dependency scanning in CI
  - Owner: Admin Bot | Files: CI config
  - Acceptance: dependency audit job fails on high-severity advisories.
    ROCKY-FE-001 F-14 -> PARTIAL. (A.8.28, ISO 27034.)
- [ ] **T14** PII-safe error boundaries
  - Owner: Frontend Bot | Files: `apps/web/components/error-boundary.tsx`
  - Acceptance: errors show generic message; no PII/stack in UI or logs.
    ROCKY-FE-001 F-15 -> PARTIAL. (GDPR 5(1)(f).)

## Close-out (orchestrator)

- [ ] **T15** Fold SoA evidence links; update index + run guardians
  - Owner: orchestrator | Files: `compliance/isms-policy.md`, `compliance/index.mdx`, `compliance/_meta.ts`
  - Acceptance: all F-xx rows linked from SoA; ROCKY-FE-001 listed; `check:adrs` /
    `check:md-links` / `check:standards` green.
- [ ] **T16** Browser-verified DoD sweep (authenticated admin)
  - Owner: orchestrator/visual | Files: live app
  - Acceptance: T06/T07 browser assertions pass across /dashboard, a RBAC-gated route,
    and the DSR flow.
