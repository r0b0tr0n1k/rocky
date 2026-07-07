/**
 * DOMAIN ENUMS — Single Source of Truth (auto-generated)
 *
 * Contains ALL internal enum validator schemas. Vendor enums (pgenums)
 * are no longer stored as PostgreSQL ENUM types — they use text() columns
 * and are validated at the Zod boundary by integration schemas.
 *
 * DO NOT EDIT MANUALLY. Run: node scripts/regenerate-enums.mjs
 *
 * Generated: 2026-07-06T01:12:41.628Z
 */

import { zEnum } from "../_enum-helper.js";
import { z } from "zod";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

import { ADMIN_ROLE_VALUES } from "@rocky/database/constants";
import { ADMIN_ROUTE_VALUES } from "@rocky/database/constants";
import { ALLOCATION_STATUS_VALUES } from "@rocky/database/constants";
import { ALLOCATION_TYPE_VALUES } from "@rocky/database/constants";
import { ANIMAL_STATUS_VALUES } from "@rocky/database/constants";
import { APPROVAL_ACTION_VALUES } from "@rocky/database/constants";
import { ARCHIVE_DOCUMENT_TYPE_VALUES } from "@rocky/database/constants";
import { ARCHIVE_LOCATION_VALUES } from "@rocky/database/constants";
import { AUDIT_ACTION_VALUES } from "@rocky/database/constants";
import { BIRTH_NOTIFICATION_STATUS_VALUES } from "@rocky/database/constants";
import { BIRTH_TYPE_VALUES } from "@rocky/database/constants";
import { CONFLICT_RESOLUTION_STATUS_VALUES } from "@rocky/database/constants";
import { CONTINGENT_TYPE_VALUES } from "@rocky/database/constants";
import { CORRECTION_CASE_TYPE_VALUES } from "@rocky/database/constants";
import { CORRECTION_STATUS_VALUES } from "@rocky/database/constants";
import { DATA_SOURCE_VALUES } from "@rocky/database/constants";
import { DEATH_CAUSE_VALUES } from "@rocky/database/constants";
import { DELIVERY_METHOD_VALUES } from "@rocky/database/constants";
import { DETECTION_SOURCE_VALUES } from "@rocky/database/constants";
import { DEVICE_STATUS_VALUES } from "@rocky/database/constants";
import { DISTRIBUTION_METHOD_VALUES } from "@rocky/database/constants";
import { DUPLICATE_TYPE_VALUES } from "@rocky/database/constants";
import { EARTAG_TRANSITION_STATUS_VALUES } from "@rocky/database/constants";
import { EAR_TAG_ORDER_STATUS_VALUES } from "@rocky/database/constants";
import { EAR_TAG_REPLACEMENT_REASON_VALUES } from "@rocky/database/constants";
import { EAR_TAG_REPLACEMENT_STATUS_VALUES } from "@rocky/database/constants";
import { EAR_TAG_STATUS_VALUES } from "@rocky/database/constants";
import { EMAIL_STATUS_VALUES } from "@rocky/database/constants";
import { ENTITY_TYPE_VALUES } from "@rocky/database/constants";
import { ENVIRONMENT_VALUES } from "@rocky/database/constants";
import { EVENT_SOURCE_VALUES } from "@rocky/database/constants";
import { FARM_BOOK_STATUS_VALUES } from "@rocky/database/constants";
import { FARM_READ_ROLE_VALUES } from "@rocky/database/constants";
import { FARM_TYPE_VALUES } from "@rocky/database/constants";
import { FENCE_TYPE_VALUES } from "@rocky/database/constants";
import { GEOFENCE_EVENT_SOURCE_VALUES } from "@rocky/database/constants";
import { GEOFENCE_EVENT_TYPE_VALUES } from "@rocky/database/constants";
import { HEALTH_RECORD_TYPE_VALUES } from "@rocky/database/constants";
import { HEALTH_SEVERITY_VALUES } from "@rocky/database/constants";
import { HOLDING_TYPE_VALUES } from "@rocky/database/constants";
import { IMPORT_EXPORT_STATUS_VALUES } from "@rocky/database/constants";
import { IMPORT_TYPE_VALUES } from "@rocky/database/constants";
import { INSPECTION_STATUS_VALUES } from "@rocky/database/constants";
import { IOT_DEVICE_STATUS_VALUES } from "@rocky/database/constants";
import { LANGUAGE_VALUES } from "@rocky/database/constants";
import { MODULE_TYPE_VALUES } from "@rocky/database/constants";
import { MOVEMENT_TYPE_VALUES } from "@rocky/database/constants";
import { NOTIFICATION_CATEGORY_VALUES } from "@rocky/database/constants";
import { NOTIFICATION_PRIORITY_VALUES } from "@rocky/database/constants";
import { NOTIFICATION_STATUS_VALUES } from "@rocky/database/constants";
import { NOTIFICATION_TYPE_VALUES } from "@rocky/database/constants";
import { ORDER_STATUS_VALUES } from "@rocky/database/constants";
import { ORG_READ_ROLE_VALUES } from "@rocky/database/constants";
import { ORG_TYPE_VALUES } from "@rocky/database/constants";
import { OUTBOX_EVENT_STATUS_VALUES } from "@rocky/database/constants";
import { PARENT_TYPE_VALUES } from "@rocky/database/constants";
import { PASSPORT_STATUS_VALUES } from "@rocky/database/constants";
import { PASTURE_TYPE_VALUES } from "@rocky/database/constants";
import { PROCESSING_STAGE_VALUES } from "@rocky/database/constants";
import { READING_TYPE_VALUES } from "@rocky/database/constants";
import { REPRINT_REASON_VALUES } from "@rocky/database/constants";
import { REPRINT_STATUS_VALUES } from "@rocky/database/constants";
import { ROLE_PRIORITY_VALUES } from "@rocky/database/constants";
import { SEVERITY_VALUES } from "@rocky/database/constants";
import { SEX_VALUES } from "@rocky/database/constants";
import { SORT_ANIMAL_BY_VALUES } from "@rocky/database/constants";
import { SORT_BY_EARTAG_VALUES } from "@rocky/database/constants";
import { SORT_BY_FARM_VALUES } from "@rocky/database/constants";
import { SORT_BY_MOVEMENT_VALUES } from "@rocky/database/constants";
import { SORT_BY_USER_VALUES } from "@rocky/database/constants";
import { SORT_ORDER_VALUES } from "@rocky/database/constants";
import { STATE_CODE_VALUES } from "@rocky/database/constants";
import { SUBJECT_ROLE_VALUES } from "@rocky/database/constants";
import { SYNC_ERROR_TYPE_VALUES } from "@rocky/database/constants";
import { SYNC_STATUS_VALUES } from "@rocky/database/constants";
import { TAG_CATEGORY_VALUES } from "@rocky/database/constants";
import { TAKEOVER_STATUS_VALUES } from "@rocky/database/constants";
import { TEST_RESULT_VALUES } from "@rocky/database/constants";
import { TEST_TYPE_VALUES } from "@rocky/database/constants";
import { TRANSMISSION_TYPE_VALUES } from "@rocky/database/constants";
import { USER_ROLE_VALUES } from "@rocky/database/constants";
import { USER_STATUS_VALUES } from "@rocky/database/constants";
import { VACCINE_TYPE_VALUES } from "@rocky/database/constants";
import { VERIFICATION_STATUS_VALUES } from "@rocky/database/constants";
import { VS_CONTRACT_STATUS_VALUES } from "@rocky/database/constants";
import { WEIGHING_TYPE_VALUES } from "@rocky/database/constants";
import { WRITE_ROLE_VALUES } from "@rocky/database/constants";

// 87 enum schemas

export const adminRolesSchema = zEnum(ADMIN_ROLE_VALUES);
export type adminRolesType = z.infer<typeof adminRolesSchema>;
const _satisfies_adminRolesSchema: z.ZodType<adminRolesType> = adminRolesSchema;
type _nodrift_adminRolesSchema = NoDrift<z.infer<typeof adminRolesSchema>, adminRolesType>;
export const administrationRouteSchema = zEnum(ADMIN_ROUTE_VALUES);
export type administrationRouteType = z.infer<typeof administrationRouteSchema>;
const _satisfies_administrationRouteSchema: z.ZodType<administrationRouteType> = administrationRouteSchema;
type _nodrift_administrationRouteSchema = NoDrift<z.infer<typeof administrationRouteSchema>, administrationRouteType>;
export const allocationStatusSchema = zEnum(ALLOCATION_STATUS_VALUES);
export type allocationStatusType = z.infer<typeof allocationStatusSchema>;
const _satisfies_allocationStatusSchema: z.ZodType<allocationStatusType> = allocationStatusSchema;
type _nodrift_allocationStatusSchema = NoDrift<z.infer<typeof allocationStatusSchema>, allocationStatusType>;
export const allocationTypeSchema = zEnum(ALLOCATION_TYPE_VALUES);
export type allocationTypeType = z.infer<typeof allocationTypeSchema>;
const _satisfies_allocationTypeSchema: z.ZodType<allocationTypeType> = allocationTypeSchema;
type _nodrift_allocationTypeSchema = NoDrift<z.infer<typeof allocationTypeSchema>, allocationTypeType>;
export const animalStatusSchema = zEnum(ANIMAL_STATUS_VALUES);
export type animalStatusType = z.infer<typeof animalStatusSchema>;
const _satisfies_animalStatusSchema: z.ZodType<animalStatusType> = animalStatusSchema;
type _nodrift_animalStatusSchema = NoDrift<z.infer<typeof animalStatusSchema>, animalStatusType>;
export const approvalActionSchema = zEnum(APPROVAL_ACTION_VALUES);
export type approvalActionType = z.infer<typeof approvalActionSchema>;
const _satisfies_approvalActionSchema: z.ZodType<approvalActionType> = approvalActionSchema;
type _nodrift_approvalActionSchema = NoDrift<z.infer<typeof approvalActionSchema>, approvalActionType>;
export const archiveDocumentTypeSchema = zEnum(ARCHIVE_DOCUMENT_TYPE_VALUES);
export type archiveDocumentTypeType = z.infer<typeof archiveDocumentTypeSchema>;
const _satisfies_archiveDocumentTypeSchema: z.ZodType<archiveDocumentTypeType> = archiveDocumentTypeSchema;
type _nodrift_archiveDocumentTypeSchema = NoDrift<z.infer<typeof archiveDocumentTypeSchema>, archiveDocumentTypeType>;
export const archiveLocationSchema = zEnum(ARCHIVE_LOCATION_VALUES);
export type archiveLocationType = z.infer<typeof archiveLocationSchema>;
const _satisfies_archiveLocationSchema: z.ZodType<archiveLocationType> = archiveLocationSchema;
type _nodrift_archiveLocationSchema = NoDrift<z.infer<typeof archiveLocationSchema>, archiveLocationType>;
export const auditActionSchema = zEnum(AUDIT_ACTION_VALUES);
export type auditActionType = z.infer<typeof auditActionSchema>;
const _satisfies_auditActionSchema: z.ZodType<auditActionType> = auditActionSchema;
type _nodrift_auditActionSchema = NoDrift<z.infer<typeof auditActionSchema>, auditActionType>;
export const birthNotificationStatusSchema = zEnum(BIRTH_NOTIFICATION_STATUS_VALUES);
export type birthNotificationStatusType = z.infer<typeof birthNotificationStatusSchema>;
const _satisfies_birthNotificationStatusSchema: z.ZodType<birthNotificationStatusType> = birthNotificationStatusSchema;
type _nodrift_birthNotificationStatusSchema = NoDrift<z.infer<typeof birthNotificationStatusSchema>, birthNotificationStatusType>;
export const birthTypeSchema = zEnum(BIRTH_TYPE_VALUES);
export type birthTypeType = z.infer<typeof birthTypeSchema>;
const _satisfies_birthTypeSchema: z.ZodType<birthTypeType> = birthTypeSchema;
type _nodrift_birthTypeSchema = NoDrift<z.infer<typeof birthTypeSchema>, birthTypeType>;
export const conflictResolutionStatusSchema = zEnum(CONFLICT_RESOLUTION_STATUS_VALUES);
export type conflictResolutionStatusType = z.infer<typeof conflictResolutionStatusSchema>;
const _satisfies_conflictResolutionStatusSchema: z.ZodType<conflictResolutionStatusType> = conflictResolutionStatusSchema;
type _nodrift_conflictResolutionStatusSchema = NoDrift<z.infer<typeof conflictResolutionStatusSchema>, conflictResolutionStatusType>;
export const contingentTypeSchema = zEnum(CONTINGENT_TYPE_VALUES);
export type contingentTypeType = z.infer<typeof contingentTypeSchema>;
const _satisfies_contingentTypeSchema: z.ZodType<contingentTypeType> = contingentTypeSchema;
type _nodrift_contingentTypeSchema = NoDrift<z.infer<typeof contingentTypeSchema>, contingentTypeType>;
export const correctionCaseTypeSchema = zEnum(CORRECTION_CASE_TYPE_VALUES);
export type correctionCaseTypeType = z.infer<typeof correctionCaseTypeSchema>;
const _satisfies_correctionCaseTypeSchema: z.ZodType<correctionCaseTypeType> = correctionCaseTypeSchema;
type _nodrift_correctionCaseTypeSchema = NoDrift<z.infer<typeof correctionCaseTypeSchema>, correctionCaseTypeType>;
export const correctionStatusSchema = zEnum(CORRECTION_STATUS_VALUES);
export type correctionStatusType = z.infer<typeof correctionStatusSchema>;
const _satisfies_correctionStatusSchema: z.ZodType<correctionStatusType> = correctionStatusSchema;
type _nodrift_correctionStatusSchema = NoDrift<z.infer<typeof correctionStatusSchema>, correctionStatusType>;
export const dataSourceSchema = zEnum(DATA_SOURCE_VALUES);
export type dataSourceType = z.infer<typeof dataSourceSchema>;
const _satisfies_dataSourceSchema: z.ZodType<dataSourceType> = dataSourceSchema;
type _nodrift_dataSourceSchema = NoDrift<z.infer<typeof dataSourceSchema>, dataSourceType>;
export const deathCauseSchema = zEnum(DEATH_CAUSE_VALUES);
export type deathCauseType = z.infer<typeof deathCauseSchema>;
const _satisfies_deathCauseSchema: z.ZodType<deathCauseType> = deathCauseSchema;
type _nodrift_deathCauseSchema = NoDrift<z.infer<typeof deathCauseSchema>, deathCauseType>;
export const deliveryMethodSchema = zEnum(DELIVERY_METHOD_VALUES);
export type deliveryMethodType = z.infer<typeof deliveryMethodSchema>;
const _satisfies_deliveryMethodSchema: z.ZodType<deliveryMethodType> = deliveryMethodSchema;
type _nodrift_deliveryMethodSchema = NoDrift<z.infer<typeof deliveryMethodSchema>, deliveryMethodType>;
export const detectionSourceSchema = zEnum(DETECTION_SOURCE_VALUES);
export type detectionSourceType = z.infer<typeof detectionSourceSchema>;
const _satisfies_detectionSourceSchema: z.ZodType<detectionSourceType> = detectionSourceSchema;
type _nodrift_detectionSourceSchema = NoDrift<z.infer<typeof detectionSourceSchema>, detectionSourceType>;
export const deviceStatusSchema = zEnum(DEVICE_STATUS_VALUES);
export type deviceStatusType = z.infer<typeof deviceStatusSchema>;
const _satisfies_deviceStatusSchema: z.ZodType<deviceStatusType> = deviceStatusSchema;
type _nodrift_deviceStatusSchema = NoDrift<z.infer<typeof deviceStatusSchema>, deviceStatusType>;
export const distributionMethodSchema = zEnum(DISTRIBUTION_METHOD_VALUES);
export type distributionMethodType = z.infer<typeof distributionMethodSchema>;
const _satisfies_distributionMethodSchema: z.ZodType<distributionMethodType> = distributionMethodSchema;
type _nodrift_distributionMethodSchema = NoDrift<z.infer<typeof distributionMethodSchema>, distributionMethodType>;
export const duplicateTypeSchema = zEnum(DUPLICATE_TYPE_VALUES);
export type duplicateTypeType = z.infer<typeof duplicateTypeSchema>;
const _satisfies_duplicateTypeSchema: z.ZodType<duplicateTypeType> = duplicateTypeSchema;
type _nodrift_duplicateTypeSchema = NoDrift<z.infer<typeof duplicateTypeSchema>, duplicateTypeType>;
export const earTagOrderStatusSchema = zEnum(EAR_TAG_ORDER_STATUS_VALUES);
export type earTagOrderStatusType = z.infer<typeof earTagOrderStatusSchema>;
const _satisfies_earTagOrderStatusSchema: z.ZodType<earTagOrderStatusType> = earTagOrderStatusSchema;
type _nodrift_earTagOrderStatusSchema = NoDrift<z.infer<typeof earTagOrderStatusSchema>, earTagOrderStatusType>;
export const earTagReplacementReasonSchema = zEnum(EAR_TAG_REPLACEMENT_REASON_VALUES);
export type earTagReplacementReasonType = z.infer<typeof earTagReplacementReasonSchema>;
const _satisfies_earTagReplacementReasonSchema: z.ZodType<earTagReplacementReasonType> = earTagReplacementReasonSchema;
type _nodrift_earTagReplacementReasonSchema = NoDrift<z.infer<typeof earTagReplacementReasonSchema>, earTagReplacementReasonType>;
export const earTagReplacementStatusSchema = zEnum(EAR_TAG_REPLACEMENT_STATUS_VALUES);
export type earTagReplacementStatusType = z.infer<typeof earTagReplacementStatusSchema>;
const _satisfies_earTagReplacementStatusSchema: z.ZodType<earTagReplacementStatusType> = earTagReplacementStatusSchema;
type _nodrift_earTagReplacementStatusSchema = NoDrift<z.infer<typeof earTagReplacementStatusSchema>, earTagReplacementStatusType>;
export const earTagStatusSchema = zEnum(EAR_TAG_STATUS_VALUES);
export type earTagStatusType = z.infer<typeof earTagStatusSchema>;
const _satisfies_earTagStatusSchema: z.ZodType<earTagStatusType> = earTagStatusSchema;
type _nodrift_earTagStatusSchema = NoDrift<z.infer<typeof earTagStatusSchema>, earTagStatusType>;
export const eartagTransitionStatusSchema = zEnum(EARTAG_TRANSITION_STATUS_VALUES);
export type eartagTransitionStatusType = z.infer<typeof eartagTransitionStatusSchema>;
const _satisfies_eartagTransitionStatusSchema: z.ZodType<eartagTransitionStatusType> = eartagTransitionStatusSchema;
type _nodrift_eartagTransitionStatusSchema = NoDrift<z.infer<typeof eartagTransitionStatusSchema>, eartagTransitionStatusType>;
export const emailStatusSchema = zEnum(EMAIL_STATUS_VALUES);
export type emailStatusType = z.infer<typeof emailStatusSchema>;
const _satisfies_emailStatusSchema: z.ZodType<emailStatusType> = emailStatusSchema;
type _nodrift_emailStatusSchema = NoDrift<z.infer<typeof emailStatusSchema>, emailStatusType>;
export const entityTypeSchema = zEnum(ENTITY_TYPE_VALUES);
export type entityTypeType = z.infer<typeof entityTypeSchema>;
const _satisfies_entityTypeSchema: z.ZodType<entityTypeType> = entityTypeSchema;
type _nodrift_entityTypeSchema = NoDrift<z.infer<typeof entityTypeSchema>, entityTypeType>;
export const environmentSchema = zEnum(ENVIRONMENT_VALUES);
export type environmentType = z.infer<typeof environmentSchema>;
const _satisfies_environmentSchema: z.ZodType<environmentType> = environmentSchema;
type _nodrift_environmentSchema = NoDrift<z.infer<typeof environmentSchema>, environmentType>;
export const eventSourceSchema = zEnum(EVENT_SOURCE_VALUES);
export type eventSourceType = z.infer<typeof eventSourceSchema>;
const _satisfies_eventSourceSchema: z.ZodType<eventSourceType> = eventSourceSchema;
type _nodrift_eventSourceSchema = NoDrift<z.infer<typeof eventSourceSchema>, eventSourceType>;
export const farmBookStatusSchema = zEnum(FARM_BOOK_STATUS_VALUES);
export type farmBookStatusType = z.infer<typeof farmBookStatusSchema>;
const _satisfies_farmBookStatusSchema: z.ZodType<farmBookStatusType> = farmBookStatusSchema;
type _nodrift_farmBookStatusSchema = NoDrift<z.infer<typeof farmBookStatusSchema>, farmBookStatusType>;
export const farmReadRolesSchema = zEnum(FARM_READ_ROLE_VALUES);
export type farmReadRolesType = z.infer<typeof farmReadRolesSchema>;
const _satisfies_farmReadRolesSchema: z.ZodType<farmReadRolesType> = farmReadRolesSchema;
type _nodrift_farmReadRolesSchema = NoDrift<z.infer<typeof farmReadRolesSchema>, farmReadRolesType>;
export const farmTypeSchema = zEnum(FARM_TYPE_VALUES);
export type farmTypeType = z.infer<typeof farmTypeSchema>;
const _satisfies_farmTypeSchema: z.ZodType<farmTypeType> = farmTypeSchema;
type _nodrift_farmTypeSchema = NoDrift<z.infer<typeof farmTypeSchema>, farmTypeType>;
export const fenceTypeSchema = zEnum(FENCE_TYPE_VALUES);
export type fenceTypeType = z.infer<typeof fenceTypeSchema>;
const _satisfies_fenceTypeSchema: z.ZodType<fenceTypeType> = fenceTypeSchema;
type _nodrift_fenceTypeSchema = NoDrift<z.infer<typeof fenceTypeSchema>, fenceTypeType>;
export const geofenceEventSourceSchema = zEnum(GEOFENCE_EVENT_SOURCE_VALUES);
export type geofenceEventSourceType = z.infer<typeof geofenceEventSourceSchema>;
const _satisfies_geofenceEventSourceSchema: z.ZodType<geofenceEventSourceType> = geofenceEventSourceSchema;
type _nodrift_geofenceEventSourceSchema = NoDrift<z.infer<typeof geofenceEventSourceSchema>, geofenceEventSourceType>;
export const geofenceEventTypeSchema = zEnum(GEOFENCE_EVENT_TYPE_VALUES);
export type geofenceEventTypeType = z.infer<typeof geofenceEventTypeSchema>;
const _satisfies_geofenceEventTypeSchema: z.ZodType<geofenceEventTypeType> = geofenceEventTypeSchema;
type _nodrift_geofenceEventTypeSchema = NoDrift<z.infer<typeof geofenceEventTypeSchema>, geofenceEventTypeType>;
export const healthRecordTypeSchema = zEnum(HEALTH_RECORD_TYPE_VALUES);
export type healthRecordTypeType = z.infer<typeof healthRecordTypeSchema>;
const _satisfies_healthRecordTypeSchema: z.ZodType<healthRecordTypeType> = healthRecordTypeSchema;
type _nodrift_healthRecordTypeSchema = NoDrift<z.infer<typeof healthRecordTypeSchema>, healthRecordTypeType>;
export const healthSeveritySchema = zEnum(HEALTH_SEVERITY_VALUES);
export type healthSeverityType = z.infer<typeof healthSeveritySchema>;
const _satisfies_healthSeveritySchema: z.ZodType<healthSeverityType> = healthSeveritySchema;
type _nodrift_healthSeveritySchema = NoDrift<z.infer<typeof healthSeveritySchema>, healthSeverityType>;
export const holdingTypeSchema = zEnum(HOLDING_TYPE_VALUES);
export type holdingTypeType = z.infer<typeof holdingTypeSchema>;
const _satisfies_holdingTypeSchema: z.ZodType<holdingTypeType> = holdingTypeSchema;
type _nodrift_holdingTypeSchema = NoDrift<z.infer<typeof holdingTypeSchema>, holdingTypeType>;
export const importExportStatusSchema = zEnum(IMPORT_EXPORT_STATUS_VALUES);
export type importExportStatusType = z.infer<typeof importExportStatusSchema>;
const _satisfies_importExportStatusSchema: z.ZodType<importExportStatusType> = importExportStatusSchema;
type _nodrift_importExportStatusSchema = NoDrift<z.infer<typeof importExportStatusSchema>, importExportStatusType>;
export const importTypeSchema = zEnum(IMPORT_TYPE_VALUES);
export type importTypeType = z.infer<typeof importTypeSchema>;
const _satisfies_importTypeSchema: z.ZodType<importTypeType> = importTypeSchema;
type _nodrift_importTypeSchema = NoDrift<z.infer<typeof importTypeSchema>, importTypeType>;
export const inspectionStatusSchema = zEnum(INSPECTION_STATUS_VALUES);
export type inspectionStatusType = z.infer<typeof inspectionStatusSchema>;
const _satisfies_inspectionStatusSchema: z.ZodType<inspectionStatusType> = inspectionStatusSchema;
type _nodrift_inspectionStatusSchema = NoDrift<z.infer<typeof inspectionStatusSchema>, inspectionStatusType>;
export const iotDeviceStatusSchema = zEnum(IOT_DEVICE_STATUS_VALUES);
export type iotDeviceStatusType = z.infer<typeof iotDeviceStatusSchema>;
const _satisfies_iotDeviceStatusSchema: z.ZodType<iotDeviceStatusType> = iotDeviceStatusSchema;
type _nodrift_iotDeviceStatusSchema = NoDrift<z.infer<typeof iotDeviceStatusSchema>, iotDeviceStatusType>;
export const languageSchema = zEnum(LANGUAGE_VALUES);
export type languageType = z.infer<typeof languageSchema>;
const _satisfies_languageSchema: z.ZodType<languageType> = languageSchema;
type _nodrift_languageSchema = NoDrift<z.infer<typeof languageSchema>, languageType>;
export const moduleTypeSchema = zEnum(MODULE_TYPE_VALUES);
export type moduleTypeType = z.infer<typeof moduleTypeSchema>;
const _satisfies_moduleTypeSchema: z.ZodType<moduleTypeType> = moduleTypeSchema;
type _nodrift_moduleTypeSchema = NoDrift<z.infer<typeof moduleTypeSchema>, moduleTypeType>;
export const movementTypeSchema = zEnum(MOVEMENT_TYPE_VALUES);
export type movementTypeType = z.infer<typeof movementTypeSchema>;
const _satisfies_movementTypeSchema: z.ZodType<movementTypeType> = movementTypeSchema;
type _nodrift_movementTypeSchema = NoDrift<z.infer<typeof movementTypeSchema>, movementTypeType>;
export const notificationCategorySchema = zEnum(NOTIFICATION_CATEGORY_VALUES);
export type notificationCategoryType = z.infer<typeof notificationCategorySchema>;
const _satisfies_notificationCategorySchema: z.ZodType<notificationCategoryType> = notificationCategorySchema;
type _nodrift_notificationCategorySchema = NoDrift<z.infer<typeof notificationCategorySchema>, notificationCategoryType>;
export const notificationPrioritySchema = zEnum(NOTIFICATION_PRIORITY_VALUES);
export type notificationPriorityType = z.infer<typeof notificationPrioritySchema>;
const _satisfies_notificationPrioritySchema: z.ZodType<notificationPriorityType> = notificationPrioritySchema;
type _nodrift_notificationPrioritySchema = NoDrift<z.infer<typeof notificationPrioritySchema>, notificationPriorityType>;
export const notificationStatusSchema = zEnum(NOTIFICATION_STATUS_VALUES);
export type notificationStatusType = z.infer<typeof notificationStatusSchema>;
const _satisfies_notificationStatusSchema: z.ZodType<notificationStatusType> = notificationStatusSchema;
type _nodrift_notificationStatusSchema = NoDrift<z.infer<typeof notificationStatusSchema>, notificationStatusType>;
export const notificationTypeSchema = zEnum(NOTIFICATION_TYPE_VALUES);
export type notificationTypeType = z.infer<typeof notificationTypeSchema>;
const _satisfies_notificationTypeSchema: z.ZodType<notificationTypeType> = notificationTypeSchema;
type _nodrift_notificationTypeSchema = NoDrift<z.infer<typeof notificationTypeSchema>, notificationTypeType>;
export const orderStatusSchema = zEnum(ORDER_STATUS_VALUES);
export type orderStatusType = z.infer<typeof orderStatusSchema>;
const _satisfies_orderStatusSchema: z.ZodType<orderStatusType> = orderStatusSchema;
type _nodrift_orderStatusSchema = NoDrift<z.infer<typeof orderStatusSchema>, orderStatusType>;
export const orgReadRolesSchema = zEnum(ORG_READ_ROLE_VALUES);
export type orgReadRolesType = z.infer<typeof orgReadRolesSchema>;
const _satisfies_orgReadRolesSchema: z.ZodType<orgReadRolesType> = orgReadRolesSchema;
type _nodrift_orgReadRolesSchema = NoDrift<z.infer<typeof orgReadRolesSchema>, orgReadRolesType>;
export const orgTypeSchema = zEnum(ORG_TYPE_VALUES);
export type orgTypeType = z.infer<typeof orgTypeSchema>;
const _satisfies_orgTypeSchema: z.ZodType<orgTypeType> = orgTypeSchema;
type _nodrift_orgTypeSchema = NoDrift<z.infer<typeof orgTypeSchema>, orgTypeType>;
export const outboxEventStatusSchema = zEnum(OUTBOX_EVENT_STATUS_VALUES);
export type outboxEventStatusType = z.infer<typeof outboxEventStatusSchema>;
const _satisfies_outboxEventStatusSchema: z.ZodType<outboxEventStatusType> = outboxEventStatusSchema;
type _nodrift_outboxEventStatusSchema = NoDrift<z.infer<typeof outboxEventStatusSchema>, outboxEventStatusType>;
export const parentTypeSchema = zEnum(PARENT_TYPE_VALUES);
export type parentTypeType = z.infer<typeof parentTypeSchema>;
const _satisfies_parentTypeSchema: z.ZodType<parentTypeType> = parentTypeSchema;
type _nodrift_parentTypeSchema = NoDrift<z.infer<typeof parentTypeSchema>, parentTypeType>;
export const passportStatusSchema = zEnum(PASSPORT_STATUS_VALUES);
export type passportStatusType = z.infer<typeof passportStatusSchema>;
const _satisfies_passportStatusSchema: z.ZodType<passportStatusType> = passportStatusSchema;
type _nodrift_passportStatusSchema = NoDrift<z.infer<typeof passportStatusSchema>, passportStatusType>;
export const pastureTypeSchema = zEnum(PASTURE_TYPE_VALUES);
export type pastureTypeType = z.infer<typeof pastureTypeSchema>;
const _satisfies_pastureTypeSchema: z.ZodType<pastureTypeType> = pastureTypeSchema;
type _nodrift_pastureTypeSchema = NoDrift<z.infer<typeof pastureTypeSchema>, pastureTypeType>;
export const processingStageSchema = zEnum(PROCESSING_STAGE_VALUES);
export type processingStageType = z.infer<typeof processingStageSchema>;
const _satisfies_processingStageSchema: z.ZodType<processingStageType> = processingStageSchema;
type _nodrift_processingStageSchema = NoDrift<z.infer<typeof processingStageSchema>, processingStageType>;
export const readingTypeSchema = zEnum(READING_TYPE_VALUES);
export type readingTypeType = z.infer<typeof readingTypeSchema>;
const _satisfies_readingTypeSchema: z.ZodType<readingTypeType> = readingTypeSchema;
type _nodrift_readingTypeSchema = NoDrift<z.infer<typeof readingTypeSchema>, readingTypeType>;
export const reprintReasonSchema = zEnum(REPRINT_REASON_VALUES);
export type reprintReasonType = z.infer<typeof reprintReasonSchema>;
const _satisfies_reprintReasonSchema: z.ZodType<reprintReasonType> = reprintReasonSchema;
type _nodrift_reprintReasonSchema = NoDrift<z.infer<typeof reprintReasonSchema>, reprintReasonType>;
export const reprintStatusSchema = zEnum(REPRINT_STATUS_VALUES);
export type reprintStatusType = z.infer<typeof reprintStatusSchema>;
const _satisfies_reprintStatusSchema: z.ZodType<reprintStatusType> = reprintStatusSchema;
type _nodrift_reprintStatusSchema = NoDrift<z.infer<typeof reprintStatusSchema>, reprintStatusType>;
export const rolePrioritySchema = zEnum(ROLE_PRIORITY_VALUES);
export type rolePriorityType = z.infer<typeof rolePrioritySchema>;
const _satisfies_rolePrioritySchema: z.ZodType<rolePriorityType> = rolePrioritySchema;
type _nodrift_rolePrioritySchema = NoDrift<z.infer<typeof rolePrioritySchema>, rolePriorityType>;
export const severitySchema = zEnum(SEVERITY_VALUES);
export type severityType = z.infer<typeof severitySchema>;
const _satisfies_severitySchema: z.ZodType<severityType> = severitySchema;
type _nodrift_severitySchema = NoDrift<z.infer<typeof severitySchema>, severityType>;
export const sexSchema = zEnum(SEX_VALUES);
export type sexType = z.infer<typeof sexSchema>;
const _satisfies_sexSchema: z.ZodType<sexType> = sexSchema;
type _nodrift_sexSchema = NoDrift<z.infer<typeof sexSchema>, sexType>;
export const sortAnimalBySchema = zEnum(SORT_ANIMAL_BY_VALUES);
export type sortAnimalByType = z.infer<typeof sortAnimalBySchema>;
const _satisfies_sortAnimalBySchema: z.ZodType<sortAnimalByType> = sortAnimalBySchema;
type _nodrift_sortAnimalBySchema = NoDrift<z.infer<typeof sortAnimalBySchema>, sortAnimalByType>;
export const sortByEartagSchema = zEnum(SORT_BY_EARTAG_VALUES);
export type sortByEartagType = z.infer<typeof sortByEartagSchema>;
const _satisfies_sortByEartagSchema: z.ZodType<sortByEartagType> = sortByEartagSchema;
type _nodrift_sortByEartagSchema = NoDrift<z.infer<typeof sortByEartagSchema>, sortByEartagType>;
export const sortByFarmSchema = zEnum(SORT_BY_FARM_VALUES);
export type sortByFarmType = z.infer<typeof sortByFarmSchema>;
const _satisfies_sortByFarmSchema: z.ZodType<sortByFarmType> = sortByFarmSchema;
type _nodrift_sortByFarmSchema = NoDrift<z.infer<typeof sortByFarmSchema>, sortByFarmType>;
export const sortByMovementSchema = zEnum(SORT_BY_MOVEMENT_VALUES);
export type sortByMovementType = z.infer<typeof sortByMovementSchema>;
const _satisfies_sortByMovementSchema: z.ZodType<sortByMovementType> = sortByMovementSchema;
type _nodrift_sortByMovementSchema = NoDrift<z.infer<typeof sortByMovementSchema>, sortByMovementType>;
export const sortByUserSchema = zEnum(SORT_BY_USER_VALUES);
export type sortByUserType = z.infer<typeof sortByUserSchema>;
const _satisfies_sortByUserSchema: z.ZodType<sortByUserType> = sortByUserSchema;
type _nodrift_sortByUserSchema = NoDrift<z.infer<typeof sortByUserSchema>, sortByUserType>;
export const sortOrderSchema = zEnum(SORT_ORDER_VALUES);
export type sortOrderType = z.infer<typeof sortOrderSchema>;
const _satisfies_sortOrderSchema: z.ZodType<sortOrderType> = sortOrderSchema;
type _nodrift_sortOrderSchema = NoDrift<z.infer<typeof sortOrderSchema>, sortOrderType>;
export const stateCodeSchema = zEnum(STATE_CODE_VALUES);
export type stateCodeType = z.infer<typeof stateCodeSchema>;
const _satisfies_stateCodeSchema: z.ZodType<stateCodeType> = stateCodeSchema;
type _nodrift_stateCodeSchema = NoDrift<z.infer<typeof stateCodeSchema>, stateCodeType>;
export const subjectRoleSchema = zEnum(SUBJECT_ROLE_VALUES);
export type subjectRoleType = z.infer<typeof subjectRoleSchema>;
const _satisfies_subjectRoleSchema: z.ZodType<subjectRoleType> = subjectRoleSchema;
type _nodrift_subjectRoleSchema = NoDrift<z.infer<typeof subjectRoleSchema>, subjectRoleType>;
export const syncErrorTypeSchema = zEnum(SYNC_ERROR_TYPE_VALUES);
export type syncErrorTypeType = z.infer<typeof syncErrorTypeSchema>;
const _satisfies_syncErrorTypeSchema: z.ZodType<syncErrorTypeType> = syncErrorTypeSchema;
type _nodrift_syncErrorTypeSchema = NoDrift<z.infer<typeof syncErrorTypeSchema>, syncErrorTypeType>;
export const syncStatusSchema = zEnum(SYNC_STATUS_VALUES);
export type syncStatusType = z.infer<typeof syncStatusSchema>;
const _satisfies_syncStatusSchema: z.ZodType<syncStatusType> = syncStatusSchema;
type _nodrift_syncStatusSchema = NoDrift<z.infer<typeof syncStatusSchema>, syncStatusType>;
export const tagCategorySchema = zEnum(TAG_CATEGORY_VALUES);
export type tagCategoryType = z.infer<typeof tagCategorySchema>;
const _satisfies_tagCategorySchema: z.ZodType<tagCategoryType> = tagCategorySchema;
type _nodrift_tagCategorySchema = NoDrift<z.infer<typeof tagCategorySchema>, tagCategoryType>;
export const takeoverStatusSchema = zEnum(TAKEOVER_STATUS_VALUES);
export type takeoverStatusType = z.infer<typeof takeoverStatusSchema>;
const _satisfies_takeoverStatusSchema: z.ZodType<takeoverStatusType> = takeoverStatusSchema;
type _nodrift_takeoverStatusSchema = NoDrift<z.infer<typeof takeoverStatusSchema>, takeoverStatusType>;
export const testResultSchema = zEnum(TEST_RESULT_VALUES);
export type testResultType = z.infer<typeof testResultSchema>;
const _satisfies_testResultSchema: z.ZodType<testResultType> = testResultSchema;
type _nodrift_testResultSchema = NoDrift<z.infer<typeof testResultSchema>, testResultType>;
export const testTypeSchema = zEnum(TEST_TYPE_VALUES);
export type testTypeType = z.infer<typeof testTypeSchema>;
const _satisfies_testTypeSchema: z.ZodType<testTypeType> = testTypeSchema;
type _nodrift_testTypeSchema = NoDrift<z.infer<typeof testTypeSchema>, testTypeType>;
export const transmissionTypeSchema = zEnum(TRANSMISSION_TYPE_VALUES);
export type transmissionTypeType = z.infer<typeof transmissionTypeSchema>;
const _satisfies_transmissionTypeSchema: z.ZodType<transmissionTypeType> = transmissionTypeSchema;
type _nodrift_transmissionTypeSchema = NoDrift<z.infer<typeof transmissionTypeSchema>, transmissionTypeType>;
export const userRoleSchema = zEnum(USER_ROLE_VALUES);
export type userRoleType = z.infer<typeof userRoleSchema>;
const _satisfies_userRoleSchema: z.ZodType<userRoleType> = userRoleSchema;
type _nodrift_userRoleSchema = NoDrift<z.infer<typeof userRoleSchema>, userRoleType>;
export const userStatusSchema = zEnum(USER_STATUS_VALUES);
export type userStatusType = z.infer<typeof userStatusSchema>;
const _satisfies_userStatusSchema: z.ZodType<userStatusType> = userStatusSchema;
type _nodrift_userStatusSchema = NoDrift<z.infer<typeof userStatusSchema>, userStatusType>;
export const vaccineTypeSchema = zEnum(VACCINE_TYPE_VALUES);
export type vaccineTypeType = z.infer<typeof vaccineTypeSchema>;
const _satisfies_vaccineTypeSchema: z.ZodType<vaccineTypeType> = vaccineTypeSchema;
type _nodrift_vaccineTypeSchema = NoDrift<z.infer<typeof vaccineTypeSchema>, vaccineTypeType>;
export const verificationStatusSchema = zEnum(VERIFICATION_STATUS_VALUES);
export type verificationStatusType = z.infer<typeof verificationStatusSchema>;
const _satisfies_verificationStatusSchema: z.ZodType<verificationStatusType> = verificationStatusSchema;
type _nodrift_verificationStatusSchema = NoDrift<z.infer<typeof verificationStatusSchema>, verificationStatusType>;
export const vsContractStatusSchema = zEnum(VS_CONTRACT_STATUS_VALUES);
export type vsContractStatusType = z.infer<typeof vsContractStatusSchema>;
const _satisfies_vsContractStatusSchema: z.ZodType<vsContractStatusType> = vsContractStatusSchema;
type _nodrift_vsContractStatusSchema = NoDrift<z.infer<typeof vsContractStatusSchema>, vsContractStatusType>;
export const weighingTypeSchema = zEnum(WEIGHING_TYPE_VALUES);
export type weighingTypeType = z.infer<typeof weighingTypeSchema>;
const _satisfies_weighingTypeSchema: z.ZodType<weighingTypeType> = weighingTypeSchema;
type _nodrift_weighingTypeSchema = NoDrift<z.infer<typeof weighingTypeSchema>, weighingTypeType>;
export const writeRolesSchema = zEnum(WRITE_ROLE_VALUES);
export type writeRolesType = z.infer<typeof writeRolesSchema>;
const _satisfies_writeRolesSchema: z.ZodType<writeRolesType> = writeRolesSchema;
type _nodrift_writeRolesSchema = NoDrift<z.infer<typeof writeRolesSchema>, writeRolesType>;

// ⚔️ Activate ALL 87 guillotine proofs
export type _Activate = ActivateGuillotines<[
  _nodrift_adminRolesSchema,
  _nodrift_administrationRouteSchema,
  _nodrift_allocationStatusSchema,
  _nodrift_allocationTypeSchema,
  _nodrift_animalStatusSchema,
  _nodrift_approvalActionSchema,
  _nodrift_archiveDocumentTypeSchema,
  _nodrift_archiveLocationSchema,
  _nodrift_auditActionSchema,
  _nodrift_birthNotificationStatusSchema,
  _nodrift_birthTypeSchema,
  _nodrift_conflictResolutionStatusSchema,
  _nodrift_contingentTypeSchema,
  _nodrift_correctionCaseTypeSchema,
  _nodrift_correctionStatusSchema,
  _nodrift_dataSourceSchema,
  _nodrift_deathCauseSchema,
  _nodrift_deliveryMethodSchema,
  _nodrift_detectionSourceSchema,
  _nodrift_deviceStatusSchema,
  _nodrift_distributionMethodSchema,
  _nodrift_duplicateTypeSchema,
  _nodrift_earTagOrderStatusSchema,
  _nodrift_earTagReplacementReasonSchema,
  _nodrift_earTagReplacementStatusSchema,
  _nodrift_earTagStatusSchema,
  _nodrift_eartagTransitionStatusSchema,
  _nodrift_emailStatusSchema,
  _nodrift_entityTypeSchema,
  _nodrift_environmentSchema,
  _nodrift_eventSourceSchema,
  _nodrift_farmBookStatusSchema,
  _nodrift_farmReadRolesSchema,
  _nodrift_farmTypeSchema,
  _nodrift_fenceTypeSchema,
  _nodrift_geofenceEventSourceSchema,
  _nodrift_geofenceEventTypeSchema,
  _nodrift_healthRecordTypeSchema,
  _nodrift_healthSeveritySchema,
  _nodrift_holdingTypeSchema,
  _nodrift_importExportStatusSchema,
  _nodrift_importTypeSchema,
  _nodrift_inspectionStatusSchema,
  _nodrift_iotDeviceStatusSchema,
  _nodrift_languageSchema,
  _nodrift_moduleTypeSchema,
  _nodrift_movementTypeSchema,
  _nodrift_notificationCategorySchema,
  _nodrift_notificationPrioritySchema,
  _nodrift_notificationStatusSchema,
  _nodrift_notificationTypeSchema,
  _nodrift_orderStatusSchema,
  _nodrift_orgReadRolesSchema,
  _nodrift_orgTypeSchema,
  _nodrift_outboxEventStatusSchema,
  _nodrift_parentTypeSchema,
  _nodrift_passportStatusSchema,
  _nodrift_pastureTypeSchema,
  _nodrift_processingStageSchema,
  _nodrift_readingTypeSchema,
  _nodrift_reprintReasonSchema,
  _nodrift_reprintStatusSchema,
  _nodrift_rolePrioritySchema,
  _nodrift_severitySchema,
  _nodrift_sexSchema,
  _nodrift_sortAnimalBySchema,
  _nodrift_sortByEartagSchema,
  _nodrift_sortByFarmSchema,
  _nodrift_sortByMovementSchema,
  _nodrift_sortByUserSchema,
  _nodrift_sortOrderSchema,
  _nodrift_stateCodeSchema,
  _nodrift_subjectRoleSchema,
  _nodrift_syncErrorTypeSchema,
  _nodrift_syncStatusSchema,
  _nodrift_tagCategorySchema,
  _nodrift_takeoverStatusSchema,
  _nodrift_testResultSchema,
  _nodrift_testTypeSchema,
  _nodrift_transmissionTypeSchema,
  _nodrift_userRoleSchema,
  _nodrift_userStatusSchema,
  _nodrift_vaccineTypeSchema,
  _nodrift_verificationStatusSchema,
  _nodrift_vsContractStatusSchema,
  _nodrift_weighingTypeSchema,
  _nodrift_writeRolesSchema
]>;
