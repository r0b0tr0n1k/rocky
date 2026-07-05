import { createEnumValues } from "./_brand.js"

export const HEALTH_RECORD_TYPE = {
  VACCINATION: "vaccination",
  TREATMENT: "treatment",
  LAB_TEST: "labTest",
} as const;

export const HEALTH_RECORD_TYPE_VALUES = createEnumValues([
  HEALTH_RECORD_TYPE.VACCINATION,
  HEALTH_RECORD_TYPE.TREATMENT,
  HEALTH_RECORD_TYPE.LAB_TEST,
] as const);
