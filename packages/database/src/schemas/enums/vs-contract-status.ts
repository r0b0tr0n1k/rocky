import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { VS_CONTRACT_STATUS_VALUES } from '../../constants/vs-contract-status.js';

export const vsContractStatusPgEnum = pgEnum('vs_contract_status', toPgEnumValues(VS_CONTRACT_STATUS_VALUES));
