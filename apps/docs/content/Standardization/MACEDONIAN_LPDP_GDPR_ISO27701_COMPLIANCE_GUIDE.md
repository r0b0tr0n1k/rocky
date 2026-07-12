# Macedonian LPDP + GDPR + ISO 27701:2025 Compliance Guide

## Executive Summary

This document provides a comprehensive guide for organizations seeking to achieve compliance with Macedonian Law on Personal Data Protection (LPDP), EU General Data Protection Regulation (GDPR), and ISO/IEC 27701:2025 Privacy Information Management standards. The guide integrates requirements from all three frameworks and provides practical implementation guidance with ISO control mappings.

## Table of Contents

1. [Introduction](#introduction)
2. [Legal Framework Overview](#legal-framework-overview)
3. [Compliance Requirements Matrix](#compliance-requirements-matrix)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Organizational Controls](#organizational-controls)
6. [Technical and Organizational Measures](#technical-and-organizational-measures)
7. [Privacy by Design Implementation](#privacy-by-design-implementation)
8. [Vendor and Processor Management](#vendor-and-processor-management)
9. [Data Subject Rights](#data-subject-rights)
10. [Incident Response and Breach Notification](#incident-response-and-breach-notification)
11. [Compliance Monitoring and Audit](#compliance-monitoring-and-audit)
12. [ISO 27701:2025 Additional Requirements](#iso-277012025-additional-requirements)

---

## Introduction

The Macedonian Law on Personal Data Protection (LPDP) aligns with the EU General Data Protection Regulation (GDPR), creating a comprehensive data protection framework for organizations operating in North Macedonia. To achieve full compliance, organizations should implement the Privacy Information Management System (PIMS) requirements specified in ISO/IEC 27701:2025.

This guide provides a unified approach to addressing all three compliance frameworks simultaneously, leveraging the natural alignment between them and the ISO 27001/27701 control structure.

## Legal Framework Overview

### Macedonian LPDP

* Primary national legislation for personal data protection
* Aligns with GDPR requirements
* Enforced by the Personal Data Protection Agency
* Penalties up to 4% of annual turnover for companies

### GDPR

* EU regulation with extraterritorial application
* Sets baseline requirements for personal data processing
* Harmonized approach across EU/EEA

### ISO 27701:2025

* Privacy extension to ISO 27001 ISMS standard
* Provides specific privacy controls and implementation guidance
* Enables systematic privacy risk management

---

## Compliance Requirements Matrix

### Core Requirements Overview

| Requirement Area             | MK LPDP   | GDPR       | ISO 27701:2025 | ISO 27001:2022 | Control Mappings      |
| ---------------------------- | --------- | ---------- | -------------- | -------------- | --------------------- |
| **Policies & Procedures**    | Art 1-10  | Art 5-29   | A.1.2, A.1.4   | A.5.1          | ISO27701:2025.A.5.1   |
| **Roles & Responsibilities** | Art 20-40 | Art 24-39  | A.1.2, A.5.2   | A.5.2, A.5.3   | ISO27701:2025.A.5.2   |
| **Data Subject Rights**      | Art 12-23 | Art 12-23  | A.1.3          | A.5.15         | ISO27701:2025.A.1.3.7 |
| **Security Measures**        | Art 28-34 | Art 25, 32 | A.8.1-A.8.34   | A.8.1-A.8.34   | ISO27701:2025.A.8.15  |
| **Vendor Management**        | Art 28-30 | Art 28     | B.2.2          | A.5.19         | ISO27701:2025.B.2.2.2 |
| **Breach Notification**      | Art 33-34 | Art 33-34  | A.5.26         | A.5.26         | ISO27701:2025.A.5.26  |
| **Consent Management**       | Art 7-9   | Art 4, 7-9 | A.1.2.4        | A.5.10         | ISO27701:2025.A.1.2.4 |
| **PIA & Risk Assessment**    | Art 35-36 | Art 35-36  | A.1.2.6        | A.8.8          | ISO27701:2025.A.1.2.6 |

### Compliance Obligations Summary

#### Policy Requirements

* **Mandatory Policies**: Privacy policy, data processing policy, security policy
* **Documentation Requirements**: Processing records, legal basis documentation, data flows
* **Review Requirements**: Annual review and update of policies
* **ISO Mappings**:
  * `ISO27701:2025.A.5.1` - Policies for information security
  * `ISO27701:2025.A.1.2.2` - Identify and document purpose
  * `ISO27701:2025.A.5.10` - Acceptable use of information and other associated assets

#### Organizational Requirements

* **Data Protection Officer**: Mandatory for certain processing activities
* **Accountability Mechanisms**: Demonstrable compliance controls
* **Staff Training**: Regular privacy and security awareness
* **ISO Mappings**:
  * `ISO27701:2025.A.6.3` - Information security awareness, education and training
  * `ISO27701:2025.A.5.2` - Information security roles and responsibilities
  * `ISO27701:2025.A.5.4` - Management responsibilities

#### Technical Requirements

* **Security Controls**: Appropriate technical and organizational measures
* **Access Control**: Role-based access and authentication
* **Data Encryption**: Protection of personal data in transit and at rest
* **ISO Mappings**:
  * `ISO27701:2025.A.5.15` - Access control
  * `ISO27701:2025.A.8.24` - Use of cryptography
  * `ISO27701:2025.A.8.15` - Logging

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

1. **Policy Development**
   * Privacy policy and procedures
   * Data processing agreements
   * Security policies
   * **Controls**: A.5.1, A.5.2, A.5.3

2. **Organizational Structure**
   * Appoint Data Protection Officer
   * Define roles and responsibilities
   * Establish governance committee
   * **Controls**: A.5.2, A.5.3, GOV-01.1

3. **Data Inventory**
   * Map data processing activities
   * Document legal basis
   * Identify data flows
   * **Controls**: A.5.9, A.5.12, A.5.13

### Phase 2: Implementation (Months 4-6)

1. **Technical Controls**
   * Access management system
   * Data encryption implementation
   * Logging and monitoring
   * **Controls**: A.5.15, A.8.2, A.8.3, A.8.5, A.8.15

2. **Process Implementation**
   * Data subject rights procedures
   * Consent management
   * Vendor management
   * **Controls**: A.1.3.1-A.1.3.7, A.5.19, A.5.20

3. **Staff Training**
   * Privacy awareness training
   * Security training
   * Incident response training
   * **Controls**: A.6.3, A.6.4

### Phase 3: Validation (Months 7-9)

1. **Testing and Validation**
   * Security testing
   * Process validation
   * Training effectiveness
   * **Controls**: A.8.29, A.8.34

2. **Compliance Monitoring**
   * Audit procedures
   * Compliance dashboard
   * Continuous monitoring
   * **Controls**: A.5.35, A.5.36

3. **Documentation**
   * Evidence collection
   * Compliance reports
   * Management review
   * **Controls**: A.5.37, CPL-01.1

---

## Organizational Controls

### Governance and Strategy

#### Privacy Governance Framework

* **Legal Basis**: MK LPDP Art 1-5, GDPR Art 5-29
* **ISO Requirements**: A.5.1, A.5.2, A.5.3, A.1.2.1
* **Implementation**:
  * Establish privacy governance committee
  * Define privacy strategy and objectives
  * Implement privacy risk management
  * **Controls**: ISO27701:2025.A.5.1, ISO27701:2025.A.5.3

#### Privacy Policy and Procedures

* **Legal Basis**: MK LPDP Art 12-15, GDPR Art 13-14
* **ISO Requirements**: A.5.1, A.1.3.1
* **Implementation**:
  * Develop comprehensive privacy policy
  * Create processing procedures
  * Establish data retention policies
  * **Controls**: ISO27701:2025.A.5.1, ISO27701:2025.A.5.11

#### Privacy Risk Management

* **Legal Basis**: MK LPDP Art 25-36, GDPR Art 25, 35-36
* **ISO Requirements**: A.1.2.6, A.5.29
* **Implementation**:
  * Conduct privacy impact assessments
  * Implement risk treatment plans
  * Monitor and review risks
  * **Controls**: ISO27701:2025.A.1.2.6, ISO27701:2025.A.5.29

### Roles and Responsibilities

#### Data Protection Officer (DPO)

* **Legal Basis**: MK LPDP Art 37-39, GDPR Art 37-39
* **ISO Requirements**: A.5.2, A.5.3
* **Implementation**:
  * Define DPO role and responsibilities
  * Establish DPO reporting structure
  * Ensure DPO independence
  * **Controls**: ISO27701:2025.A.5.2, ISO27701:2025.A.5.3

#### Privacy Champion Network

* **Legal Basis**: MK LPDP Art 20-24, GDPR Art 24-26
* **ISO Requirements**: A.6.1-A.6.5
* **Implementation**:
  * Establish privacy champions across departments
  * Define escalation procedures
  * Implement training programs
  * **Controls**: ISO27701:2025.A.6.1, ISO27701:2025.A.6.3

---

## Technical and Organizational Measures

### Access Control

#### Identity and Access Management

* **Legal Basis**: MK LPDP Art 28-34, GDPR Art 32
* **ISO Requirements**: A.5.15, A.5.16, A.5.17, A.5.18
* **Implementation**:
  * Implement identity management system
  * Establish role-based access control
  * Implement privileged access management
  * **Controls**: ISO27701:2025.A.5.15, ISO27701:2025.A.8.2

#### Authentication and Authorization

* **Legal Basis**: MK LPDP Art 32-34, GDPR Art 32
* **ISO Requirements**: A.5.17, A.8.5, A.8.7
* **Implementation**:
  * Implement multi-factor authentication
  * Establish secure authentication procedures
  * Monitor authentication events
  * **Controls**: ISO27701:2025.A.5.17, ISO27701:2025.A.8.5

### Data Protection

#### Encryption and Security

* **Legal Basis**: MK LPDP Art 32, GDPR Art 32
* **ISO Requirements**: A.8.24, A.8.10, A.8.11
* **Implementation**:
  * Implement data encryption in transit and at rest
  * Establish key management procedures
  * Implement data masking where appropriate
  * **Controls**: ISO27701:2025.A.8.24, ISO27701:2025.A.8.11

#### Data Backup and Recovery

* **Legal Basis**: MK LPDP Art 31, GDPR Art 32
* **ISO Requirements**: A.8.13, A.8.14
* **Implementation**:
  * Implement secure backup procedures
  * Test backup and recovery processes
  * Ensure backup data protection
  * **Controls**: ISO27701:2025.A.8.13, ISO27701:2025.A.8.14

### Logging and Monitoring

#### Privacy Event Logging

* **Legal Basis**: MK LPDP Art 30, GDPR Art 5(2)
* **ISO Requirements**: A.8.15, A.8.16
* **Implementation**:
  * Log all personal data access events
  * Monitor for unauthorized access
  * Maintain audit trails
  * **Controls**: ISO27701:2025.A.8.15, ISO27701:2025.A.8.16

#### Compliance Monitoring

* **Legal Basis**: MK LPDP Art 50-60, GDPR Art 5(2)
* **ISO Requirements**: A.5.35, A.5.36
* **Implementation**:
  * Implement compliance dashboards
  * Regular compliance assessments
  * Continuous monitoring tools
  * **Controls**: ISO27701:2025.A.5.35, ISO27701:2025.A.5.36

---

## Privacy by Design Implementation

### Design Principles

#### Privacy by Design Framework

* **Legal Basis**: MK LPDP Art 25, GDPR Art 25
* **ISO Requirements**: A.1.4, A.2.4
* **Implementation**:
  * Integrate privacy into system design
  * Implement privacy controls proactively
  * Ensure privacy throughout lifecycle
  * **Controls**: ISO27701:2025.A.1.4, ISO27701:2025.A.2.4

#### Data Minimization

* **Legal Basis**: MK LPDP Art 5, GDPR Art 5(1)(c)
* **ISO Requirements**: A.5.10, A.5.12
* **Implementation**:
  * Collect minimum necessary data
  * Implement data retention policies
  * Regular data purging procedures
  * **Controls**: ISO27701:2025.A.5.10, ISO27701:2025.A.5.11

### Privacy Impact Assessment

#### PIA Process Implementation

* **Legal Basis**: MK LPDP Art 35-36, GDPR Art 35-36
* **ISO Requirements**: A.1.2.6, A.5.29
* **Implementation**:
  * Establish PIA methodology
  * Identify high-risk processing
  * Implement consultation procedures
  * **Controls**: ISO27701:2025.A.1.2.6, ISO27701:2025.A.5.29

#### Risk Assessment Integration

* **Legal Basis**: MK LPDP Art 25-36, GDPR Art 25, 35-36
* **ISO Requirements**: A.1.2.6, A.8.8
* **Implementation**:
  * Integrate privacy risks in ISMS
  * Assess privacy-specific risks
  * Implement risk treatment plans
  * **Controls**: ISO27701:2025.A.8.8, ISO27701:2025.A.5.29

---

## Vendor and Processor Management

### Contractual Requirements

#### Data Processing Agreements

* **Legal Basis**: MK LPDP Art 28-30, GDPR Art 28
* **ISO Requirements**: B.2.2, A.5.19
* **Implementation**:
  * Standard data processing clauses
  * Security requirements definition
  * Audit rights establishment
  * **Controls**: ISO27701:2025.B.2.2.2, ISO27701:2025.A.5.20

#### Subprocessor Management

* **Legal Basis**: MK LPDP Art 28-30, GDPR Art 28
* **ISO Requirements**: B.5.2, B.5.3
* **Implementation**:
  * Subprocessor authorization procedures
  * Chain of responsibility documentation
  * Audit and compliance verification
  * **Controls**: ISO27701:2025.B.5.2.1, ISO27701:2025.B.5.3.1

### Vendor Security Assessment

#### Security Requirements

* **Legal Basis**: MK LPDP Art 28-30, GDPR Art 28
* **ISO Requirements**: A.5.19, A.5.20
* **Implementation**:
  * Security assessment questionnaires
  * Security control verification
  * Ongoing monitoring procedures
  * **Controls**: ISO27701:2025.A.5.19, ISO27701:2025.A.5.20

#### Incident Management

* **Legal Basis**: MK LPDP Art 33-34, GDPR Art 33-34
* **ISO Requirements**: B.2.4, A.5.26
* **Implementation**:
  * Incident notification procedures
  * Joint incident response plans
  * Post-incident review processes
  * **Controls**: ISO27701:2025.B.2.4.1, ISO27701:2025.A.5.26

---

## Data Subject Rights

### Rights Implementation Framework

#### Right of Access (SAR)

* **Legal Basis**: MK LPDP Art 12-15, GDPR Art 15
* **ISO Requirements**: A.1.3.1, A.1.3.7
* **Implementation**:
  * SAR request procedures
  * Identity verification processes
  * Response timeline management
  * **Controls**: ISO27701:2025.A.1.3.7, ISO27701:2025.A.5.15

#### Right to Rectification

* **Legal Basis**: MK LPDP Art 16, GDPR Art 16
* **ISO Requirements**: A.1.3.2, A.1.3.7
* **Implementation**:
  * Data correction procedures
  * Verification processes
  * Notification to third parties
  * **Controls**: ISO27701:2025.A.1.3.7

#### Right to Erasure

* **Legal Basis**: MK LPDP Art 17, GDPR Art 17
* **ISO Requirements**: A.1.3.3, A.1.3.7
* **Implementation**:
  * Erasure request procedures
  * Retention exception management
  * Technical deletion implementation
  * **Controls**: ISO27701:2025.A.1.3.7, ISO27701:2025.A.8.10

### Rights Management System

#### Rights Portal Implementation

* **Legal Basis**: MK LPDP Art 12-22, GDPR Art 12-22
* **ISO Requirements**: A.1.3.1-A.1.3.7
* **Implementation**:
  * Self-service privacy portal
  * Identity verification system
  * Request tracking and management
  * **Controls**: ISO27701:2025.A.1.3.1, ISO27701:2025.A.1.3.7

#### Rights Fulfillment Process

* **Legal Basis**: MK LPDP Art 12-22, GDPR Art 12-22
* **ISO Requirements**: A.1.3.1-A.1.3.7
* **Implementation**:
  * Automated rights fulfillment
  * Manual process fallback
  * Verification and validation
  * **Controls**: ISO27701:2025.A.1.3.7

---

## Incident Response and Breach Notification

### Incident Management Framework

#### Privacy Incident Response

* **Legal Basis**: MK LPDP Art 33-34, GDPR Art 33-34
* **ISO Requirements**: A.5.24-A.5.28, B.2.4
* **Implementation**:
  * Incident classification procedures
  * Response team establishment
  * Escalation procedures
  * **Controls**: ISO27701:2025.A.5.24, ISO27701:2025.A.5.26

#### Breach Notification Process

* **Legal Basis**: MK LPDP Art 33-35, GDPR Art 33-35
* **ISO Requirements**: B.2.4.1, A.5.26
* **Implementation**:
  * 72-hour notification procedures
  * Authority notification templates
  * Data subject notification processes
  * **Controls**: ISO27701:2025.B.2.4.1, ISO27701:2025.A.5.26

### Monitoring and Detection

#### Privacy Monitoring

* **Legal Basis**: MK LPDP Art 30, GDPR Art 5(2)
* **ISO Requirements**: A.8.15, A.8.16
* **Implementation**:
  * Privacy event monitoring
  * Anomaly detection systems
  * Automated alerting
  * **Controls**: ISO27701:2025.A.8.15, ISO27701:2025.A.8.16

#### Compliance Monitoring

* **Legal Basis**: MK LPDP Art 50-60, GDPR Art 5(2)
* **ISO Requirements**: A.5.35, A.5.36
* **Implementation**:
  * Continuous compliance monitoring
  * Automated compliance checks
  * Audit trail maintenance
  * **Controls**: ISO27701:2025.A.5.35, ISO27701:2025.A.5.36

---

## Compliance Monitoring and Audit

### Audit Framework

#### Internal Audit Program

* **Legal Basis**: MK LPDP Art 50-60, GDPR Art 5(2)
* **ISO Requirements**: A.5.35, A.5.36
* **Implementation**:
  * Annual compliance audits
  * Privacy control testing
  * Gap assessment procedures
  * **Controls**: ISO27701:2025.A.5.35, ISO27701:2025.A.5.36

#### Management Review

* **Legal Basis**: MK LPDP Art 5, GDPR Art 5(2)
* **ISO Requirements**: A.5.37, A.9.3
* **Implementation**:
  * Quarterly management reviews
  * Compliance metrics reporting
  * Improvement identification
  * **Controls**: ISO27701:2025.A.5.37

### Compliance Metrics

#### Key Performance Indicators

* **Legal Basis**: MK LPDP Art 5, GDPR Art 5(2)
* **ISO Requirements**: A.5.35, A.5.36
* **Implementation**:
  * Privacy compliance score
  * Incident response time
  * Training completion rates
  * **Controls**: ISO27701:2025.A.5.35, ISO27701:2025.A.5.36

#### Continuous Improvement

* **Legal Basis**: MK LPDP Art 5, GDPR Art 5(2)
* **ISO Requirements**: A.5.37, A.10.1
* **Implementation**:
  * Regular process improvement
  * Lessons learned integration
  * Best practice adoption
  * **Controls**: ISO27701:2025.A.5.37, ISO27701:2025.A.10.1

---

## ISO 27701:2025 Additional Requirements

### PII Controller Specific Controls

#### PII Controller Obligations (A.1.x)

* **Additional Requirements**:
  * A.1.2.1: Establish PII controller obligations
  * A.1.2.2: Identify and document purpose
  * A.1.2.3: Identify lawful basis
  * A.1.2.4: Determine consent process
  * A.1.2.5: PII controller's role in PII processing
  * A.1.2.6: Privacy impact assessment
  * A.1.3.1: Information to be provided to PII principals
  * A.1.3.2: Right to information
  * A.1.3.3: Right to erasure
  * A.1.3.4: Right to rectification
  * A.1.3.5: Right to restrict processing
  * A.1.3.6: Right to data portability
  * A.1.3.7: Access, correction or erasure
  * A.1.4.1: Privacy by design and by default
  * A.1.4.2: PII controller's role in PII processing

#### Implementation Guidelines

* Document all PII processing activities
* Establish lawful basis for each processing activity
* Implement privacy by design methodology
* Create data subject rights procedures
* Conduct privacy impact assessments

### PII Processor Specific Controls (B.1.x, B.2.x)

#### PII Processor Obligations (B.1.x, B.2.x)

* **Additional Requirements**:
  * B.1.2.1: PII processor's role in PII processing
  * B.1.2.2: Identify and document purpose (for processors)
  * B.1.2.3: Identify the PII controller
  * B.1.2.4: Consent to process PII
  * B.1.2.5: PII processor's role in PII processing
  * B.1.2.6: Privacy impact assessment (for processors)
  * B.1.2.7: PII processor's role in PII processing
  * B.1.2.8: PII processor's role in PII processing
  * B.1.2.9: Documented information required
  * B.1.3.1: Information to be provided by the PII controller
  * B.1.3.2: Right to information (for processors)
  * B.1.3.3: Information to be provided to PII principals
  * B.1.3.4: Right to erasure (for processors)
  * B.1.3.5: Right to rectification (for processors)
  * B.1.3.6: Right to data portability (for processors)
  * B.1.3.7: Access, correction or erasure (for processors)
  * B.2.2.1: Instructions of the PII controller
  * B.2.2.2: Customer agreement
  * B.2.2.3: Sub-processors
  * B.2.2.4: Information to be provided by the PII controller
  * B.2.2.5: PII processor's role in PII processing
  * B.2.2.6: Customer obligations
  * B.2.4.1: Notification of PII breach

#### Implementation Guidelines

* Establish clear customer agreements
* Document processor-specific procedures
* Implement customer notification procedures
* Establish sub-processor management
* Create processor-specific documentation

### Additional Technical Controls

#### Enhanced Privacy Controls (Beyond ISO 27001)

* **A.8.x Series Extensions**:
  * A.8.15 extensions for privacy logging
  * A.8.20-A.8.22 for privacy-specific network controls
  * A.8.24-A.8.26 for privacy-specific cryptographic controls

* **New Privacy-Specific Controls**:
  * PII-specific classification procedures
  * Privacy-specific access controls
  * PII-specific incident response procedures
  * Privacy-specific backup and disposal

### Integration with ISMS

#### Privacy Risk Integration

* **Requirements**:
  * Integrate privacy risks into ISMS risk assessment
  * Establish privacy-specific risk criteria
  * Include privacy in risk treatment plans
  * Monitor privacy risks continuously

* **Implementation**:
  * Update risk assessment procedures
  * Create privacy risk register
  * Integrate privacy in risk treatment plans
  * Regular privacy risk reviews

#### PIMS Documentation

* **Requirements**:
  * Privacy Information Management System scope
  * Privacy policy and objectives
  * Risk assessment and treatment procedures
  * Control implementation documentation
  * Performance evaluation procedures

* **Implementation**:
  * Create PIMS manual
  * Document privacy procedures
  * Establish privacy records
  * Create privacy evidence repository

---

## Implementation Checklist

### Foundation Phase (Months 1-3)

* [ ] Privacy policy development
* [ ] Data protection framework establishment
* [ ] DPO appointment and training
* [ ] Data inventory and mapping
* [ ] Legal basis documentation
* [ ] Privacy risk assessment
* [ ] ISO 27701:2025 gap analysis

### Implementation Phase (Months 4-6)

* [ ] Technical controls implementation
* [ ] Process documentation
* [ ] Staff training programs
* [ ] Vendor management procedures
* [ ] Data subject rights procedures
* [ ] Incident response procedures
* [ ] Privacy by design integration

### Validation Phase (Months 7-9)

* [ ] Internal audit completion
* [ ] Compliance testing
* [ ] Management review
* [ ] Certification preparation
* [ ] Continuous monitoring setup
* [ ] Performance measurement
* [ ] Improvement implementation

---

## Conclusion

Achieving compliance with Macedonian LPDP, GDPR, and ISO 27701:2025 requires a comprehensive approach that addresses legal, technical, and organizational requirements simultaneously. The integrated approach outlined in this guide leverages the natural alignment between these frameworks to create an efficient compliance program that satisfies all requirements while minimizing duplication of effort.

The key to successful implementation is to treat privacy as an organizational imperative that needs to be embedded in all business processes, systems, and culture. By following the phased approach and implementing the ISO 27701:2025 controls, organizations can achieve sustainable compliance with all applicable frameworks.

### Next Steps

1. Conduct detailed gap analysis against this guide
2. Prioritize implementation based on risk assessment
3. Develop implementation roadmap tailored to organization
4. Begin Phase 1 activities focusing on foundation elements
5. Engage stakeholders and secure management support
6. Monitor progress and adjust approach as needed

### Ongoing Maintenance

* Regular compliance monitoring
* Continuous improvement implementation
* Annual policy and procedure reviews
* Staff training updates
* Technology control updates
* Regulatory change adaptation

This comprehensive guide provides the foundation for achieving and maintaining compliance with all applicable privacy and security requirements in a systematic and efficient manner.
