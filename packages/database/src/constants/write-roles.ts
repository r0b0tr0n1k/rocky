import { createEnumValues } from "./_brand.js"

/**
 * Write Roles - allowed to modify data (`withCheck`).
 */
export const WRITE_ROLE = {
    SUPER_ADMIN: "SUPER_ADMIN",
    VD_ADMIN: "VD_ADMIN",
    VD_STAFF: "VD_STAFF",
    VETERINARIAN: "VETERINARIAN",
} as const;

export const WRITE_ROLE_VALUES = createEnumValues([
    WRITE_ROLE.SUPER_ADMIN,
    WRITE_ROLE.VD_ADMIN,
    WRITE_ROLE.VD_STAFF,
    WRITE_ROLE.VETERINARIAN,
] as const);