import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { GEOFENCE_EVENT_TYPE_VALUES } from '../../constants/geofence-event-type.js';

export const geofenceEventTypePgEnum = pgEnum('geofence_event_type', toPgEnumValues(GEOFENCE_EVENT_TYPE_VALUES));
