import type { AppRouter } from "@rocky/trpc";
import { createTRPCReact, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/react-query";
import superjson from "superjson";

// Manual AppRouter stubs don't satisfy AnyRouter's _def/createCaller requirements.
// Type safety comes from the stub types at call sites (trpc.farm.list.useQuery etc.)
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
