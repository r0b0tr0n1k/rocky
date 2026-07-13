import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SPECIES_RANK_VALUES } from '../../constants/species-rank.js';

export const speciesRankPgEnum = pgEnum('species_rank', toPgEnumValues(SPECIES_RANK_VALUES));
