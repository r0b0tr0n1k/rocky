import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { DISEASE_CATEGORY_VALUES } from '../../constants/disease-category.js';

export const diseaseCategoryPgEnum = pgEnum('disease_category', toPgEnumValues(DISEASE_CATEGORY_VALUES));
