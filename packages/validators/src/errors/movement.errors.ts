// ── Movement TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const MOVEMENT_TRPC_ERROR_MAP: TRPCErrorMap = {
  MOVEMENT_NOT_FOUND: { code: "NOT_FOUND", message: "Movement not found" },
  MOVEMENT_INVALID_DATES: { code: "BAD_REQUEST", message: "Invalid movement dates" },
  MOVEMENT_SAME_FARM_ERROR: { code: "BAD_REQUEST", message: "Cannot move animal to same farm" },
  MOVEMENT_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
  MOVEMENT_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  MOVEMENT_ANIMAL_NOT_ALIVE: { code: "BAD_REQUEST", message: "Animal is not alive" },
  MOVEMENT_ANIMAL_NOT_ON_FARM: { code: "BAD_REQUEST", message: "Animal not at departure farm" },
  MOVEMENT_DEATH_CAUSE_REQUIRED: { code: "BAD_REQUEST", message: "Death cause is required" },
  MOVEMENT_STILLBORN_THRESHOLD: { code: "BAD_REQUEST", message: "Animal below stillborn threshold (≤25 days)" },
  MOVEMENT_PASTURE_ANIMAL_NOT_HOME: { code: "BAD_REQUEST", message: "Animal not at home farm for pasture" },
  MOVEMENT_PASTURE_AUTO_TRANSFER: { code: "BAD_REQUEST", message: "Cannot auto-transfer between pastures" },
  MOVEMENT_PASTURE_INVALID_DEPARTURE: { code: "BAD_REQUEST", message: "Invalid pasture departure" },
  MOVEMENT_SLAUGHTER_MIN_AGE: { code: "BAD_REQUEST", message: "Animal below minimum slaughter age (25 days)" },
  MOVEMENT_UNREGISTERED_FARM: { code: "BAD_REQUEST", message: "Unregistered farm" },
  MOVEMENT_IMPORT_ALREADY_REGISTERED: { code: "CONFLICT", message: "Animal already registered in this country" },
  MOVEMENT_EXPORT_ANIMAL_NOT_FOUND: { code: "NOT_FOUND", message: "Animal not found for export" },
};
