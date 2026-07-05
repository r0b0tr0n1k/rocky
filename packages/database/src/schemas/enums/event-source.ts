import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { EVENT_SOURCE_VALUES } from "../../constants/event-source.js";

export const eventSourcePgEnum = pgEnum('event_source', toPgEnumValues(EVENT_SOURCE_VALUES));
