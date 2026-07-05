// ── Animal TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const ANIMAL_TRPC_ERROR_MAP: TRPCErrorMap = {
  ANIMAL_NOT_FOUND: { code: "NOT_FOUND", message: "Animal not found" },
  ANIMAL_DUPLICATE_EAR_TAG: { code: "CONFLICT", message: "Duplicate ear tag" },
  ANIMAL_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
  ANIMAL_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  ANIMAL_MOTHER_NOT_ON_FARM: { code: "BAD_REQUEST", message: "Mother not on farm at time of birth" },
  ANIMAL_MOTHER_NOT_ALIVE: { code: "BAD_REQUEST", message: "Mother not alive at time of birth" },
  ANIMAL_MOTHER_TOO_YOUNG: { code: "BAD_REQUEST", message: "Mother too young (must be ≥17 months)" },
  ANIMAL_INVALID_CALVING_GAP: { code: "BAD_REQUEST", message: "Calving gap too short (must be ≥365 days)" },
  ANIMAL_EAR_TAG_ALREADY_USED: { code: "CONFLICT", message: "Ear tag already applied to another animal" },
  ANIMAL_SELF_MOTHER: { code: "BAD_REQUEST", message: "Animal cannot be its own mother" },
  ANIMAL_INVALID_PARENT_SEX: { code: "BAD_REQUEST", message: "Invalid parent sex (mother must be female, father must be male)" },
};
