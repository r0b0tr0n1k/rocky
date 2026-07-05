import { pgEnum } from "drizzle-orm/pg-core";
import { ADMIN_ROUTE_VALUES } from "../../constants/administration-route.js";
import { toPgEnumValues } from "../../constants/index.js";

export const administrationRoutePgEnum = pgEnum("administration_route", toPgEnumValues(ADMIN_ROUTE_VALUES));
