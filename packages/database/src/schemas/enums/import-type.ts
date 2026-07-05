import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { IMPORT_TYPE_VALUES } from "../../constants/import-type.js";

export const importTypePgEnum = pgEnum('import_type', toPgEnumValues(IMPORT_TYPE_VALUES));
