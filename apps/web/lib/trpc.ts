// @ts-expect-error — AppRouter types generated at runtime by nestjs-trpc-v2, not in web deps
import type { AppRouter } from "@rocky/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCReact, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/react-query";
import superjson from "superjson";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const trpc = createTRPCReact<AppRouter>();

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
