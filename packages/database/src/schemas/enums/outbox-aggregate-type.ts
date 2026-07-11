import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { OUTBOX_AGGREGATE_TYPE_VALUES } from '../../constants/outbox-aggregate-type.js';

export const outboxAggregateTypePgEnum = pgEnum('outbox_aggregate_type', toPgEnumValues(OUTBOX_AGGREGATE_TYPE_VALUES));
