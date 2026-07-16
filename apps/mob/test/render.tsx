import type React from "react";
import { render, type RenderOptions as RTLRenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createFakeLink, type FakeHandler } from "./trpc-fake-client";
import { trpc } from "@/providers/trpc-provider";
import { vi } from "vitest";

// The mobile auth client and offline SQLite layer pull in expo-constants /
// expo-secure-store / expo-sqlite, whose entries are TypeScript source that
// Vite 8 cannot strip under node_modules. The provider is imported for the
// shared `trpc` object, so replace those native deps with inert stubs here
// (co-located with the helper) so any test using renderWithProviders boots
// cleanly under jsdom. expo-router / @/lib/notify are mocked in vitest.setup.ts.
vi.mock("@/lib/auth", () => ({
  authClient: { getCookie: () => "" },
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  getSession: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("expo-sqlite", () => ({
  openDatabaseSync: () => ({
    execSync: () => {},
    getFirstSync: () => undefined,
    runSync: () => {},
  }),
}));

export interface RenderOptions extends Omit<RTLRenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  linkHandlers?: Record<string, FakeHandler>;
}

/** QueryClient with retry off + staleTime Infinity so seeded data never refetches. */
export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: React.ReactElement, options: RenderOptions = {}) {
  const { queryClient = makeTestQueryClient(), linkHandlers = {}, ...rtl } = options;
  const client = trpc.createClient({ links: [createFakeLink(linkHandlers)] });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...rtl }) };
}

/** Seed a query result via the real tRPC queryKey helper (resolves against AppRouter). */
export function seedQuery(queryClient: QueryClient, queryKey: readonly unknown[], data: unknown) {
  queryClient.setQueryData(queryKey as unknown[], data);
}
