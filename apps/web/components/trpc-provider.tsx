"use client";

// biome-ignore assist/source/organizeImports: OK
import { trpc, trpcClientConfig } from "#/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink } from "@trpc/client";
import { useState } from "react";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      ...trpcClientConfig,
      links: [loggerLink({ enabled: () => process.env.NODE_ENV === "development" }), ...trpcClientConfig.links],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
