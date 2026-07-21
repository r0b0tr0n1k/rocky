# Scout Context: Farmer/Vet Documentation

## Project Overview

This is **Rocky** — a livestock/cattle tracking system for the Republic of North Macedonia's veterinary and agricultural administration. It covers the full lifecycle of cattle: birth registration, ear tagging, movement tracking, health/vaccination management, passport issuance, and inspection management.

## Target Users

- **Farmers** — register animals, order ear tags, record births/deaths/movements, manage vaccinations, view passports, receive inspection results
- **Veterinarians** — conduct health inspections, record treatments/diagnoses, manage lab tests, oversee disease control, perform on-spot inspections
- **Admin Users** (web app) — manage farms, users, compliance, audits, system config

## Mobile App (`apps/mob/`) — Farmer/Vet Primary Interface

Expo React Native app with tab navigation:

### Feature Tabs (what farmers/vets can do)

1. **Animals** — search, view detail, register birth, create animal record
2. **Ear Tags** — create orders, collect/receive tags
3. **Health** — record vaccinations, treatments, lab tests; view health index
4. **Movements** — record death, pasture, slaughter movements
5. **Inspections** — view inspection schedule/results
6. **Passports** — view animal passports
7. **Corrections** — request error corrections
8. **Notifications** — alerts and updates
9. **Sync** — offline sync status

### Auth — sign in, sign up, forgot/reset password

### Design: shadcn/ui components, Expo Router file-based routing

## Web Admin (`apps/web/`) — Back Office Interface

Next.js admin panel with:

- Animals (CRUD), Archive, Audit log, Corrections
- Dashboard, Devices, Documents, Ear Tags, Farm Books
- Farms, Feature Flags, Geo (spatial), Health
- Inspections (+ risk-board), IoT, Movement Lineage
- Movements, Notifications, Organizations, Passports
- RBAC (roles/permissions), Subjects (users), Sync

## Domain Packages (`packages/domains/`)

Each domain has a service layer, repository layer, errors, and tests:

| Domain | Key Concepts | Farmer/Vet Relevance |
|--------|-------------|---------------------|
| **Animal** | Birth registration, species tagging rules, status management | **High** — core activity |
| **Farm** | CRUD, keeper management, farm_subjects | **High** — context for all activity |
| **Movement** | Death, pasture, slaughter, market, import/export; EU 7-day transmission window | **High** — legal obligation |
| **Passport** | Lifecycle (ACTIVE→SEIZED→REPRINTED→CANCELLED), issuance, seizure | **High** — legal document |
| **Health** | Diseases, vaccinations (batch expiry/age validation), treatments, lab tests | **High** — vet's domain |
| **EarTag** | 6-stage order lifecycle (DRAFT→SUBMITTED→CONFIRMED→SHIPPED→RECEIVED→COMPLETED), stock, check digits | **High** — farmer's domain |
| **Inspection** | Risk analysis (10% annual selection), on-spot inspection workflow, VI forms | **Medium-High** — annual event |
| **Correction** | A priori + a posteriori error correction, plausibility engine | **Medium** — exception handling |
| **Audit** | Lifecycle events, audit trail | **Low** — transparent to users |
| **Archive** | 3-tier document archive, 3-year retention | **Low-Medium** — document management |
| **IoT** | Device registry, sensor readings, geofences | **Low** — infrastructure |
| **Geo** | Spatial queries, disease zones, geofence events | **Medium** — disease zones |
| **Notification** | User-facing notifications | **Medium** — alerts |

## Business Rules Driving Workflows (need explanation in docs)

1. **EU Animal ID** — ear tag format rules (MK_8 8-digit + check digit, ISO_11784_15 15-digit)
2. **Tag Before Move** — Implementing Reg (EU) 2021/520 Art. 13(4)
3. **7-day Transmission Window** — Art. 3 for movement reporting
4. **Species Tagging Rules** — max days from birth to tag based on species
5. **Passport Requirement** — issuance before movement
6. **10% Risk Analysis** — annual inspection selection
7. **3-year Retention** — document archive requirements
8. **Notifiable Diseases** — mandatory reporting → triggers inspection flagging

## Existing Documentation Site (`apps/docs/`)

- **Framework**: Next.js + Nextra 4 Docs Theme
- **Taxonomy**: Diátaxis (tutorials / how-to / explanation / reference)
- **Current audience**: **Developers** (ADRs, architecture docs, API reference, how-to for devs)
- **Content structure**:
  - `/tutorials/` — developer onboarding ("Get Started")
  - `/how-to/` — developer tasks (add domain service, write ADR, run DB migration)
  - `/explanation/` — architecture narratives
  - `/reference/` — API reference, permissions/enums catalog, error codes
  - `/ADR/` — 50+ architectural decision records
  - `/compliance/`, `/Standardization/` — ISO 27001/27701 docs
  - `/runbooks/` — operational procedures
- **No existing farmer/vet-facing content** — this is entirely new.

## i18n/Locale

- No i18n framework found in apps/mob/ or packages/ (only PDF i18n.typ for Typst templates)
- Farmers/vets in North Macedonia likely need content in **Macedonian** (primary) and possibly **Albanian** and **English**
- This is a critical consideration for the documentation plan

## Design Docs

- `DESIGN.clay.md` — UX/design guidelines (likely)
- The system uses @rocky/ui shadcn components for design consistency

## Key Observations for Planning

1. **Zero existing user-facing docs** — clean slate opportunity
2. **Need to explain both "what" (concepts) and "how" (steps)** — Diátaxis is perfect for this
3. **Farmers and vets have different knowledge levels** — farmers know livestock but not software; vets know health but not necessarily the regulatory system
4. **Regulatory compliance is a key driver** — docs must help users avoid legal penalties (late reporting = fines)
5. **Mobile-first** — primary interface is the phone app, docs should focus on mobile workflows
6. **Web admin** — more complex features for back-office users
7. **Offline sync** — the app works offline, docs should explain expectations
8. **No existing i18n** — docs are English-only currently, but users need localized content
