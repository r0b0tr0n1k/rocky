import { authClient } from "@/lib/auth";
import type { AppRouter } from "@rocky/trpc";
import { transformer } from "@rocky/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpSubscriptionLink, loggerLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { createContext, type ReactNode, useState } from "react";

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
            transformer: transformer as any,
          }),
          false: httpBatchLink({
            url: `${apiUrl}/trpc`,
            transformer: transformer as any,
            async headers() {
              const cookie = (authClient as unknown as { getCookie: () => string }).getCookie();
              if (cookie) {
                return { cookie };
              }
              return {};
            },
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
