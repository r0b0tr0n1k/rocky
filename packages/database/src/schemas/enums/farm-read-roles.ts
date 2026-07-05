import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { FARM_READ_ROLE_VALUES } from "../../constants/farm-read-roles.js";

export const farmReadRolesPgEnum = pgEnum('farm_read_roles', toPgEnumValues(FARM_READ_ROLE_VALUES));
