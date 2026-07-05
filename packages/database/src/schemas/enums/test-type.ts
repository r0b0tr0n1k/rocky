import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { TEST_TYPE_VALUES } from "../../constants/test-type.js";

export const testTypePgEnum = pgEnum('test_type', toPgEnumValues(TEST_TYPE_VALUES));
