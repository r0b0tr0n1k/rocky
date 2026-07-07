import type { AppRouter } from "./server";
import type { TRPCLink } from "@trpc/client";
import type { CreateTRPCReact } from "@trpc/react-query";

import { createTRPCReact, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/react-query";
import superjson from "superjson";

// -- GATEWAY ARCHITECTURE --
// Browser calls Next.js (relative URL), Next.js proxies to API.
// Works across continents -- browser never talks to API directly.
//

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();

function getBaseUrl(): string {
  // Browser: relative -> Next.js origin -> rewrite proxy -> API
  if (typeof window !== "undefined") return "";

  // SSR: direct API call (internal network / VPN)
  return process.env.API_URL ?? "http://localhost:8080";
}

export const trpcClientConfig: { links: TRPCLink<AppRouter>[] } = {
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
