import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { TRANSMISSION_TYPE_VALUES } from '../../constants/transmission-type.js';

export const transmissionTypePgEnum = pgEnum('transmission_type', toPgEnumValues(TRANSMISSION_TYPE_VALUES));
