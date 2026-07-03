import { createContext, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpSubscriptionLink, loggerLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { getAuthToken } from "#/lib/auth";

// Bypass tRPC v11's collision check:
// the AnyRouter type does not declare useContext/useUtils/Provider as procedures.
// We cast to `any` so createClient and .Provider remain callable in this repository's tooling.
export const trpc = createTRPCReact<any>() as any;

export const TRPCContext = createContext<typeof trpc | undefined>(undefined);

export function TRPCProvider({ children, apiUrl }: { children: ReactNode; apiUrl: string }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => __DEV__ }),
        splitLink({
          condition: op => op.type === "subscription",
          true: httpSubscriptionLink({
            url: `${apiUrl}/trpc`,
            transformer: superjson,
          }),
          false: httpBatchLink({
            url: `${apiUrl}/trpc`,
            transformer: superjson,
            async headers() {
              const token = await getAuthToken();
              if (token) {
                return { Authorization: `Bearer ${token}` };
              }
              return {};
            },
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
