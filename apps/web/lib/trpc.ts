import type { AppRouter } from "@rocky/trpc";
import { createTRPCReact, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/react-query";
import superjson from "superjson";

/**
 * tRPC React client.
 *
 * Uses `any` because the manual AppRouter stubs in `packages/trpc/src/generated/index.ts`
 * don't satisfy tRPC v11's `AnyRouter` type constraint. `AnyRouter` is an unstable
 * internal type (`@trpc/server/unstable-core-do-not-import`) that requires specific
 * `_def._config.$types` and `_def.record` shapes.
 *
 * Type safety at call sites comes from the stub's `_def._input_in` / `_def._output_out`
 * types on each procedure:
 *
 *   trpc.farm.getById.useQuery({ id })  →  typed as FarmResponse
 *   trpc.farm.getByid.useQuery({ id })  →  runtime error (no compile-time catch)
 *
 * To restore full `createTRPCReact<AppRouter>()` typing, the AppRouter stubs must
 * be extended with a base type that satisfies AnyRouter's structural contract.
 * See docs/TRPC_SETUP_GUIDE.md §7 for the auto-gen vs manual stubs strategy.
 */
export const trpc = createTRPCReact<any>() as any;

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL required for SSR");
  }
  return apiUrl;
}

export const trpcClientConfig = {
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: httpSubscriptionLink({
        url: `${getBaseUrl()}/trpc`,
        transformer: superjson,
      }),
      false: httpBatchLink({
        url: `${getBaseUrl()}/trpc`,
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    }),
  ],
};
