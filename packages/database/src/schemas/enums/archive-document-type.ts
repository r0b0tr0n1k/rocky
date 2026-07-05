import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { ARCHIVE_DOCUMENT_TYPE_VALUES } from "../../constants/archive-document-type.js";

export const archiveDocumentTypePgEnum = pgEnum('archive_document_type', toPgEnumValues(ARCHIVE_DOCUMENT_TYPE_VALUES));
