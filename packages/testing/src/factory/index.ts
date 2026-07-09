// ── Factory Barrel ──
/** biome-ignore-all assist/source/organizeImports: OK in tests */
// All test factories are exported from here.

export { SchemaDataFactory } from "./base.js";
export { EarTagOrderFactory } from "./factories/ear-tag-order.js";
export type { EarTagOrderRecord } from "./factories/ear-tag-order.js";
export { FarmFactory } from "./factories/farm.js";
export type { FarmRecord } from "./factories/farm.js";
export { AnimalFactory } from "./factories/animal.js";
export type { AnimalRecord } from "./factories/animal.js";
export { MovementFactory } from "./factories/movement.js";
export type { MovementRecord } from "./factories/movement.js";
export { VaccinationFactory } from "./factories/vaccination.js";
export type { VaccinationRecord } from "./factories/vaccination.js";
export { LabTestFactory } from "./factories/lab-test.js";
export type { LabTestRecord } from "./factories/lab-test.js";
export { TreatmentFactory } from "./factories/treatment.js";
export type { TreatmentRecord } from "./factories/treatment.js";
export { ArchiveDocumentFactory } from "./factories/archive-document.js";
export type { ArchiveDocumentRecord } from "./factories/archive-document.js";
export { CattlePassportFactory } from "./factories/cattle-passport.js";
export type { CattlePassportRecord } from "./factories/cattle-passport.js";
export { InspectionFactory } from "./factories/inspection.js";
export type { InspectionRecord } from "./factories/inspection.js";
export { IotDeviceFactory } from "./factories/iot-device.js";
export type { IotDeviceRecord } from "./factories/iot-device.js";
export { SensorReadingFactory } from "./factories/sensor-reading.js";
export type { SensorReadingRecord } from "./factories/sensor-reading.js";
export { GeofenceFactory } from "./factories/geofence.js";
export type { GeofenceRecord } from "./factories/geofence.js";
export { AnimalGeofenceEventFactory } from "./factories/animal-geofence-event.js";
export type { AnimalGeofenceEventRecord } from "./factories/animal-geofence-event.js";
export { PdaDeviceFactory } from "./factories/pda-device.js";
export type { PdaDeviceRecord } from "./factories/pda-device.js";
export { OrganizationFactory } from "./factories/organization.js";
export type { OrganizationRecord } from "./factories/organization.js";
export { SubjectFactory } from "./factories/subject.js";
export type { SubjectRecord } from "./factories/subject.js";
export { UserFactory } from "./factories/user.js";
export type { UserRecord } from "./factories/user.js";
export { OrgAreaFactory } from "./factories/org-area.js";
export type { OrgAreaRecord } from "./factories/org-area.js";

// ── Tier 1: Uncovered business domains ──
export { ErrorCorrectionFactory } from "./factories/error-correction.js";
export type { ErrorCorrectionRecord } from "./factories/error-correction.js";
export { AuditLogFactory } from "./factories/audit-log.js";
export type { AuditLogRecord } from "./factories/audit-log.js";
export { RoleFactory } from "./factories/role.js";
export type { RoleRecord } from "./factories/role.js";
export { PermissionFactory } from "./factories/permission.js";
export type { PermissionRecord } from "./factories/permission.js";
export { RolePermissionFactory } from "./factories/role-permission.js";
export type { RolePermissionRecord } from "./factories/role-permission.js";
export { UserRoleFactory } from "./factories/user-role.js";
export type { UserRoleRecord } from "./factories/user-role.js";
export { NotificationFactory } from "./factories/notification.js";
export type { NotificationRecord } from "./factories/notification.js";
export { NotificationPreferenceFactory } from "./factories/notification-preference.js";
export type { NotificationPreferenceRecord } from "./factories/notification-preference.js";
export { NotificationTemplateFactory } from "./factories/notification-template.js";
export type { NotificationTemplateRecord } from "./factories/notification-template.js";
export { NotificationDeliveryFactory } from "./factories/notification-delivery.js";
export type { NotificationDeliveryRecord } from "./factories/notification-delivery.js";
export { EventSubscriptionFactory } from "./factories/event-subscription.js";
export type { EventSubscriptionRecord } from "./factories/event-subscription.js";
export { ReminderFactory } from "./factories/reminder.js";
export type { ReminderRecord } from "./factories/reminder.js";

// ── Tier 2: Child/FK tables of already-covered domains ──
export { DiseaseFactory } from "./factories/disease.js";
export type { DiseaseRecord } from "./factories/disease.js";
export { VaccineFactory } from "./factories/vaccine.js";
export type { VaccineRecord } from "./factories/vaccine.js";
export { VaccineBatchFactory } from "./factories/vaccine-batch.js";
export type { VaccineBatchRecord } from "./factories/vaccine-batch.js";
export { VaccineDiseaseFactory } from "./factories/vaccine-disease.js";
export type { VaccineDiseaseRecord } from "./factories/vaccine-disease.js";
export { EarTagTypeFactory } from "./factories/ear-tag-type.js";
export type { EarTagTypeRecord } from "./factories/ear-tag-type.js";
export { EarTagAllocationFactory } from "./factories/ear-tag-allocation.js";
export type { EarTagAllocationRecord } from "./factories/ear-tag-allocation.js";
export { EarTagReplacementFactory } from "./factories/ear-tag-replacement.js";
export type { EarTagReplacementRecord } from "./factories/ear-tag-replacement.js";
export { EarTagTakeoverFactory } from "./factories/ear-tag-takeover.js";
export type { EarTagTakeoverRecord } from "./factories/ear-tag-takeover.js";
export { EarTagFactory } from "./factories/ear-tag.js";
export type { EarTagRecord } from "./factories/ear-tag.js";
export { BirthNotificationFactory } from "./factories/birth-notification.js";
export type { BirthNotificationRecord } from "./factories/birth-notification.js";
export { AnimalParentFactory } from "./factories/animal-parent.js";
export type { AnimalParentRecord } from "./factories/animal-parent.js";
export { FormReprintFactory } from "./factories/form-reprint.js";
export type { FormReprintRecord } from "./factories/form-reprint.js";
export { RiskAnalysisFactory } from "./factories/risk-analysis.js";
export type { RiskAnalysisRecord } from "./factories/risk-analysis.js";
export { PastureDeclarationFactory } from "./factories/pasture-declaration.js";
export type { PastureDeclarationRecord } from "./factories/pasture-declaration.js";
export { ImportExportRecordFactory } from "./factories/import-export-record.js";
export type { ImportExportRecordRecord } from "./factories/import-export-record.js";
export { UserSessionFactory } from "./factories/user-session.js";
export type { UserSessionRecord } from "./factories/user-session.js";

// ── Tier 3a: Farm-domain reference/business child tables ──
export { AddressFactory } from "./factories/address.js";
export type { AddressRecord } from "./factories/address.js";
export { FarmSubjectFactory } from "./factories/farm-subject.js";
export type { FarmSubjectRecord } from "./factories/farm-subject.js";
export { FarmBookFactory } from "./factories/farm-book.js";
export type { FarmBookRecord } from "./factories/farm-book.js";
export { VsContractFactory } from "./factories/vs-contract.js";
export type { VsContractRecord } from "./factories/vs-contract.js";
export { VsAssignmentFactory } from "./factories/vs-assignment.js";
export type { VsAssignmentRecord } from "./factories/vs-assignment.js";
export { SyncErrorFactory } from "./factories/sync-error.js";
export type { SyncErrorRecord } from "./factories/sync-error.js";

