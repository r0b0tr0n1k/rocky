import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { DISEASE_EVENT_STATUS_VALUES } from '../../constants/disease-event-status.js';

export const diseaseEventStatusPgEnum = pgEnum('disease_event_status', toPgEnumValues(DISEASE_EVENT_STATUS_VALUES));
