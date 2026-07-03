import { createEnumValues } from "./_brand.js";

/**
 * Delivery Method — HK-veterinary data submission channels.
 *
 * HK_IMP: HK Import (bulk file import)
 * HK_PDA: HK PDA (handheld field scanner)
 */
export const DELIVERY_METHOD = {
  HK_IMP: "HK_IMP",
  HK_PDA: "HK_PDA",
} as const;

export const DELIVERY_METHOD_VALUES = createEnumValues([DELIVERY_METHOD.HK_IMP, DELIVERY_METHOD.HK_PDA] as const);
