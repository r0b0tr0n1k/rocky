import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { IMPORT_EXPORT_STATUS_VALUES } from '../../constants/import-export-status.js';

export const importExportStatusPgEnum = pgEnum('import_export_status', toPgEnumValues(IMPORT_EXPORT_STATUS_VALUES));
