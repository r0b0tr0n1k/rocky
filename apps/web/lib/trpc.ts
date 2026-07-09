import type { AppRouter } from "@rocky/trpc";
import type { TRPCLink } from "@trpc/client";
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  loggerLink,
  splitLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { transformer } from "@rocky/trpc/superjson";

// -- GATEWAY ARCHITECTURE --
// Browser calls Next.js (relative URL), Next.js proxies to API.
// Works across continents -- browser never talks to API directly.
//
// New TanStack React Query integration (tRPC v11 recommended):
// `createTRPCContext` gives us `TRPCProvider`, `useTRPC`, `useTRPCClient`.
// Call sites use `useQuery(trpc.x.queryOptions(input))` and
// `useMutation(trpc.x.mutationOptions(opts))`.

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

function getBaseUrl(): string {
  // Browser: relative -> Next.js origin -> rewrite proxy -> API
  if (typeof window !== "undefined") return "";

  // SSR: direct API call (internal network / VPN)
  return process.env.API_URL ?? "http://localhost:8080";
}

/** Build a tRPC client wired to the Next.js proxy gateway. */
export function createRockyTRPCClient(): ReturnType<typeof createTRPCClient<AppRouter>> {
  return createTRPCClient<AppRouter>({
    links: [
      loggerLink({ enabled: () => process.env.NODE_ENV === "development" }),
      splitLink({
        condition: (op) => op.type === "subscription",
        true: httpSubscriptionLink({
          url: `${getBaseUrl()}/trpc`,
          transformer,
        }),
        false: httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
          transformer,
          fetch(url, options) {
            return fetch(url, { ...options, credentials: "include" });
          },
        }),
      }),
    ],
  });
}
