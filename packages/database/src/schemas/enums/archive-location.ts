import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { ARCHIVE_LOCATION_VALUES } from '../../constants/archive-location.js';

export const archiveLocationPgEnum = pgEnum('archive_location', toPgEnumValues(ARCHIVE_LOCATION_VALUES));
