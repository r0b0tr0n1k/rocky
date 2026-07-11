# Cookie & Tracking Notice — Rocky

> _sniffs_ Most sites need a consent banner. Rocky does not — its cookies are
> strictly necessary for the service the user explicitly requested (authentication
> under official control), which ePrivacy exempts. This notice records that
> exemption honestly, so the auditor sees we _considered_ it.

| Document field | Value |
| --- | --- |
| **Title** | Cookie & Tracking Notice — Rocky |
| **Reference** | ROCKY-COOK-001 |
| **Version** | 0.1.0-draft (harvest of actual cookie use) |
| **Status** | Draft — exemption recorded; not a conformity assessment |
| **Owner** | Docs Bot, co-owned with Auth / Web Bots |
| **Classification** | Public |
| **Next review** | On Phase 2 completion (see ADR-0067) |
| **Related** | ROCKY-PRIV-001; ROCKY-LBR-001; ADR-0067; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Legal basis for cookies (ePrivacy Art 5(3) / GDPR Art 6)

Storage of / access to information on a user's terminal equipment requires consent
**except where strictly necessary** for a service explicitly requested by the user.
Rocky's processing rests on **Article 6(1)(e)** (official authority), never on
consent — so cookie consent is irrelevant to the processing itself.

## 2. Cookies we set (strictly necessary — exempt)

| Cookie | Purpose | Basis |
| --- | --- | --- |
| Session auth (Better Auth) | Maintain signed-in session | Strictly necessary — exempt |
| CSRF token (if present) | Request forgery protection | Strictly necessary — exempt |

These are required for the service the user explicitly requests. **No consent banner is implemented, because none is required.**

## 3. What we do NOT set

- **No analytics cookies** (no traffic/behaviour tracking).
- **No advertising / marketing cookies.**
- **No cross-site tracking or third-party advertising cookies.**
- The docs site (Nextra) and web admin panel set only the session cookie above.

## 4. Mobile application

The Expo mobile app does **not** use browser cookies; it stores credentials in
OS secure storage (Expo Secure Store). The same data-minimisation and
official-control basis apply. See ROCKY-PRIV-001.

## 5. Consent management (A.1.2.4 / .5)

Rocky has **no consent-based processing** — the lawful basis is official control
(ROCKY-LBR-001). The ISO 27701 consent controls (A.1.2.4 / .5) are therefore
**not applicable** to Rocky's core processing.

## 6. Transparency

This exemption is disclosed in the public Privacy Notice (ROCKY-PRIV-001). Should
any non-essential cookie ever be introduced (e.g. analytics), a consent mechanism
would be required at that point.

> _rubs nose vigorously_ No banner, no theatre — just the strictly-necessary
> session cookie, exempt by law, and the paper to prove we knew.
