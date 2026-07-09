import { authClient } from "@/lib/auth";
import type { AppRouter } from "@rocky/trpc";
import { transformer } from "@rocky/trpc/superjson";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpSubscriptionLink, loggerLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { createContext, type ReactNode, useState } from "react";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

export const TRPCContext = createContext<typeof trpc | undefined>(undefined);

export function TRPCProvider({ children, apiUrl }: { children: ReactNode; apiUrl: string }) {
  const [queryClient] = useState(() => new QueryClient());
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
              if (Platform.OS === "web") return {};
              const cookie = (authClient as unknown as { getCookie: () => string }).getCookie();
              if (cookie) {
                return { cookie };
              }
              return {};
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
