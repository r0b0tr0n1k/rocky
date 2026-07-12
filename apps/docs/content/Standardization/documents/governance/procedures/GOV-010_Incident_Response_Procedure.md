---
id: GOV-010
title:
  en: Incident Response Procedure
  mk: Постапка За Одговор На Инциденти
  sq: Procedura e Përgjigjes së Incidentet
version: 1.0.0
date: 2025-01-06
type: procedure
category: incident_management
cluster: governance
legal_basis:
  mk: MK_LPDP_ART_33
  al: AL_LAW124_ART_33
  gdpr: GDPR_ART_33
iso_control: A.16.1
status: draft
approved_by: DPO and CTO
review_date: 2025-04-06
effective_date: 2025-01-06
review_cycle: 12 months
classification: internal
retention: 36
owner: DPO
---

# Incident Response Procedure

## Document Information

| Field | Value |
|-------|-------|
| Document ID: | GOV-010 |
| Document Name: | Incident Response Procedure |
| Version: | 1.0.0 |
| Effective Date: | [DD/MM/YYYY] |

## Purpose

This procedure defines the steps to detect, contain, report, and remediate personal data breaches and incidents, in accordance with:
- **Macedonian LPDP Art 33** - Notification of data breaches
- **GDPR Art 33** - Notification of personal data breaches

## 1. Incident Classification

### 1.1 Severity Levels

| Severity | Definition | Examples | Response Time SLA | DPA Notification |
|----------|-------------|----------|------------------|------------------|
| **Critical** | Systems down, massive data exposure imminent | < 1 hour | Within 24 hours |
| **High** | Personal data exposed, systems affected | < 4 hours | Within 72 hours |
| **Medium** | Single system issue, no PII exposure | < 24 hours | Monitor only |
| **Low** | Minor issue, no data impact | < 3 days | Monitor only |

### 1.2 Incident Types

| Type | Description | Examples |
|-------|-------------|----------|
| **Data Breach** | Personal data exposed, lost, or stolen | Hacked database, stolen laptop with PII |
| **Unauthorized Access** | Someone accessed PII without permission | Insider threat, compromised credentials |
| **System Outage** | Service unavailable, PII inaccessible | Server crash, network failure |
| **Malware** | Malicious software affecting PII systems | Ransomware, virus on PII systems |
| **Human Error** | Accidental PII exposure or loss | Email sent to wrong person, file deleted |

## 2. Detection and Immediate Response

### 2.1 Immediate Actions (< 1 hour)

1. **Containment**
   - [ ] Disconnect affected systems from network
   - [ ] Stop processing activities
   - [ ] Preserve evidence (logs, screenshots)
   - [ ] Secure physical access points

2. **Assessment**
   - [ ] Determine scope of incident
   - [ ] Identify what PII is affected
   - [ ] Estimate number of data subjects
   - [ ] Classify severity (Critical/High/Medium/Low)

3. **Notification**
   - [ ] Notify DPO immediately
   - [ ] Notify IT/Security team
   - [ ] Notify CTO if Critical/High severity

## 3. Investigation and Analysis

### 3.1 Root Cause Analysis

| Question | Answer |
|----------|--------|
| What happened? | [Description] |
| When did it happen? | [Date/Time] |
| How was PII affected? | [Description] |
| Who was affected? | [Count of data subjects] |
| What systems were involved? | [List systems] |
| Root cause | [Technical/Human/Systematic] |
| Contributing factors | [List factors] |

### 3.2 Data Impact Assessment

| Data Type | Records Affected | Data Fields | Risk Level |
|-----------|------------------|-------------|-------------|
| Customer personal data | [Count] | [List fields] | High/Med/Low |
| Employee personal data | [Count] | [List fields] | High/Med/Low |
| Financial data | [Count] | [List fields] | High/Med/Low |
| Other | [Count] | [List fields] | High/Med/Low |

## 4. Breach Notification

### 4.1 DPA Notification (Art 33)

**Timeline:** Within 72 hours of becoming aware of breach

**Notification includes:**
- [ ] Description of nature of breach
- [ ] Categories of data affected
- [ ] Approximate number of data subjects
- [ ] Likely consequences
- [ ] Measures taken or proposed
- [ ] Point of contact for more information

**DPA Contact Information:**
- Agency: [Macedonian DPA name]
- Email: [Email address]
- Phone: [Phone number]
- Form: [Link to notification form]

### 4.2 Data Subject Notification

**Timeline:** Without undue delay

**Notification method:**
- [ ] Email
- [ ] SMS
- [ ] Postal mail
- [ ] Website notice

**Notification includes:**
- [ ] What happened
- [ ] What data was affected
- [ ] Likely consequences
- [ ] What we're doing about it
- [ ] What they can do (contact us, report to DPA)

**Notification Template:**

```text
Dear [Name],

We are writing to inform you of a data breach that may have affected your personal information.

**What happened:** [Brief description]

**What information was affected:** [List data types]

**What we're doing:** [Steps taken to mitigate and prevent recurrence]

**What you can do:**
- Monitor your accounts for suspicious activity
- Contact us at [Phone] or [Email] with questions
- File a complaint with Macedonian DPA if needed

We sincerely apologize for this incident and are taking it very seriously.

[Company Name]
[DPO Contact Information]
```

## 5. Remediation and Recovery

### 5.1 Remediation Steps

| Step | Action | Owner | Target Date | Status |
|-------|--------|--------|--------------|--------|
| 1 | Fix root cause | [Name] | [Date] | [Status] |
| 2 | Restore from backup if needed | [Name] | [Date] | [Status] |
| 3 | Review and update security measures | [Name] | [Date] | [Status] |
| 4 | Complete DPA notification | DPO | [Date] | [Status] |
| 5 | Notify affected individuals | Communications | [Date] | [Status] |
| 6 | Test that fix works | IT | [Date] | [Status] |

### 5.2 Lessons Learned

| Area | What Went Well | What Could Be Improved | Action Items |
|-------|-----------------|------------------------|--------------|
| Detection | [Observation] | [Observation] | [Action] |
| Containment | [Observation] | [Observation] | [Action] |
| Investigation | [Observation] | [Observation] | [Action] |
| Notification | [Observation] | [Observation] | [Action] |

## 6. Post-Incident Review

**Review Date:** [Date]
**Review Team:** [Names]

**Review Questions:**
1. Was incident detected within required timeframe? [Yes/No]
2. Was DPA notified within 72 hours? [Yes/No]
3. Were affected individuals notified promptly? [Yes/No]
4. Was root cause identified? [Yes/No]
5. Has remediation been completed? [Yes/No]

**Overall Assessment:** [Satisfactory / Needs Improvement / Unsatisfactory]

**Required Actions:**
1. [Action 1]
2. [Action 2]

---

## 7. Roles and Responsibilities

| Role | Responsibilities | Contact |
|-------|------------------|----------|
| **DPO** | Initial breach assessment, DPA notification, data subject notification, incident report | [Phone/Email] |
| **CTO** | Technical containment, root cause analysis, remediation oversight | [Phone/Email] |
| **IT Security** | System isolation, forensic analysis, technical remediation | [Phone/Email] |
| **Communications** | Draft and send notifications to affected individuals | [Phone/Email] |
| **Legal Counsel** | Review notification content, advise on legal obligations | [Phone/Email] |

---

## Approvals

**DPO Signature:** _________________________ Date: _______

**CTO Signature:** _________________________ Date: _______

**Management Signature:** _________________________ Date: _______

---

**Legal References:**
- **Macedonian LPDP:** Article 33 - Notification of personal data breaches
- **GDPR:** Article 33 - Notification of personal data breaches
- **ISO 27001:** A.16.1 - Information security incident management

---

**Change Log:**
| Version | Date | Changes | Approved By |
|---------|--------|---------|--------------|
| 1.0.0 | 2025-01-06 | Initial version | [DPO Name] |
