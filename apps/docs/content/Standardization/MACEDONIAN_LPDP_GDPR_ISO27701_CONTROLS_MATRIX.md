# Macedonian LPDP + GDPR + ISO 27701:2025 Controls Mapping Matrix

## Overview

This matrix provides detailed mappings between Macedonian Law on Personal Data Protection (LPDP), EU General Data Protection Regulation (GDPR), and ISO/IEC 27701:2025 Privacy Information Management controls. The matrix enables organizations to implement a unified compliance approach that addresses all three frameworks simultaneously.

## Matrix Legend

* **MK LPDP**: Macedonian Law on Personal Data Protection article references
* **GDPR**: EU General Data Protection Regulation article references
* **ISO 27701**: ISO/IEC 27701:2025 control references (A = PII Controller, B = PII Processor)
* **ISO 27001**: ISO/IEC 27001:2022 control references
* **Implementation**: Practical implementation guidance
* **Evidence**: Required evidence for compliance validation

---

## Detailed Controls Mapping

### 1. Privacy Governance and Strategy (A.1.2, A.5.1-A.5.3)

| MK LPDP | GDPR        | ISO 27701:2025            | ISO 27001:2022      | SCF Control | Implementation Guidance                                                      | Evidence Required                                                     |
| ------- | ----------- | ------------------------- | ------------------- | ----------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Art 1-5 | Art 5       | A.1.2.1, A.1.2.2, A.1.2.3 | A.5.1, A.5.2, A.5.3 | GOV-01.1    | Establish privacy governance framework with clear roles and responsibilities | Privacy governance charter, role definitions, organizational charts   |
| Art 1   | Art 5(1)(a) | A.1.2.2                   | A.5.1               | PRI-01.1    | Document and communicate specific purposes for PII processing                | Purpose documentation, communication records, policy statements       |
| Art 1   | Art 5(1)(b) | A.1.2.3                   | A.5.31              | PRI-01.2    | Determine, document and demonstrate lawful basis for PII processing          | Lawful basis register, legal documentation, decision records          |
| Art 2   | Art 5(2)    | A.5.37                    | A.5.37              | GOV-02.1    | Implement documented operating procedures for privacy                        | Operating procedures manual, process documentation, work instructions |
| Art 5   | Art 5(1)(f) | A.1.4.1                   | A.5.3               | PRI-01.3    | Implement privacy by design and by default principles                        | Privacy design guidelines, system specifications, design reviews      |

### 2. Data Subject Rights (A.1.3)

| MK LPDP   | GDPR      | ISO 27701:2025   | ISO 27001:2022 | SCF Control | Implementation Guidance                                             | Evidence Required                                                |
| --------- | --------- | ---------------- | -------------- | ----------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Art 12-15 | Art 13-14 | A.1.3.1, A.1.3.2 | A.5.15         | PRI-03.1    | Provide required information to data subjects at time of collection | Privacy notices, information templates, collection records       |
| Art 15    | Art 15    | A.1.3.2          | A.5.15         | PRI-04.1    | Implement right of access procedures (SAR)                          | SAR procedures, response templates, tracking system              |
| Art 16    | Art 16    | A.1.3.4          | A.5.15         | PRI-04.2    | Implement right to rectification procedures                         | Rectification procedures, correction logs, verification records  |
| Art 17    | Art 17    | A.1.3.3          | A.5.15         | PRI-04.3    | Implement right to erasure procedures                               | Erasure procedures, deletion logs, verification records          |
| Art 18    | Art 18    | A.1.3.5          | A.5.15         | PRI-04.4    | Implement right to restrict processing                              | Restriction procedures, status tracking, notification logs       |
| Art 20    | Art 20    | A.1.3.6          | A.5.15         | PRI-04.5    | Implement right to data portability                                 | Portability procedures, data export tools, format specifications |
| Art 21-22 | Art 21-22 | A.1.3.7          | A.5.15         | PRI-04.6    | Implement rights to object and automated decision-making            | Objection procedures, profiling logs, opt-out mechanisms         |

### 3. Consent Management (A.1.2.4)

| MK LPDP | GDPR           | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                          | Evidence Required                                        |
| ------- | -------------- | -------------- | -------------- | ----------- | ------------------------------------------------ | -------------------------------------------------------- |
| Art 7-9 | Art 4(11), 7-9 | A.1.2.4        | A.5.10         | PRI-03.2    | Determine when and how consent is to be obtained | Consent policy, collection procedures, consent forms     |
| Art 8   | Art 8          | A.1.2.4        | A.5.10         | PRI-03.3    | Special provisions for child consent             | Age verification procedures, parental consent processes  |
| Art 7   | Art 7          | A.1.2.4        | A.5.10         | PRI-03.4    | Document consent withdrawal procedures           | Withdrawal procedures, preference management, audit logs |

### 4. Privacy Impact Assessment (A.1.2.6)

| MK LPDP   | GDPR      | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                                     | Evidence Required                                   |
| --------- | --------- | -------------- | -------------- | ----------- | ----------------------------------------------------------- | --------------------------------------------------- |
| Art 35-36 | Art 35-36 | A.1.2.6        | A.8.8          | PRI-05.1    | Assess need for and implement privacy impact assessments    | PIA methodology, assessment reports, risk registers |
| Art 36    | Art 36    | A.1.2.6        | A.8.8          | PRI-05.2    | Prior consultation with supervisory authority when required | Consultation records, approval documentation        |
| Art 25    | Art 25    | A.1.4.1        | A.5.1          | PRI-05.3    | Implement privacy by design and default                     | Privacy design guidelines, implementation records   |

### 5. Access Control (A.5.15, A.8.2-A.8.5)

| MK LPDP | GDPR   | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                       | Evidence Required                               |
| ------- | ------ | -------------- | -------------- | ----------- | --------------------------------------------- | ----------------------------------------------- |
| Art 32  | Art 32 | A.5.15         | A.5.15         | PRI-06.1    | Implement access control for PII processing   | Access control policy, authorization procedures |
| Art 32  | Art 32 | A.8.2          | A.8.2          | PRI-06.2    | Implement privileged access rights management | Privileged access procedures, admin access logs |
| Art 32  | Art 32 | A.8.3          | A.8.3          | PRI-06.3    | Implement information access restrictions     | Access restriction policy, access control lists |
| Art 32  | Art 32 | A.8.5          | A.8.5          | PRI-06.4    | Implement secure authentication               | Authentication procedures, MFA implementation   |

### 6. Data Processing Records (A.1.2.9)

| MK LPDP | GDPR   | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                     | Evidence Required                                  |
| ------- | ------ | -------------- | -------------- | ----------- | ------------------------------------------- | -------------------------------------------------- |
| Art 30  | Art 30 | A.1.2.9        | A.5.33         | PRI-07.1    | Maintain records of processing activities   | Processing register, data flow maps, activity logs |
| Art 30  | Art 30 | A.1.2.9        | A.5.33         | PRI-07.2    | Document processing purposes and categories | Purpose documentation, category classifications    |
| Art 30  | Art 30 | A.1.2.9        | A.5.33         | PRI-07.3    | Record recipients of personal data          | Recipient registers, data sharing logs             |

### 7. Security Measures (A.8.15-A.8.24)

| MK LPDP | GDPR   | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                   | Evidence Required                                 |
| ------- | ------ | -------------- | -------------- | ----------- | ----------------------------------------- | ------------------------------------------------- |
| Art 32  | Art 32 | A.8.15         | A.8.15         | PRI-08.1    | Implement logging for PII processing      | Logging policy, audit trail records, log analysis |
| Art 32  | Art 32 | A.8.24         | A.8.24         | PRI-08.2    | Implement cryptography for PII protection | Cryptography policy, encryption implementation    |
| Art 32  | Art 32 | A.8.10         | A.8.10         | PRI-08.3    | Implement secure information deletion     | Deletion procedures, data destruction logs        |
| Art 32  | Art 32 | A.8.20         | A.8.20         | PRI-08.4    | Implement network security for PII        | Network security policy, firewall configuration   |

### 8. Breach Notification (A.5.26, B.2.4.1)

| MK LPDP   | GDPR      | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                                | Evidence Required                              |
| --------- | --------- | -------------- | -------------- | ----------- | ------------------------------------------------------ | ---------------------------------------------- |
| Art 33-34 | Art 33-34 | A.5.26         | A.5.26         | PRI-09.1    | Implement personal data breach notification            | Breach notification procedures, incident logs  |
| Art 33    | Art 33    | A.5.26         | A.5.26         | PRI-09.2    | Notify supervisory authority within 72 hours           | Notification logs, timeline records            |
| Art 34    | Art 34    | A.5.26         | A.5.26         | PRI-09.3    | Communicate breaches to data subjects when high risk   | Communication procedures, notification records |
| Art 33    | Art 33    | B.2.4.1        | A.5.26         | PRI-09.4    | Processors must notify controllers without undue delay | Notification procedures, communication logs    |

### 9. Vendor and Processor Management (B.2.2, A.5.19-A.5.22)

| MK LPDP | GDPR   | ISO 27701:2025   | ISO 27001:2022 | SCF Control | Implementation Guidance                               | Evidence Required                                        |
| ------- | ------ | ---------------- | -------------- | ----------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Art 28  | Art 28 | B.2.2.1, B.2.2.2 | A.5.19, A.5.20 | PRI-10.1    | Implement data processing agreements                  | Processing agreements, contract templates                |
| Art 28  | Art 28 | B.2.2.3          | A.5.20         | PRI-10.2    | Obtain prior written authorization for sub-processors | Sub-processor approval process, authorization logs       |
| Art 28  | Art 28 | B.2.2.6          | A.5.20         | PRI-10.3    | Provide customer with appropriate information         | Information provision procedures, customer communication |
| Art 28  | Art 28 | A.5.22           | A.5.22         | PRI-10.4    | Monitor and review supplier services                  | Supplier monitoring procedures, review records           |

### 10. Staff and Training (A.6.3)

| MK LPDP | GDPR   | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                     | Evidence Required                                    |
| ------- | ------ | -------------- | -------------- | ----------- | ------------------------------------------- | ---------------------------------------------------- |
| Art 32  | Art 32 | A.6.3          | A.6.3          | PRI-11.1    | Implement privacy awareness training        | Training curriculum, attendance records, assessments |
| Art 32  | Art 32 | A.6.3          | A.6.3          | PRI-11.2    | Ensure staff understand privacy obligations | Training records, competency assessments             |
| Art 29  | Art 29 | A.6.3          | A.6.3          | PRI-11.3    | Train staff on data subject rights          | Rights training materials, certification records     |

### 11. Compliance Monitoring (A.5.35-A.5.36)

| MK LPDP   | GDPR      | ISO 27701:2025 | ISO 27001:2022 | SCF Control | Implementation Guidance                               | Evidence Required                                |
| --------- | --------- | -------------- | -------------- | ----------- | ----------------------------------------------------- | ------------------------------------------------ |
| Art 50-60 | Art 57-58 | A.5.35         | A.5.35         | PRI-12.1    | Implement independent review of privacy controls      | Compliance audit procedures, review reports      |
| Art 50-60 | Art 57-58 | A.5.36         | A.5.36         | PRI-12.2    | Ensure compliance with privacy policies and standards | Compliance monitoring procedures, status reports |
| Art 50-60 | Art 57-58 | A.5.35         | A.5.35         | PRI-12.3    | Conduct internal audits of privacy controls           | Audit plans, findings, remediation records       |

---

## Implementation Guidance by Control Category

### A.1.x Series: PII Controller Requirements

#### A.1.2.x - Privacy Management Requirements

* **Implementation**: Establish clear privacy management framework with documented procedures
* **Priority**: High - foundational for all other privacy activities
* **Timeline**: Phase 1 (Months 1-3)
* **Resources**: Privacy Officer, legal team, IT security team
* **Dependencies**: Organizational structure definition

#### A.1.3.x - Rights of the PII Principal

* **Implementation**: Create comprehensive rights fulfillment system
* **Priority**: High - required for legal compliance
* **Timeline**: Phase 2 (Months 4-6)
* **Resources**: Privacy team, IT systems, customer service
* **Dependencies**: Data mapping and classification

#### A.1.4.x - Privacy by Design and by Default

* **Implementation**: Integrate privacy in all system design processes
* **Priority**: Medium - ongoing process improvement
* **Timeline**: Phase 2-3 (Months 4-9)
* **Resources**: Architecture team, development team, privacy team
* **Dependencies**: Design process integration

### A.8.x Series: Technical and Organizational Measures

#### A.8.15 - Logging (Privacy Extension)

* **Implementation**: Enhance standard logging with privacy-specific events
* **Priority**: High - required for breach detection and evidence
* **Timeline**: Phase 2 (Months 4-6)
* **Resources**: IT operations, security team, logging tools
* **Dependencies**: Standard logging infrastructure

#### A.8.24 - Cryptography (Privacy Extension)

* **Implementation**: Apply encryption specifically to personal data
* **Priority**: High - required by law
* **Timeline**: Phase 2 (Months 4-6)
* **Resources**: Cryptography team, PKI infrastructure
* **Dependencies**: Key management system

### B.1.x, B.2.x Series: PII Processor Requirements

#### B.2.2.x - Processing Requirements

* **Implementation**: Establish processor-specific procedures aligned with controller instructions
* **Priority**: High - required by law for processors
* **Timeline**: Phase 2 (Months 4-6)
* **Resources**: Contract management, compliance team
* **Dependencies**: Controller agreements

#### B.2.4.x - PII Breach Management

* **Implementation**: Processor-specific breach notification procedures
* **Priority**: High - legal requirement
* **Timeline**: Phase 2 (Months 4-6)
* **Resources**: Incident response team, legal team
* **Dependencies**: General incident response procedures

---

## Gap Analysis and Additional ISO 27701:2025 Requirements

### Additional PII Controller Requirements (Beyond ISO 27001)

| Control | Requirement                             | Implementation Guidance                       | Evidence                                         |
| ------- | --------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| A.1.2.7 | PII controller's role in PII processing | Document specific controller responsibilities | Role documentation, responsibility matrix        |
| A.1.2.8 | PII controller's role in PII processing | Document ongoing controller obligations       | Obligation register, compliance procedures       |
| A.1.2.9 | Documented information required         | Maintain required privacy documentation       | Document management system, record retention     |
| A.1.3.8 | Notification to PII principals          | Implement proactive notification procedures   | Notification procedures, communication templates |

### Additional PII Processor Requirements (Beyond ISO 27001)

| Control | Requirement                                     | Implementation Guidance                                          | Evidence                                            |
| ------- | ----------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| B.1.2.7 | PII processor's role in PII processing          | Document processor-specific responsibilities                     | Processor role documentation, responsibility matrix |
| B.1.2.8 | PII processor's role in PII processing          | Document ongoing processor obligations                           | Obligation register, compliance procedures          |
| B.1.3.8 | Notification to PII principals (for processors) | Implement notification procedures as per controller instructions | Notification procedures, communication logs         |
| B.2.2.5 | PII processor's role in PII processing          | Document processor compliance with controller instructions       | Compliance verification, instruction logs           |

---

## Implementation Roadmap with Dependencies

### Phase 1: Foundation (Months 1-3)

1. **Week 1-2**: Establish privacy governance (A.1.2.1, A.5.1, A.5.2)
2. **Week 3-4**: Document processing activities (A.1.2.9, A.5.33)
3. **Week 5-6**: Define privacy purposes and legal basis (A.1.2.2, A.1.2.3)
4. **Week 7-8**: Implement basic access controls (A.5.15, A.8.2)
5. **Week 9-10**: Establish data subject rights procedures (A.1.3.1-A.1.3.7)
6. **Week 11-12**: Conduct privacy training (A.6.3)

### Phase 2: Implementation (Months 4-6)

1. **Week 13-14**: Implement technical controls (A.8.15, A.8.24)
2. **Week 15-16**: Establish breach notification procedures (A.5.26, B.2.4.1)
3. **Week 17-18**: Implement vendor management (B.2.2.1, A.5.19)
4. **Week 19-20**: Deploy privacy by design processes (A.1.4.1)
5. **Week 21-22**: Implement consent management (A.1.2.4)
6. **Week 23-24**: Conduct privacy impact assessments (A.1.2.6)

### Phase 3: Validation (Months 7-9)

1. **Week 25-26**: Internal privacy audit (A.5.35, A.5.36)
2. **Week 27-28**: Compliance testing and validation
3. **Week 29-30**: Management review and improvement (A.5.37)
4. **Week 31-32**: Certification preparation
5. **Week 33-34**: Continuous monitoring setup
6. **Week 35-36**: Performance measurement and optimization

---

## Compliance Validation Framework

### Testing and Validation Procedures

#### Privacy Control Testing

* **Frequency**: Quarterly
* **Scope**: All implemented privacy controls
* **Method**: Automated testing + manual verification
* **Evidence**: Test reports, validation records

#### Privacy Impact Assessment Validation

* **Frequency**: Annually or when significant changes occur
* **Scope**: High-risk processing activities
* **Method**: Risk assessment + control validation
* **Evidence**: Assessment reports, validation records

#### Breach Response Testing

* **Frequency**: Semi-annually
* **Scope**: Incident response procedures
* **Method**: Tabletop exercises + simulation
* **Evidence**: Exercise reports, improvement plans

### Continuous Monitoring

#### Privacy Metrics Dashboard

* Privacy compliance score
* Data subject request response time
* Breach detection and response time
* Training completion rates
* Vendor compliance status
* PIA completion rates

#### Audit Trail Requirements

* All PII access events
* Configuration changes
* Policy modifications
* Training completions
* Incident responses
* Vendor compliance assessments

---

## Risk Management Integration

### Privacy Risk Categories

#### High-Risk Processing

* Special category data processing
* Systematic monitoring of public areas
* Large-scale processing of personal data
* Automated decision-making with legal effects

#### Medium-Risk Processing

* Standard personal data processing
* Customer relationship management
* HR data processing
* Marketing activities

#### Low-Risk Processing

* Internal administrative processing
* Standard business operations
* Non-sensitive data processing

### Risk Treatment Strategies

#### Risk Avoidance

* Eliminate unnecessary processing
* Minimize data collection
* Implement data deletion procedures

#### Risk Mitigation

* Implement technical controls
* Establish organizational procedures
* Create monitoring mechanisms

#### Risk Transfer

* Vendor management procedures
* Insurance coverage
* Contractual protections

#### Risk Acceptance

* Documented risk acceptance
* Management approval
* Regular review procedures

---

This comprehensive controls mapping matrix provides organizations with a detailed roadmap for achieving compliance with Macedonian LPDP, GDPR, and ISO 27701:2025 through an integrated approach that leverages the natural alignment between these frameworks.
