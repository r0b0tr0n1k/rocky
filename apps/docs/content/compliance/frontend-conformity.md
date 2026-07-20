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
| F-06 | Semantic landmarks + skip-link | WCAG 1.3.1 / 2.4.1; ISO 9241-210 | IMPLEMENTED | `admin-shell.tsx` (skip-link + `<main id="main-content">` + `role="navigation"`); closed by 2026-07-15-frontend-conformity T06/T16 | — (maintain) |
| F-07 | Contrast / keyboard / focus order | WCAG 1.4.3 / 2.1.1; ISO 9241-210, 9241-161, 9241-171 | PARTIAL | landmarks + skip-link done (F-06); `:focus-visible` ring added to `globals.css` (9241-161 §6 + 9241-171 §9.2.2); contrast still needs audit | 2 |
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

## Governing ergonomics instruments (ISO-9241-* skills)

Per ADR-0105, the repo's `iso-9241-*` skill suite is the canonical benchmark for the
ergonomics workstream — not a parallel doc. Each ergonomics change cites its governing skill:

| Skill (canonical authority) | Covers | Use |
| --- | --- | --- |
| `.agents/skills/iso-software-skills/skills/iso-9241-110/ISO-9241-110_SKILL.md` | Dialogue principles (suitability for task, self-descriptiveness, controllability, error tolerance, individualization) | Dialogues, undo/recovery, individualization |
| `.agents/skills/iso-software-skills/skills/iso-9241-12/ISO-9241-12_SKILL.md` | Presentation of information (coding, contrast) | Contrast, coding |
| `.agents/skills/iso-software-skills/skills/iso-9241-143/ISO-9241-143_SKILL.md` | Forms (labels, navigation, user control, validation) | Forms, destructive-action guards |
| `.agents/skills/iso-software-skills/skills/iso-9241-151/ISO-9241-151_SKILL.md` | Web UI (navigation, site map) | Admin pages, breadcrumbs |
| `.agents/skills/iso-software-skills/skills/iso-9241-161/ISO-9241-161_SKILL.md` | Visual UI elements (states, focus distinguishability) | Component states, focus-visible |
| `.agents/skills/iso-software-skills/skills/iso-9241-171/ISO-9241-171_SKILL.md` | Software accessibility (WCAG 2.4.7 focus visible, keyboard) | a11y, focus-visible, reduced-motion |
| `.agents/skills/iso-software-skills/skills/iso-9241-210/ISO-9241-210_SKILL.md` | Human-centred design | Process |
| `.agents/skills/iso-software-skills/skills/iso-9241-410/ISO-9241-410_SKILL.md` | Physical input devices (keyboard) | Keyboard operability |
| `.agents/skills/iso-software-skills/skills/iso-9241-420/ISO-9241-420_SKILL.md` | Selection of physical input devices | Input selection |
| `.agents/skills/iso-software-skills/skills/iso-9241-920/ISO-9241-920_SKILL.md` | Tactile/haptic interaction | N/A (web) |
| `.agents/skills/iso-software-skills/skills/iso-tr-9241-100/ISO-TR-9241-100_SKILL.md` | Intro to the 9241 series | Orientation |

> **9241-500 (environments) was considered and rejected as out of scope** for the web admin
> dashboard (no physical/environmental workplace ergonomics surface).

### Ergonomics posture — verified 2026-07-19 (this plan)

The `2026-07-19-frontend-iso-guidance` plan audited the working tree and found the prior
`2026-07-15-frontend-conformity` (T06/T16) work — plus `table-card.tsx` — already
**closed G1–G5** (reduced-motion + scrollbar, skip-link + `<main>` landmarks, breadcrumbs,
standardized `PageHeader`, density + saved views). That plan therefore owns only the two genuinely
open items: **focus-visible rings** (added to `globals.css`, satisfying 9241-161 §6 + 9241-171
§9.2.2) and **high-risk-action Undo** (sonner Undo on RBAC revoke in `rbac/page.tsx`,
satisfying 9241-110 §4.7/§4.8 + 9241-143 §6.5). The `documents` / `movement-detail`
delete paths carry the same treatment as a follow-up once their in-flight WIP lands.

## Menu & navigation ergonomics (ADR-0108)

Navigation & menu surfaces were out of scope for the initial conformity pass. **ADR-0108**
([`0108-menu-navigation-ergonomics.md`](../ADR/0108-menu-navigation-ergonomics.md)) governs their
ISO-9241-aligned redesign, benchmarked against the repo's `iso-9241-*` skills with `DESIGN.vercel.md`
as a scoped, non-governing visual-token reference. Control rows:

| ID | Surface / move | Standard | Status | Note |
| --- | --- | --- | --- | --- |
| M-01 | Nav labels never hidden (M1) | ISO 9241-110 §4.4, 9241-151 | PLANNED | icon-collapse → opt-in + label peek |
| M-02 | Menu item state matrix (M2) | ISO 9241-161 §6, 9241-12 | PLANNED | rest/hover/focus/current/disabled, > color |
| M-03 | One canonical `RowMenu` (M3) | ISO 9241-143, 9241-110 §4.4, 9241-12 | PLANNED | collapse `RowActions`+`RowActionMenu`; `kind` |
| M-04 | Destructive via one path (M4) | ISO 9241-110 §4.8, 9241-143 §6.5 | PLANNED | `ActionDialog` alert + sonner Undo |
| M-05 | Keyboard-first nav (M5) | ISO 9241-171, 9241-410/420 | PLANNED | arrow traversal, Escape, focus restore |
| M-06 | Workflow regroup + ⌘K (M6) | ISO 9241-110 §4.2, 9241-151 | PLANNED | 29 items by workflow; palette deep-nav |

Status definitions follow the control-mapping legend above. `apps/mob` is tracked separately
(different navigation model).

## Remediation program

The execution plan (`.pi/plans/2026-07-15-frontend-conformity/plan.md`) sequences
the fifteen controls above into four Waves (0 security baseline → 1 GDPR
operational UI → 2 ergonomics & localization → 3 quality & assurance → 4
hardening). Each Wave lands evidence links back to the relevant SoA rows in
`isms-policy.md` (ROCKY-ISMS-001).

## Governing decision

[ADR-0105 — Frontend Conformity & UX Controls](../ADR/0105-frontend-conformity-and-ux-controls.md)
(Status: Accepted).
