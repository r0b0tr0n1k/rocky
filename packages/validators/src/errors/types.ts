// ── TRPC Error Map Types ──
import type { TRPCError } from "@trpc/server";

export type TRPCErrorEntry = {
  code: TRPCError["code"];
  message: string;
};

export type TRPCErrorMap = Record<string, TRPCErrorEntry>;
