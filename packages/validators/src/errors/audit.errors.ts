// ── Audit TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const AUDIT_TRPC_ERROR_MAP: TRPCErrorMap = {
  AUDIT_NOT_FOUND: { code: "NOT_FOUND", message: "Audit record not found" },
  AUDIT_DB_ERROR: { code: "INTERNAL_SERVER_ERROR", message: "Audit database error" },
};
