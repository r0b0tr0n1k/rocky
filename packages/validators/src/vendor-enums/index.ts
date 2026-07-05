// --- Vendor Enums - Pure Re-exports ---
// LAW XI: Frontend must import dictionaries from validators, NOT @rocky/database directly.
// This is the gate that ensures the Diamond Seal enum chain is respected:
//   constants/ → schemas/enums/ (pgEnum) → validators/enums/ (zEnum) → vendor-enums/ (re-export)

// ── Dictionary constants (for dropdowns, labels, etc.) ──
export {
    ANIMAL_STATUS,
    BIRTH_TYPE,
    CONTINGENT_TYPE,
    DATA_SOURCE,
    DUPLICATE_TYPE,
    EAR_TAG_ORDER_STATUS,
    EAR_TAG_REPLACEMENT_REASON,
    EAR_TAG_REPLACEMENT_STATUS,
    EAR_TAG_STATUS,
    FARM_TYPE,
    MOVEMENT_TYPE,
    NOTIFICATION_CATEGORY,
    NOTIFICATION_PRIORITY,
    NOTIFICATION_STATUS,
    NOTIFICATION_TYPE,
    ORDER_STATUS,
    SEX,
    SUBJECT_ROLE,
    USER_ROLE,
    USER_STATUS,
    VERIFICATION_STATUS
} from "@rocky/database/constants";

