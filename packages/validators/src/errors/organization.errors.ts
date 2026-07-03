// ── Organization TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const ORG_TRPC_ERROR_MAP: TRPCErrorMap = {
  ORG_NOT_FOUND: { code: "NOT_FOUND", message: "Organization not found" },
  ORG_DUPLICATE_NAME: { code: "CONFLICT", message: "Organization name already exists" },
  ORG_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  ORG_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
};
