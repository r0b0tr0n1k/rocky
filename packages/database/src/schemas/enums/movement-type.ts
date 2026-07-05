import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { MOVEMENT_TYPE_VALUES } from "../../constants/movement-type.js";

export const movementTypePgEnum = pgEnum('movement_type', toPgEnumValues(MOVEMENT_TYPE_VALUES));
