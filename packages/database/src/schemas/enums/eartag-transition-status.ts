import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { EARTAG_TRANSITION_STATUS_VALUES } from "../../constants/eartag-transition-status.js";

export const eartagTransitionStatusPgEnum = pgEnum('eartag_transition_status', toPgEnumValues(EARTAG_TRANSITION_STATUS_VALUES));
