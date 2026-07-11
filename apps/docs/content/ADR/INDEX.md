# ADR Index

All Architecture Decision Records for the Rocky monorepo, grouped by cluster. 66 records total.

### Core Backend / Architecture (0001-0032)

| ADR | Title |
| --- | --- |
| ADR-0001 | Authentication vs. Authorization Boundary |
| ADR-0002 | Principal as Canonical Runtime Actor |
| ADR-0003 | Execution Pipeline as Composable Stages |
| ADR-0004 | Policy Actions, Not Permissions |
| ADR-0005 | Transport Adapters in `apps/api/adapters/` |
| ADR-0006 | RLS via Transactional Connection |
| ADR-0007 | Audit via Lifecycle Events |
| ADR-0008 | Testing Doctrine — Diamond Seal Testing Infrastructure |
| ADR-0009 | Document Generation Architecture — Scalable YAML/XML Framework |
| ADR-0010 | Date Coercion Architecture |
| ADR-0011 | Diamond Seal Layer Boundaries |
| ADR-0012 | Transactional Outbox for Domain Events |
| ADR-0013 | Principal Caching Strategy |
| ADR-0014 | Cross-Domain Event Decoupling via Outbox |
| ADR-0015 | PDA Sync Conflict Resolution via Error Corrections |
| ADR-0016 | Subversive Audit Metadata Injection |
| ADR-0017 | Frontend Architecture — Type-Safe Admin Shell on the Diamond Seal |
| ADR-0018 | API Validator Schema Design (Diamond Seal Guillotines) |
| ADR-0019 | Two Type Contracts — The Dialectic from Postgres to tRPC Client |
| ADR-0020 | Pragmatic Marxist Doctrine for Testing, Documentation, and Observability |
| ADR-0021 | Better Auth Configuration & Session Resolution |
| ADR-0022 | Authorization Policy Engine |
| ADR-0023 | Business-Rule Adoption & Source-to-Code Traceability |
| ADR-0024 | Ear Tag Order Lifecycle & Numbering |
| ADR-0025 | Animal Registration & Movement Rules |
| ADR-0026 | Health & Disease Domain |
| ADR-0027 | Farm & Holder (HK) Domain + Subject Roles |
| ADR-0028 | Risk Analysis & On-Spot Inspection |
| ADR-0029 | Passport Lifecycle & Archive Retention |
| ADR-0030 | Jurisdiction-Configurable Rule Engine |
| ADR-0031 | IoT & Connectivity Abstraction (Optional, Future-Facing) |
| ADR-0032 | tRPC Transport Architecture & Mandatory `@Output` Schemas (Preventing TS6059 & Circular Dependencies) |


### Frontend & Mobile (0033-0060)

| ADR | Title |
| --- | --- |
| ADR-0033 | Frontend & Mobile Architecture-Decision Standard (Beyond Features) |
| ADR-0034 | Client Surface Inventory — `AppRouter` Procedure → Screen Map |
| ADR-0035 | Rendering & Data-Fetching Standard (Web & Mobile) |
| ADR-0036 | Offline-first Sync Architecture (Mobile) |
| ADR-0037 | Design System & Theming (Web & Mobile) |
| ADR-0038 | Forms & Validation (Web & Mobile) |
| ADR-0039 | Navigation & Routing (Web + Mobile) |
| ADR-0040 | i18n & RTL (Web & Mobile) |
| ADR-0041 | Error / Empty / Loading UX (Web & Mobile) |
| ADR-0042 | Permission-Aware UI (Web + Mobile) |
| ADR-0043 | Push Notifications, Background Sync & Deep-link (Mobile) |
| ADR-0044 | Livestock Domain Feature (Web + Mobile) |
| ADR-0045 | Health Domain Feature (Web + Mobile) |
| ADR-0046 | Inspections / Corrections Domain Feature (Web + Mobile) |
| ADR-0047 | Infrastructure (IoT / Devices) Domain Feature (Web + Mobile) |
| ADR-0048 | Administration Domain Feature (Web + Mobile) |
| ADR-0049 | Client Auth & Session Architecture |
| ADR-0050 | Frontend ↔ Backend Contract Synchronization |
| ADR-0051 | Web ↔ Mobile Page Matrix & Navigation Logic |
| ADR-0052 | Documentation Architecture (Diátaxis + Audience) |
| ADR-0053 | Geo Module: INSPIRE / NUTS-LAU Hierarchy + PostGIS Polygons + LPIS Cadastre |
| ADR-0054 | Regulatory Compliance Framework: Digital International Law |
| ADR-0055 | Web Admin Feature Parity with Backend |
| ADR-0056 | Web UI — Tier 0 (Presence) |
| ADR-0057 | Web UI — Tier 1 Lifecycle (Regulatory Core) |
| ADR-0058 | Web UI — Tier 1 Operational |
| ADR-0059 | Web UI — Tier 2 Deepen |
| ADR-0060 | Web UI Component & Feedback Map |


### Regulatory, Geo & Recent Architecture (0053-0067)

| ADR | Title |
| --- | --- |
| ADR-0053 | Geo Module: INSPIRE / NUTS-LAU Hierarchy + PostGIS Polygons + LPIS Cadastre |
| ADR-0054 | Regulatory Compliance Framework: Digital International Law |
| ADR-0055 | Web Admin Feature Parity with Backend |
| ADR-0056 | Web UI — Tier 0 (Presence) |
| ADR-0057 | Web UI — Tier 1 Lifecycle (Regulatory Core) |
| ADR-0058 | Web UI — Tier 1 Operational |
| ADR-0059 | Web UI — Tier 2 Deepen |
| ADR-0060 | Web UI Component & Feedback Map |
| ADR-0061 | GDPR — Right-to-be-Forgotten vs Mandatory Retention (Detailed Plan) |
| ADR-0062 | IMSOC / CHED-A Document Generation (WO-121) |
| ADR-0063 | EUDR 2023/1115 Due-Diligence (WO-115) |
| ADR-0064 | Disease-Zone Spatial Block (WO-119) |
| ADR-0065 | Regulatory Gating on Mobile / Offline |
| ADR-0066 | Error Sovereignty — Result Monad as the Domain↔Transport Boundary |
| ADR-0067 | ISMS Posture & ISO 27001 / 27701:2025 Conformity Roadmap |


> Generated from `apps/docs/content/ADR/*.md` first-heading titles. Regenerate after adding an ADR.
