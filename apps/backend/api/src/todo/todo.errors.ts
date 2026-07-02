import type { TRPCError } from "@trpc/server";

export interface TodoErrorMapping {
  code: TRPCError["code"];
  message: string;
}

export const TODO_TRPC_ERROR_MAP: Record<string, TodoErrorMapping> = {
  TODO_NOT_FOUND: { code: "NOT_FOUND", message: "Todo not found" },
  TODO_NOT_AUTHORIZED: { code: "FORBIDDEN", message: "Not authorized to access this todo" },
  TODO_DATABASE_ERROR: { code: "INTERNAL_SERVER_ERROR", message: "Failed to process todo" },
};
