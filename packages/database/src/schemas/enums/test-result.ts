import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { TEST_RESULT_VALUES } from "../../constants/test-result.js";

export const testResultPgEnum = pgEnum('test_result', toPgEnumValues(TEST_RESULT_VALUES));
