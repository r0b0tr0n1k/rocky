import { authClient } from "@/lib/auth";
import type { AppRouter } from "@rocky/trpc";
import { transformer } from "@rocky/trpc/superjson";
import { QueryClient, QueryCache, MutationCache, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { getQueryPersister } from "@/lib/offline/persist";
import { httpBatchLink, httpSubscriptionLink, isTRPCClientError, loggerLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { createContext, type ReactNode, useEffect, useState } from "react";
import { Platform } from "react-native";
import { notifyError } from "@/lib/notify";

/** Maps a tRPC client error to a user-visible toast (WO-088: never swallow). */
function surfaceTrpcError(error: unknown) {
  if (isTRPCClientError(error) && error.data?.code === "FORBIDDEN") {
    notifyError(new Error("You don't have permission to do that"));
    return;
  }
  notifyError(error);
}

export const trpc = createTRPCReact<AppRouter>();

export const TRPCContext = createContext<typeof trpc | undefined>(undefined);

export function TRPCProvider({ children, apiUrl }: { children: ReactNode; apiUrl: string }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      queryCache: new QueryCache({
        // Surface first-load failures; skip background-refetch noise (stale data still shown).
        onError: (error, query) => {
          if (query.state.data !== undefined) return;
          surfaceTrpcError(error);
        },
      }),
      mutationCache: new MutationCache({
        onError: (error) => surfaceTrpcError(error),
      }),
      defaultOptions: {
        queries: { gcTime: 1000 * 60 * 60 * 24 },
      },
    }),
  );
  useEffect(() => {
    const persister = getQueryPersister();
    if (!persister) return; // web: no offline SQLite persistence (native-only, ADR-0036)
    void persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }, [queryClient]);
  // Cloudflare Access service-token headers. When EXPO_PUBLIC_CF_ACCESS_CLIENT_ID / _SECRET are set
  // (dev/test against a Cloudflare-fronted backend), every tRPC request carries them so the app clears
  // the Access challenge without an interactive login. Empty when unset (no Cloudflare in front).
  const cfHeaders: Record<string, string> = {};
  if (process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_ID) {
    cfHeaders["CF-Access-Client-Id"] = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_ID;
  }
  if (process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET) {
    cfHeaders["CF-Access-Client-Secret"] = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET;
  }

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => __DEV__ }),
        splitLink({
          condition: (op) => op.type === "subscription",
          true: httpSubscriptionLink({
            url: `${apiUrl}/trpc`,
            transformer,
          }),
          false: httpBatchLink({
            url: `${apiUrl}/trpc`,
            transformer,
            async headers() {
              const headers: Record<string, string> = { ...cfHeaders };
              if (Platform.OS === "web") return headers;
              const cookie = (authClient as unknown as { getCookie: () => string }).getCookie();
              if (cookie) {
                headers["cookie"] = cookie;
              }
              return headers;
            },
            ...(Platform.OS === "web"
              ? { fetch: (url, opts) => fetch(url, { ...opts, credentials: "include" as const }) }
              : {}),
          }),
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
