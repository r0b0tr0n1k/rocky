// ── Factory Barrel ──
// Every factory must be exported here so test files can import from a single location.
/** biome-ignore-all assist/source/organizeImports: OK in tests */


export { EarTagOrderFactory } from "./ear-tag-order.js";
export type { EarTagOrderRecord } from "./ear-tag-order.js";
export { FarmFactory } from "./farm.js";
export type { FarmRecord } from "./farm.js";
export { AnimalFactory } from "./animal.js";
export type { AnimalRecord } from "./animal.js";
export { MovementFactory } from "./movement.js";
export type { MovementRecord } from "./movement.js";
export { VaccinationFactory } from "./vaccination.js";
export type { VaccinationRecord } from "./vaccination.js";
export { LabTestFactory } from "./lab-test.js";
export type { LabTestRecord } from "./lab-test.js";
export { TreatmentFactory } from "./treatment.js";
export type { TreatmentRecord } from "./treatment.js";
export { ArchiveDocumentFactory } from "./archive-document.js";
export type { ArchiveDocumentRecord } from "./archive-document.js";
export { CattlePassportFactory } from "./cattle-passport.js";
export type { CattlePassportRecord } from "./cattle-passport.js";
export { InspectionFactory } from "./inspection.js";
export type { InspectionRecord } from "./inspection.js";
export { IotDeviceFactory } from "./iot-device.js";
export type { IotDeviceRecord } from "./iot-device.js";
export { SensorReadingFactory } from "./sensor-reading.js";
export type { SensorReadingRecord } from "./sensor-reading.js";
export { GeofenceFactory } from "./geofence.js";
export type { GeofenceRecord } from "./geofence.js";
export { AnimalGeofenceEventFactory } from "./animal-geofence-event.js";
export type { AnimalGeofenceEventRecord } from "./animal-geofence-event.js";
export { PdaDeviceFactory } from "./pda-device.js";
export type { PdaDeviceRecord } from "./pda-device.js";
export { OrganizationFactory } from "./organization.js";
export type { OrganizationRecord } from "./organization.js";
export { SubjectFactory } from "./subject.js";
export type { SubjectRecord } from "./subject.js";
export { UserFactory } from "./user.js";
export type { UserRecord } from "./user.js";
export { OrgAreaFactory } from "./org-area.js";
export type { OrgAreaRecord } from "./org-area.js";

// ── Tier 1: Uncovered business domains ──
export { ErrorCorrectionFactory } from "./error-correction.js";
export type { ErrorCorrectionRecord } from "./error-correction.js";
export { AuditLogFactory } from "./audit-log.js";
export type { AuditLogRecord } from "./audit-log.js";
export { RoleFactory } from "./role.js";
export type { RoleRecord } from "./role.js";
export { PermissionFactory } from "./permission.js";
export type { PermissionRecord } from "./permission.js";
export { RolePermissionFactory } from "./role-permission.js";
export type { RolePermissionRecord } from "./role-permission.js";
export { UserRoleFactory } from "./user-role.js";
export type { UserRoleRecord } from "./user-role.js";
export { NotificationFactory } from "./notification.js";
export type { NotificationRecord } from "./notification.js";
export { NotificationPreferenceFactory } from "./notification-preference.js";
export type { NotificationPreferenceRecord } from "./notification-preference.js";
export { NotificationTemplateFactory } from "./notification-template.js";
export type { NotificationTemplateRecord } from "./notification-template.js";
export { NotificationDeliveryFactory } from "./notification-delivery.js";
export type { NotificationDeliveryRecord } from "./notification-delivery.js";
export { EventSubscriptionFactory } from "./event-subscription.js";
export type { EventSubscriptionRecord } from "./event-subscription.js";
export { ReminderFactory } from "./reminder.js";
export type { ReminderRecord } from "./reminder.js";

// ── Tier 2: Child/FK tables of already-covered domains ──
export { DiseaseFactory } from "./disease.js";
export type { DiseaseRecord } from "./disease.js";
export { VaccineFactory } from "./vaccine.js";
export type { VaccineRecord } from "./vaccine.js";
export { VaccineBatchFactory } from "./vaccine-batch.js";
export type { VaccineBatchRecord } from "./vaccine-batch.js";
export { VaccineDiseaseFactory } from "./vaccine-disease.js";
export type { VaccineDiseaseRecord } from "./vaccine-disease.js";
export { EarTagTypeFactory } from "./ear-tag-type.js";
export type { EarTagTypeRecord } from "./ear-tag-type.js";
export { EarTagAllocationFactory } from "./ear-tag-allocation.js";
export type { EarTagAllocationRecord } from "./ear-tag-allocation.js";
export { EarTagReplacementFactory } from "./ear-tag-replacement.js";
export type { EarTagReplacementRecord } from "./ear-tag-replacement.js";
export { EarTagTakeoverFactory } from "./ear-tag-takeover.js";
export type { EarTagTakeoverRecord } from "./ear-tag-takeover.js";
export { EarTagFactory } from "./ear-tag.js";
export type { EarTagRecord } from "./ear-tag.js";
export { BirthNotificationFactory } from "./birth-notification.js";
export type { BirthNotificationRecord } from "./birth-notification.js";
export { AnimalParentFactory } from "./animal-parent.js";
export type { AnimalParentRecord } from "./animal-parent.js";
export { FormReprintFactory } from "./form-reprint.js";
export type { FormReprintRecord } from "./form-reprint.js";
export { RiskAnalysisFactory } from "./risk-analysis.js";
export type { RiskAnalysisRecord } from "./risk-analysis.js";
export { PastureDeclarationFactory } from "./pasture-declaration.js";
export type { PastureDeclarationRecord } from "./pasture-declaration.js";
export { ImportExportRecordFactory } from "./import-export-record.js";
export type { ImportExportRecordRecord } from "./import-export-record.js";
export { UserSessionFactory } from "./user-session.js";
export type { UserSessionRecord } from "./user-session.js";

// ── Tier 3a: Farm-domain reference/business child tables ──
export { AddressFactory } from "./address.js";
export type { AddressRecord } from "./address.js";
export { FarmSubjectFactory } from "./farm-subject.js";
export type { FarmSubjectRecord } from "./farm-subject.js";
export { FarmBookFactory } from "./farm-book.js";
export type { FarmBookRecord } from "./farm-book.js";
export { VsContractFactory } from "./vs-contract.js";
export type { VsContractRecord } from "./vs-contract.js";
export { VsAssignmentFactory } from "./vs-assignment.js";
export type { VsAssignmentRecord } from "./vs-assignment.js";
export { SyncErrorFactory } from "./sync-error.js";
export type { SyncErrorRecord } from "./sync-error.js";

