import { pgEnum } from "drizzle-orm/pg-core";
import { ARCHIVE_LOCATION_VALUES } from "../../constants/archive-location.js";
import { toPgEnumValues } from "../../constants/index.js";

export const archiveLocationPgEnum = pgEnum("archive_location", toPgEnumValues(ARCHIVE_LOCATION_VALUES));
