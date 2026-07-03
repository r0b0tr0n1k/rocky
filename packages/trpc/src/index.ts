import type { AppRouter } from "./generated/index.js";

export type { AppRouter };

export type MobileAppRouter = Omit<AppRouter, "useContext" | "useUtils" | "Provider">;

export { transformer, superjson } from "./superjson.js";
export type { AppContext } from "./context.js";
export { createResultUnwrapper, toAppError } from "./unwrap.js";
export { injectRlsContext, clearRlsContext } from "./middleware/withRls.js";
