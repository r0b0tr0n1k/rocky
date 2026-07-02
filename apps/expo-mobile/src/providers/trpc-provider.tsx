import { createContext, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@prasici/trpc/generated";
import { getAuthCookie } from "#/lib/auth";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export const TRPCContext = createContext<typeof trpc | undefined>(undefined);

export function TRPCProvider({ children, apiUrl }: { children: ReactNode; apiUrl: string }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${apiUrl}/trpc`,
          headers() {
            if (Platform.OS === "web") return {};
            const cookie = getAuthCookie();
            if (!cookie) return {};
            return { cookie, "expo-origin": Linking.createURL("", { scheme: "mobile" }) };
          },
          fetch: (url, options) => {
            if (Platform.OS === "web") {
              return fetch(url, { ...options, credentials: "include" });
            }
            return fetch(url, { ...options, credentials: "omit" });
          },
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
