import { createEnumValues } from "./_brand.js"

/**
 * Admin Roles — bypass all RLS scoping (read/write everything).
 */
export const ADMIN_ROLE = {
    SUPER_ADMIN: "SUPER_ADMIN",
    VD_ADMIN: "VD_ADMIN",
    VD_STAFF: "VD_STAFF",
} as const;

export const ADMIN_ROLE_VALUES = createEnumValues([
    ADMIN_ROLE.SUPER_ADMIN,
    ADMIN_ROLE.VD_ADMIN,
    ADMIN_ROLE.VD_STAFF,
] as const);