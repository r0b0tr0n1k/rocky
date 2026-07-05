// Re-export AppRouter type from auto-generated server.ts (typeof appRouter = real tRPC Router type).
// The manual interface was replaced because createTRPCReact<T> requires _def, createCaller etc.
export type { AppRouter } from "./server.js";
