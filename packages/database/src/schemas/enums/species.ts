import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SPECIES_VALUES } from '../../constants/species.js';

export const speciesPgEnum = pgEnum('species', toPgEnumValues(SPECIES_VALUES));
