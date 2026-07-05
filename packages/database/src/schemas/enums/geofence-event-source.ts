import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { GEOFENCE_EVENT_SOURCE_VALUES } from '../../constants/geofence-event-source.js';

export const geofenceEventSourcePgEnum = pgEnum('geofence_event_source', toPgEnumValues(GEOFENCE_EVENT_SOURCE_VALUES));
