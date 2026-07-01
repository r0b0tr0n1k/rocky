// ── Dumb Zod — Animals & Movements Domain ──

import { createSelectSchema, createInsertSchema } from "./factory";
import { animals, animalParents } from "../schema/an/animals";
import { movements } from "../schema/an/movements";
import { birthNotifications } from "../schema/an/birth-notifications";
import { slaughterRecords } from "../schema/an/slaughter";
import { pastureDeclarations } from "../schema/an/pasture";

export const animalSelectSchema = createSelectSchema(animals);
export const animalInsertSchema = createInsertSchema(animals);

export const animalParentSelectSchema = createSelectSchema(animalParents);
export const animalParentInsertSchema = createInsertSchema(animalParents);

export const movementSelectSchema = createSelectSchema(movements);
export const movementInsertSchema = createInsertSchema(movements);

export const birthNotificationSelectSchema =
	createSelectSchema(birthNotifications);
export const birthNotificationInsertSchema =
	createInsertSchema(birthNotifications);

export const slaughterRecordSelectSchema = createSelectSchema(slaughterRecords);
export const slaughterRecordInsertSchema = createInsertSchema(slaughterRecords);

export const pastureDeclarationSelectSchema =
	createSelectSchema(pastureDeclarations);
export const pastureDeclarationInsertSchema =
	createInsertSchema(pastureDeclarations);
