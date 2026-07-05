import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { TAG_CATEGORY_VALUES } from '../../constants/tag-category.js';

export const tagCategoryPgEnum = pgEnum('tag_category', toPgEnumValues(TAG_CATEGORY_VALUES));
