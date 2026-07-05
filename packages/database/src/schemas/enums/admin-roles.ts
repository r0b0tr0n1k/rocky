import { pgEnum } from "drizzle-orm/pg-core";
import { ADMIN_ROLE_VALUES } from "../../constants/admin-roles.js";
import { toPgEnumValues } from "../../constants/index.js";

export const adminRolesPgEnum = pgEnum("admin_roles", toPgEnumValues(ADMIN_ROLE_VALUES));
