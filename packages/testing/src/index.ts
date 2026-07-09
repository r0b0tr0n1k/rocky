// ── @rocky/testing ──
// Diamond Seal Testing Doctrine — The Material Base of Testing
//
// Because of the Diamond Seal (Drizzle → Dumb Zod → Factory), your test data
// perfectly satisfies BOTH the Drizzle `$inferSelect` type AND the Zod schema.
//
// Three Testing Stages:
//   Scenario A: API Validators — Factory + `.safeParse()`, no DB
//   Scenario B: Domain Services — Mock Repository + Factory, no DB
//   Scenario C: E2E Routers — Real DB + Factory + full pipeline
//
// Never mock `@rocky/database`. Always use factories.
/** biome-ignore-all assist/source/organizeImports: Sort fail */

export { SchemaDataFactory } from "./factory/base.js";
export {
  EarTagOrderFactory, FarmFactory, AnimalFactory, MovementFactory,
  VaccinationFactory, LabTestFactory, TreatmentFactory, ArchiveDocumentFactory,
  CattlePassportFactory, InspectionFactory, IotDeviceFactory,
  SensorReadingFactory, GeofenceFactory, AnimalGeofenceEventFactory,
  PdaDeviceFactory, OrganizationFactory, OrgAreaFactory,
  SubjectFactory, UserFactory,
  ErrorCorrectionFactory, AuditLogFactory,
  RoleFactory, PermissionFactory, RolePermissionFactory, UserRoleFactory,
  NotificationFactory, NotificationPreferenceFactory, NotificationTemplateFactory,
  NotificationDeliveryFactory, EventSubscriptionFactory, ReminderFactory,
  DiseaseFactory, VaccineFactory, VaccineBatchFactory, VaccineDiseaseFactory,
  EarTagTypeFactory, EarTagAllocationFactory, EarTagReplacementFactory,
  EarTagTakeoverFactory, EarTagFactory, BirthNotificationFactory,
  AnimalParentFactory, FormReprintFactory, RiskAnalysisFactory,
  PastureDeclarationFactory, ImportExportRecordFactory, UserSessionFactory,
  AddressFactory, FarmSubjectFactory, FarmBookFactory, VsContractFactory,
  VsAssignmentFactory, SyncErrorFactory,
  type EarTagOrderRecord, type FarmRecord, type AnimalRecord, type MovementRecord,
  type VaccinationRecord, type LabTestRecord, type TreatmentRecord, type ArchiveDocumentRecord,
  type CattlePassportRecord, type InspectionRecord, type IotDeviceRecord,
  type SensorReadingRecord, type GeofenceRecord, type AnimalGeofenceEventRecord,
  type PdaDeviceRecord, type OrganizationRecord, type OrgAreaRecord,
  type SubjectRecord, type UserRecord,
  type ErrorCorrectionRecord, type AuditLogRecord,
  type RoleRecord, type PermissionRecord, type RolePermissionRecord, type UserRoleRecord,
  type NotificationRecord, type NotificationPreferenceRecord, type NotificationTemplateRecord,
  type NotificationDeliveryRecord, type EventSubscriptionRecord, type ReminderRecord,
  type DiseaseRecord, type VaccineRecord, type VaccineBatchRecord, type VaccineDiseaseRecord,
  type EarTagTypeRecord, type EarTagAllocationRecord, type EarTagReplacementRecord,
  type EarTagTakeoverRecord, type EarTagRecord, type BirthNotificationRecord,
  type AnimalParentRecord, type FormReprintRecord, type RiskAnalysisRecord,
  type PastureDeclarationRecord, type ImportExportRecordRecord, type UserSessionRecord,
  type AddressRecord, type FarmSubjectRecord, type FarmBookRecord, type VsContractRecord,
  type VsAssignmentRecord, type SyncErrorRecord,
} from "./factory/index.js";

export {
  createE2EContext, mockRepoReturn,
  mockRepoThrow,
  scenarioA_validatorTest, type E2EContext
} from "./scenarios/index.js";

