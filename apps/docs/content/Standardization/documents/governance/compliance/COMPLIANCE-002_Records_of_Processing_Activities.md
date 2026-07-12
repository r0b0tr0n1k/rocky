---
id: COMPLIANCE-002
title:
  en: Records of Processing Activities
  mk: Записи За Активности На Обработка
  sq: Regjistër i Aktiviteteve të Përpunimit
version: 1.0.0
date: 2025-01-06
type: register
category: compliance
cluster: governance
legal_basis:
  mk: MK_LPDP_ART_30
  al: AL_LAW124_ART_30
  gdpr: GDPR_ART_30
status: draft
approved_by: DPO
review_date: 2025-04-06
effective_date: 2025-01-06
review_cycle: 12 months
classification: internal
retention: 60
owner: DPO
---

# Records of Processing Activities

## Document Information

| Field          | Value                            |
| -------------- | -------------------------------- |
| Document ID:   | COMPLIANCE-002                   |
| Document Name: | Records of Processing Activities |
| Last Updated:  | [DD/MM/YYYY]                     |
| Updated By:    | [Name]                           |

## Purpose

This document records all processing activities involving personal data, as required by:

* **Macedonian LPDP Art 30** - Records of processing activities
* **GDPR Art 30** - Records of processing activities

## Processing Activities Register

| Record ID | Data Category  | Purpose             | Legal Basis                    | Data Subjects       | Categories                  | Recipients | Cross-Border Transfer?         | Retention Period           | Security Measures |
| --------- | -------------- | ------------------- | ------------------------------ | ------------------- | --------------------------- | ---------- | ------------------------------ | -------------------------- |
| ROP-001   | Customer Data  | Service delivery    | Contract (Art 6(1)(b))         | Customers           | Contact info, ID            | No         | 7 years after contract end     | Encryption, Access Control |
| ROP-002   | Employee Data  | HR management       | Legal obligation (Art 6(1)(c)) | Employees           | Personal, work, performance | No         | 10 years after employment ends | Encryption, Access Control |
| ROP-003   | Marketing Data | Marketing campaigns | Consent (Art 6(1)(a))          | Leads and customers | Contact info, preferences   | No         | 2 years after opt-out          | Encryption, Access Control |

## Data Categories Processed

| Category                     | Description                      | Processing Activities     | Storage Duration | Deletion Policy                              |
| ---------------------------- | -------------------------------- | ------------------------- | ---------------- | -------------------------------------------- |
| Customer contact information | Name, address, phone, email      | CRM use, customer support | 7 years          | Deleted 7 years after contract ends          |
| Employee personal data       | Name, address, contact, ID       | HR management, payroll    | 10 years         | Deleted 10 years after employment ends       |
| Financial data               | Bank details, payment history    | Invoicing, payroll        | 7 years          | Deleted 7 years after legal retention period |
| Web analytics                | IP, browser info, visit patterns | Website performance       | 6 months         | Aggregated and anonymized after 6 months     |

## Data Subjects

| Type             | Number of Records | Collection Method            | Consent Status   |
| ---------------- | ----------------- | ---------------------------- | ---------------- |
| Customers        | [Count]           | Direct collection, web forms | Consent obtained |
| Employees        | [Count]           | Direct collection, contracts | Legal obligation |
| Website visitors | [Count]           | Cookies, web forms           | Cookie consent   |
| Job applicants   | [Count]           | Application forms            | Consent obtained |

## Legal Basis for Processing

| Article                        | Basis Used                 | When Applied                       | Evidence                         |
| ------------------------------ | -------------------------- | ---------------------------------- | -------------------------------- |
| Art 6(1)(a) - Consent          | Marketing data             | Explicit consent obtained          | Consent forms, opt-in checkboxes |
| Art 6(1)(b) - Contract         | Customer service data      | Necessary for contract fulfillment | Service agreements               |
| Art 6(1)(c) - Legal obligation | Employee data              | Required by employment law         | Legal requirements documentation |
| Art 6(1)(d) - Vital interests  | Emergency situations       | Life or health protection          | Incident documentation           |
| Art 6(1)(e) - Public task      | Public office contact info | Official functions                 | Government mandate               |

## Cross-Border Transfers

| Transfer        | Destination Country | Adequacy Decision       | Safeguards in Place                   |
| --------------- | ------------------- | ----------------------- | ------------------------------------- |
| None            | N/A                 | N/A                     | N/A                                   |
| [If applicable] | [Country]           | Adequate / Not Adequate | [Describe safeguards if not adequate] |

## Retention and Deletion Policies

| Data Type     | Retention Period               | Legal Basis                      | Deletion Method                   | Last Review |
| ------------- | ------------------------------ | -------------------------------- | --------------------------------- | ----------- |
| Customer data | 7 years after contract end     | Art 5(1)(e) - storage limitation | Secure deletion with verification | [Date]      |
| Employee data | 10 years after employment ends | Employment law requirements      | Secure deletion with verification | [Date]      |
| Web analytics | 6 months                       | Art 5(1)(e) - storage limitation | Aggregation + anonymization       | [Date]      |

## Security Measures

| Processing Activity | Security Measure             | Implementation Status |
| ------------------- | ---------------------------- | --------------------- |
| Customer database   | Encryption at rest           | ✅ Implemented         |
| Customer database   | Access controls (role-based) | ✅ Implemented         |
| Customer database   | Audit logging                | ✅ Implemented         |
| Web applications    | TLS encryption in transit    | ✅ Implemented         |
| Employee data       | Encryption at rest           | ✅ Implemented         |
| Employee data       | Access controls              | ✅ Implemented         |

## Changes Log

| Date         | Description    | Reason        | Approved By |
| ------------ | -------------- | ------------- | ----------- |
| [DD/MM/YYYY] | [What changed] | [Why changed] | [Approver]  |

---

## Approvals

**DPO Signature:** _________________________ Date: _______

**Management Signature:** _________________________ Date: _______

---

**Legal References:**

* **Macedonian LPDP:** Article 30 - Records of processing activities
* **GDPR:** Article 30 - Records of processing activities
* **ISO 27001:** A.12.3.1 - Backup, A.9.2.1 - Access rights

---

**Change Log:**

| Version | Date       | Changes         | Approved By |
| ------- | ---------- | --------------- | ----------- |
| 1.0.0   | 2025-01-06 | Initial version | [DPO Name]  |
