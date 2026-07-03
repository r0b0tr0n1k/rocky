import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SORT_ANIMAL_BY_VALUES } from '../../constants/sort-animal-by.js';

export const sortAnimalByPgEnum = pgEnum('sort_animal_by', toPgEnumValues(SORT_ANIMAL_BY_VALUES));
