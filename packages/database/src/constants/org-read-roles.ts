import { createEnumValues } from "./_brand.js"

/**
 * Org-Read Roles - org-scoped read access (VETERINARIAN, TECHNICIAN).
 */
export const ORG_READ_ROLE = {
    VETERINARIAN: "VETERINARIAN",
    TECHNICIAN: "TECHNICIAN",
} as const;

export const ORG_READ_ROLE_VALUES = createEnumValues([
    ORG_READ_ROLE.VETERINARIAN,
    ORG_READ_ROLE.TECHNICIAN,
] as const);