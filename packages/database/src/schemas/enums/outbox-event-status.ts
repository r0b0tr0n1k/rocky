import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { OUTBOX_EVENT_STATUS_VALUES } from '../../constants/outbox-event-status.js';

export const outboxEventStatusPgEnum = pgEnum('outbox_event_status', toPgEnumValues(OUTBOX_EVENT_STATUS_VALUES));
