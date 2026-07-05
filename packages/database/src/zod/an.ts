// --- Dumb Zod - Animals & Movements Domain ---

import { animalParents, animals } from "../schema/an/animals.js";
import { birthNotifications } from "../schema/an/birth-notifications.js";
import { earTagAllocations } from "../schema/an/ear-tag-allocations.js";
import { earTagOrders } from "../schema/an/ear-tag-orders.js";
import { earTagReplacements } from "../schema/an/ear-tag-replacements.js";
import { earTagTypes } from "../schema/an/ear-tag-types.js";
import { earTags } from "../schema/an/ear-tags.js";
import { movements } from "../schema/an/movements.js";
import { pastureDeclarations } from "../schema/an/pasture.js";
import { slaughterRecords } from "../schema/an/slaughter.js";
import { createInsertSchema, createSelectSchema } from "./factory.js";

export const animalSelectSchema = createSelectSchema(animals);
export const animalInsertSchema = createInsertSchema(animals);

export const animalParentSelectSchema = createSelectSchema(animalParents);
export const animalParentInsertSchema = createInsertSchema(animalParents);

export const movementSelectSchema = createSelectSchema(movements);
export const movementInsertSchema = createInsertSchema(movements);

export const birthNotificationSelectSchema = createSelectSchema(birthNotifications);
export const birthNotificationInsertSchema = createInsertSchema(birthNotifications);

export const slaughterRecordSelectSchema = createSelectSchema(slaughterRecords);
export const slaughterRecordInsertSchema = createInsertSchema(slaughterRecords);

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
