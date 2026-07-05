import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { ORG_READ_ROLE_VALUES } from "../../constants/org-read-roles.js";

export const orgReadRolesPgEnum = pgEnum('org_read_roles', toPgEnumValues(ORG_READ_ROLE_VALUES));
