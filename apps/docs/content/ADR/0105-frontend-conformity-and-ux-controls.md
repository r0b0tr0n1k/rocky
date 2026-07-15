# ADR-0105: Frontend Conformity & UX Controls

> Make the frontend (apps/web admin + apps/mob field app) a first-class conformance surface for
> ISO 27001:2022, ISO/IEC 27701:2025, GDPR / MK LPDP, and enterprise engineering practice — including
> ergonomics (ISO 9241 / WCAG 2.1 AA). Resolves the symptom that backend controls were documented
> while the user-facing layer carried most of the unmet obligations.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

The backend conformity story is now documented: RBAC via `Principal` / `PolicyEngine` / `@Policy`
(ADR-0042 / 0022), transaction-scoped RLS, signed-QR credentials (ADR-0084), geofence lockdown
(ADR-0092), and the GDPR / MK LPDP paperwork. But the **frontend** is where most of the still-open
ISO 27001/27701, GDPR, and enterprise obligations actually live:

- **RBAC is genuinely enforced in the UI** — `apps/web/lib/permissions.tsx` delivers the resolved
  `principal.ln` (`usePermissions` / `useCan`), consumed across `users`, `system-parameters`
  (`sm:sysparams:write`), `rbac`, `ear-tags` (`eartag:order`), and `inspections/risk-board`
  (`analysis:read/run`); the mobile tabs gate on `*:read` permissions. UI gating is *presentation*;
  authority stays server-side via `@Policy`.
- **Missing:** CSP / security headers in `next.config.ts`; cookie/consent UI (GDPR Art 7);
  DSR / erasure / access-request UI (Arts 12, 15–22); i18n MK↔EN; a WCAG 2.1 AA program; E2E testing
  (only vitest unit today); UI audit-action logging / PII-free telemetry; session-timeout / step-up
  re-auth UX; defined quality KPIs.
- **Browser-verified gap (2026-07-15, `/auth/sign-in`):** `lang="en"` present, inputs labeled, button
  named — but **no semantic landmarks** (`<main>` / `<nav>` absent) and **no skip-link**. This is a
  representative WCAG 1.3.1 / 2.4.1 defect that the ergonomics workstream must close app-wide.

Backend dependencies: ISMS/PIMS roadmap **ADR-0067**; documentation taxonomy **ADR-0052**; ADR house
standard **ADR-0033**; authorization model **ADR-0042 / 0022**; signed-QR verify page **ADR-0084**.

## Decision

1. **One frontend conformity program, governed here.** `apps/web` (Next.js admin) and `apps/mob`
   (Expo field app) are both in scope; the canonical posture paper is
   [`frontend-conformity.md`](../compliance/frontend-conformity.md) (ROCKY-FE-001), which references
   this ADR and the canonical SoA ([`isms-policy.md`](../compliance/isms-policy.md), ROCKY-ISMS-001).
2. **Security baseline (Wave 0).** Add CSP + `X-Frame-Options` / `HSTS` / `X-Content-Type-Options` /
   `Referrer-Policy` / `Permissions-Policy` in `apps/web/next.config.ts` (A.8.23/.26/.28, ISO 27034,
   GDPR Art 32). RBAC stays server-authoritative; UI gating remains presentation-only.
3. **GDPR operational UI (Wave 1).** Consent / cookie banner wired to `rocky-cookie-notice.md`
   (Art 7, ePrivacy, ISO 27701 6.3.x); DSR / erasure / access-request UI + status wired to
   `rocky-dsr-procedure.md` (ROCKY-DSR-001) and `rocky-erasure-retention-procedure.md` (ROCKY-ERP-001)
   (Arts 12, 15–22); privacy-notice presentation + data-minimization cues in forms (Art 12–14, 25).
4. **Ergonomics & localization (Wave 2).** WCAG 2.1 AA pass — semantic landmarks (`<main>` / `<nav>`),
   skip-link, logical focus order, ≥4.5:1 contrast, keyboard operability, `aria-*` where needed
   (ISO/IEC 40500 = WCAG, ISO 9241-210, EU **EAA 2025**). i18n MK↔EN so MK LPDP transparency holds in
   the local language (GDPR Art 12(1) plain language; MK LPDP local-language mandate).
5. **Quality & assurance (Wave 3).** Playwright E2E + component tests (ISO 29119, A.8.28/.29);
   SQuaRE 25010 quality KPIs (functional suitability, performance efficiency, compatibility,
   usability, reliability, security, maintainability, portability) with 25023 measurement; PII-free
   telemetry + UI audit-action logging (A.5.28, A.8.15/.16).
6. **Hardening (Wave 4).** Session timeout / step-up re-auth for sensitive admin ops (A.5.16/.18);
   frontend SCA / dependency scanning in CI (A.8.28, ISO 27034); error boundaries that never leak
   PII or stack traces.
7. **Browser-verified Definition of Done.** Ergonomics acceptance uses the browser harness
   (`browser_snapshot` accessibility tree + `browser_execute_js` a11y assertions) as the gate, not
   just lint — see Verification.

## Consequences

### Positive

- The user-facing layer is explicitly mapped to the same SoA / GDPR / ISO spine as the backend.
- Ergonomics (ISO 9241 / WCAG) is a first-class, browser-verified workstream, not an afterthought.
- Closes real legal exposure (consent, DSR) and real risk (CSP, no landmarks/skip-link).

### Negative / Cost

- New UI surface area (consent, DSR, i18n) needs its own tests and maintenance.
- WCAG 2.1 AA + EAA 2025 is an ongoing program, not a one-shot commit.
- E2E (Playwright) adds CI time and flake-management discipline.

### Neutral

- RBAC model is unchanged — this ADR governs the *presentation + operational UI*, not the
  authorization engine.

## Implementation

- Owning Bots: **Admin Bot** (scope `apps/web/`), **Frontend Bot** (scope `apps/mob/app/`),
  **UI Bot** (scope `packages/ui/`, design-system + a11y primitives) per the RobotFarm index.
- RobotFarm pass: update this ADR's Related list and `frontend-conformity.md` when a Wave lands;
  add SoA evidence links from the touched controls (A.5.15/.16/.18, A.5.28, A.5.34, A.8.15, A.8.23,
  A.8.26/.28, A.8.16) to ROCKY-FE-001.
- Sub-ADRs (0106+) may be raised during execution for consent / DSR / i18n / a11y as they mature;
  this ADR remains the umbrella.

## Verification (Definition of Done)

```bash
pnpm check:adrs        # 105 ADRs conform (this one included)
pnpm check:md-links    # no broken links (incl. frontend-conformity.md ↔ ADR-0105)
pnpm check:standards  # ROCKY-FE-001 carries its governing-ADR link; SoA single-source
# Ergonomics gate (browser harness, authenticated admin session):
#   - document has exactly one <main> landmark and a <nav>; skip-link present & first focusable
#   - all form controls have a programmatic label (inputsNoLabel === 0)
#   - all buttons/icons have an accessible name (btnsNoName === 0)
#   - heading order starts at H1 and never skips a level
#   - computed text/background contrast >= 4.5:1 on sampled components
#   - full keyboard path reaches every primary action (no mouse-only traps)
```

## Anti-Patterns (do not repeat)

1. Do not ship consent / DSR UI without wiring it to the existing `rocky-*` procedure papers.
2. Do not treat UI permission gating as security — authority is server-side `@Policy`.
3. Do not claim WCAG / ISO conformity in the UI copy; benchmark, do not certify.
4. Do not put PII (or stack traces) into client telemetry, toasts, or error boundaries.

## Related ADRs

- **ADR-0067** — ISMS/PIMS posture roadmap; this program is its user-facing half.
- **ADR-0052** — documentation taxonomy (Diátaxis); ROCKY-FE-001 lives in `compliance/`.
- **ADR-0033** — ADR house standard; this ADR conforms to it.
- **ADR-0042 / 0022** — `PrincipalResolver` / authorization model the UI consumes.
- **ADR-0084** — signed-QR credential verify page (a GDPR Art 25 / A.5.28 frontend surface).
- **ADR-0104** — architecture diagrams + software-engineering ISO standards map referenced here.
