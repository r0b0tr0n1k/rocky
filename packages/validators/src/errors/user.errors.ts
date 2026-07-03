// ── User TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const USER_TRPC_ERROR_MAP: TRPCErrorMap = {
  USER_NOT_FOUND: { code: "NOT_FOUND", message: "User not found" },
  USER_DUPLICATE_USERNAME: { code: "CONFLICT", message: "Username already exists" },
  USER_DUPLICATE_EMAIL: { code: "CONFLICT", message: "Email already exists" },
  USER_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  USER_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
};
