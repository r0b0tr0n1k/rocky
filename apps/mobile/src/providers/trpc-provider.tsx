// ── tRPC Provider (Expo / React Native) ──
// Creates a tRPC React Query client connected to the NestJS backend.
// Cookie-based session via Better Auth (authClient.getCookie()).

import { authClient } from "#/lib/auth.js";
import type { AppRouter } from "@rocky/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpSubscriptionLink, loggerLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { createContext, type ReactNode, useState } from "react";
import superjson from "superjson";

/**
 * tRPC React Query client for the full AppRouter.
 *
 * In tRPC v11, createTRPCReact<AppRouter>() returns a typed client
 * with full procedure inference. No `as any` needed — the generated
 * AppRouter type from nestjs-trpc is a proper Router type.
 */
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
            transformer: superjson,
          }),
          false: httpBatchLink({
            url: `${apiUrl}/trpc`,
            transformer: superjson,
            async headers() {
              const cookie = authClient.getCookie();
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
