import { createEnumValues } from "./_brand.js"

/**
 * Farm-Read Roles — farm-scoped read access (own farms only).
 */
export const FARM_READ_ROLE = {
    FARMER: "FARMER",
    SLAUGHTERHOUSE_OP: "SLAUGHTERHOUSE_OP",
    MARKET_OP: "MARKET_OP",
} as const;

export const FARM_READ_ROLE_VALUES = createEnumValues([
    FARM_READ_ROLE.FARMER,
    FARM_READ_ROLE.SLAUGHTERHOUSE_OP,
    FARM_READ_ROLE.MARKET_OP,
] as const);