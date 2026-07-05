// --- Dumb Zod - Animals & Movements Domain ---

import { animalParents, animals } from "../schema/an/animals.js";
import { birthNotifications } from "../schema/an/birth-notifications.js";
import { earTagAllocations } from "../schema/an/ear-tag-allocations.js";
import { earTagOrders } from "../schema/an/ear-tag-orders.js";
import { earTagReplacements } from "../schema/an/ear-tag-replacements.js";
import { earTagTakeovers } from "../schema/an/ear-tag-takeovers.js";
import { earTagTypes } from "../schema/an/ear-tag-types.js";
import { earTags } from "../schema/an/ear-tags.js";
import { movements } from "../schema/an/movements.js";
import { pastureDeclarations } from "../schema/an/pasture.js";
import { createInsertSchema, createSelectSchema } from "./factory.js";

export const animalSelectSchema = createSelectSchema(animals);
export const animalInsertSchema = createInsertSchema(animals);

export const animalParentSelectSchema = createSelectSchema(animalParents);
export const animalParentInsertSchema = createInsertSchema(animalParents);

export const movementSelectSchema = createSelectSchema(movements);
export const movementInsertSchema = createInsertSchema(movements);

export const birthNotificationSelectSchema = createSelectSchema(birthNotifications);
export const birthNotificationInsertSchema = createInsertSchema(birthNotifications);

export const pastureDeclarationSelectSchema = createSelectSchema(pastureDeclarations);
export const pastureDeclarationInsertSchema = createInsertSchema(pastureDeclarations);

export const earTagTypeSelectSchema = createSelectSchema(earTagTypes);
export const earTagTypeInsertSchema = createInsertSchema(earTagTypes);

export const earTagSelectSchema = createSelectSchema(earTags);
export const earTagInsertSchema = createInsertSchema(earTags);

export const earTagAllocationSelectSchema = createSelectSchema(earTagAllocations);
export const earTagAllocationInsertSchema = createInsertSchema(earTagAllocations);

export const earTagOrderSelectSchema = createSelectSchema(earTagOrders);
export const earTagOrderInsertSchema = createInsertSchema(earTagOrders);

export const earTagReplacementSelectSchema = createSelectSchema(earTagReplacements);
export const earTagReplacementInsertSchema = createInsertSchema(earTagReplacements);

export const earTagTakeoverSelectSchema = createSelectSchema(earTagTakeovers);
export const earTagTakeoverInsertSchema = createInsertSchema(earTagTakeovers);

// ── Domain tables ──
import { archiveDocuments } from "../schema/an/archive-documents.js";
import { pdaDevices } from "../schema/an/pda-devices.js";
import { cattlePassports } from "../schema/an/cattle-passports.js";
import { errorCorrections } from "../schema/an/error-corrections.js";
import { importExportRecords } from "../schema/an/import-export-records.js";
import { inspections } from "../schema/an/inspections.js";
import { riskAnalyses } from "../schema/an/risk-analyses.js";

export const archiveDocumentSelectSchema = createSelectSchema(archiveDocuments);
export const archiveDocumentInsertSchema = createInsertSchema(archiveDocuments);

export const cattlePassportSelectSchema = createSelectSchema(cattlePassports);
export const cattlePassportInsertSchema = createInsertSchema(cattlePassports);

export const errorCorrectionSelectSchema = createSelectSchema(errorCorrections);
export const errorCorrectionInsertSchema = createInsertSchema(errorCorrections);

export const importExportRecordSelectSchema = createSelectSchema(importExportRecords);
export const importExportRecordInsertSchema = createInsertSchema(importExportRecords);

export const inspectionSelectSchema = createSelectSchema(inspections);
export const inspectionInsertSchema = createInsertSchema(inspections);

export const riskAnalysisSelectSchema = createSelectSchema(riskAnalyses);
export const riskAnalysisInsertSchema = createInsertSchema(riskAnalyses);

// ── PDA Devices ──
export const pdaDeviceSelectSchema = createSelectSchema(pdaDevices);
export const pdaDeviceInsertSchema = createInsertSchema(pdaDevices);

// ── IoT / Biologging ──
import { iotDevices } from "../schema/an/iot-devices.js";
import { sensorReadings } from "../schema/an/sensor-readings.js";
import { geofences } from "../schema/an/geofences.js";
import { animalGeofenceEvents } from "../schema/an/animal-geofence-events.js";

export const iotDeviceSelectSchema = createSelectSchema(iotDevices);
export const iotDeviceInsertSchema = createInsertSchema(iotDevices);

export const sensorReadingSelectSchema = createSelectSchema(sensorReadings);
export const sensorReadingInsertSchema = createInsertSchema(sensorReadings);

export const geofenceSelectSchema = createSelectSchema(geofences);
export const geofenceInsertSchema = createInsertSchema(geofences);

export const animalGeofenceEventSelectSchema = createSelectSchema(animalGeofenceEvents);
export const animalGeofenceEventInsertSchema = createInsertSchema(animalGeofenceEvents);
