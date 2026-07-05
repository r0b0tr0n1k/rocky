import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { STATE_CODE_VALUES } from "../../constants/state-code.js";

export const stateCodePgEnum = pgEnum('state_code', toPgEnumValues(STATE_CODE_VALUES));
