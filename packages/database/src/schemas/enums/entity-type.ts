import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { ENTITY_TYPE_VALUES } from '../../constants/entity-type.js';

export const entityTypePgEnum = pgEnum('entity_type', toPgEnumValues(ENTITY_TYPE_VALUES));
