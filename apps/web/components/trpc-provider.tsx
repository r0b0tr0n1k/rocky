"use client";

// biome-ignore assist/source/organizeImports: OK
import { createRockyTRPCClient, TRPCProvider as TRPCContextProvider } from "#/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createRockyTRPCClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCContextProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCContextProvider>
    </QueryClientProvider>
  );
}
