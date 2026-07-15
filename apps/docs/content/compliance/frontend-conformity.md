---
title: "Rocky — Frontend Conformity Posture"
sidebarTitle: "Frontend Conformity Posture"
document_title_mk: "Роки — Позиција на усогласеност на корисничкиот интерфејс"
document_identifier: "ROCKY-FE-001"
version_number: "0.1.0-draft"
date_of_issue: "2026-07-15"
author_organization: "RobotFarm / Architecture Review"
document_type: "Frontend Conformity Posture (not a conformity assessment)"
scope: "User-facing applications: apps/web (Next.js admin) and apps/mob (Expo field app)"
purpose: >
  Record the frontend's current conformity posture against ISO 27001:2022,
  ISO/IEC 27701:2025, GDPR / MK LPDP, and enterprise engineering practice —
  including ergonomics (ISO 9241 / WCAG 2.1 AA) — and point each obligation to
  its status, evidence, and remediation Wave. This is the frontend half of the
  ISMS/PIMS posture (ROCKY-ISMS-001) and is governed by ADR-0105.
applicability: "apps/web, apps/mob/app, packages/ui"
references:
  - "ROCKY-ISMS-001 (isms-policy.md) — canonical Statement of Applicability"
  - "ADR-0105 — Frontend Conformity & UX Controls (governing ADR)"
  - "rocky-cookie-notice.md (ROCKY-CKN-001) — ePrivacy / cookie notice"
  - "rocky-dsr-procedure.md (ROCKY-DSR-001) — Art 12–22 DSR flow"
  - "rocky-erasure-retention-procedure.md (ROCKY-ERP-001) — Art 17 erasure"
  - "rocky-privacy-notice.md — Art 13/14 transparency notice"
  - "../Standardization/iso-software-engineering-standards-map.md — engineering ISO map"
confidentiality_level: "Internal"
change_history:
  - "0.1.0-draft — initial frontend posture authored from codebase + browser inspection"
review_date: "2026-10-15"
status: "DRAFT — POSTURE ONLY"
---

# Rocky — Frontend Conformity Posture

> **This document is NOT an ISO/IEC 27001:2022 or ISO/IEC 27701:2025 conformity
> assessment, and it makes NO claim of certification.** It records the frontend's
> *current* posture so the standards can be mapped onto a real substrate. Rocky
> references and benchmarks against the ISO/IEC published standards and the GDPR /
> MK LPDP law; it strives to meet or exceed them. It does not assert present-day
> certified conformity, and uses no certification mark. The governing decision is
> [ADR-0105](../ADR/0105-frontend-conformity-and-ux-controls.md).

## How this fits the documentation stack

The posture papers relate as set out in Table 1.

**Table 1 — How this fits the documentation stack**

| Document | Role | Status |
| --- | --- | --- |
| `isms-policy.md` (ROCKY-ISMS-001) | Canonical SoA — spine | Adopted |
| `frontend-conformity.md` (ROCKY-FE-001) | Frontend posture (this) | Draft |
| `rocky-*-procedure.md` (GDPR papers) | Law procedures the UI shall invoke | Draft |
| ADR-0105 | Governing ADR for the frontend program | Accepted |

## Current state (verified 2026-07-15)

- **RBAC is enforced in the UI.** `apps/web/lib/permissions.tsx` delivers the
  resolved `principal.ln` (`usePermissions` / `useCan`), consumed across
  `users`, `system-parameters` (`sm:sysparams:write`), `rbac`, `ear-tags`
  (`eartag:order`), and `inspections/risk-board` (`analysis:read/run`). The
  mobile tabs gate on `*:read` permissions. UI gating is *presentation*;
  authority is server-side via `@Policy` (ADR-0042 / 0022).
- **Browser-verified (authenticated-equivalent `/auth/sign-in`):** `lang="en"`
  present, inputs labeled, Submit button named — but **no semantic landmarks**
  (`<main>` / `<nav>` absent) and **no skip-link**. Representative WCAG 1.3.1 /
  2.4.1 defect to close app-wide.
- **Absent:** CSP / security headers; cookie/consent UI; DSR / erasure UI;
  i18n (MK↔EN); WCAG 2.1 AA program; E2E testing (only vitest unit); UI
  audit-action logging; PII-free telemetry; session-timeout / step-up re-auth UX.

## Control mapping

Status vocabulary: **IMPLEMENTED** (shipped, evidenced) · **PARTIAL** (present
but incomplete) · **PLANNED** (gap, scheduled in a Wave) · **EXEMPT** (not applicable / exempt per cited paper; outside the SoA scheme).

Table 2 maps each obligation to its status, evidence and remediation Wave.

**Table 2 — Control mapping**

| # | Obligation | Standard anchor | Status | Evidence | Wave |
| --- | --- | --- | --- | --- | --- |
| F-01 | UI access control / RBAC gating | A.5.15 / .16 / .18 | IMPLEMENTED | `lib/permissions.tsx`, mob tabs | — (maintain) |
| F-02 | Security headers / CSP | A.8.23 / .26 / .28; ISO 27034; GDPR 32 | PLANNED | none in `next.config.ts` | 0 |
| F-03 | Cookie / consent management | GDPR 7; ePrivacy; ISO 27701 6.3.x | EXEMPT | `rocky-cookie-notice.md`; honest disclosure added to admin shell (no consent banner) | 1 |
| F-04 | DSR / erasure / access request UI | GDPR 12, 15–22; ISO 27701 | PLANNED | `rocky-dsr-procedure.md` (unwired) | 1 |
| F-05 | Privacy notice + data minimization | GDPR 12–14, 25; A.5.34 | PARTIAL | notice exists; no form cues | 1 |
| F-06 | Semantic landmarks + skip-link | WCAG 1.3.1 / 2.4.1; ISO 9241-210 | PLANNED | browser-verified gap | 2 |
| F-07 | Contrast / keyboard / focus order | WCAG 1.4.3 / 2.1.1; ISO 9241-210 | PLANNED | none audited | 2 |
| F-08 | Localization MK↔EN (i18n) | GDPR 12(1); MK LPDP; ISO 25010 | PLANNED | none | 2 |
| F-09 | E2E + component testing | ISO 29119; A.8.28 / .29 | PARTIAL | vitest unit only | 3 |
| F-10 | Quality KPIs (SQuaRE 25010/25023) | ISO 25010 / 25023 | PLANNED | none | 3 |
| F-11 | UI audit-action logging | A.5.28; A.8.15 / .16 | PLANNED | none from client | 3 |
| F-12 | PII-free telemetry | GDPR 5(1)(f); A.5.28; A.8.10 | PLANNED | none enforced | 3 |
| F-13 | Session timeout / step-up re-auth | A.5.16 / .18 | PLANNED | none in UI | 4 |
| F-14 | Frontend SCA / dep scanning | A.8.28; ISO 27034 | PLANNED | none | 4 |
| F-15 | PII-safe error boundaries | GDPR 5(1)(f); A.8.10 | PLANNED | none enforced | 4 |

## Ergonomics is a first-class workstream

Per ADR-0105, ergonomics (ISO 9241 / WCAG 2.1 AA / EU EAA 2025) is not an
afterthought: Wave 2 establishes landmarks, skip-link, focus order, contrast, and
keyboard operability, and the browser harness (`browser_snapshot` + `browser_execute_js`
a11y assertions) is the acceptance gate — not lint alone. MK LPDP requires the
local language, so i18n (F-08) is a transparency obligation, not a nicety.

## Remediation program

The execution plan (`.pi/plans/2026-07-15-frontend-conformity/plan.md`) sequences
the fifteen controls above into four Waves (0 security baseline → 1 GDPR
operational UI → 2 ergonomics & localization → 3 quality & assurance → 4
hardening). Each Wave lands evidence links back to the relevant SoA rows in
`isms-policy.md` (ROCKY-ISMS-001).

## Governing decision

[ADR-0105 — Frontend Conformity & UX Controls](../ADR/0105-frontend-conformity-and-ux-controls.md)
(Status: Accepted).
