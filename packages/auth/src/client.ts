// ── Shared Auth Client Factory ──
// Creates a better-auth client for any platform (Next.js, Expo, etc.).
//
// Usage (Next.js):
//   const authClient = createRockyAuthClient();
//   const { data } = await authClient.getSession();
//
// Usage (Expo):
//   import { expoClient } from "@better-auth/expo/client";
//   import * as SecureStore from "expo-secure-store";
//   const authClient = createRockyAuthClient({
//     plugins: [expoClient({ scheme: "mobile", storage: SecureStore })],
//   });

import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";

export interface RockyAuthClientOptions {
  baseURL?: string;
  /** Extra plugins (expoClient for mobile, etc.) */
  // biome-ignore lint/suspicious/noExplicitAny: better-auth plugins have complex union types
  plugins?: any[];
}

/**
 * Create a Rocky auth client with common plugins pre-configured.
 */
export function createRockyAuthClient(options: RockyAuthClientOptions = {}) {
  const baseURL =
    options.baseURL ??
    (typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080")
      : "http://localhost:8080");

  return createAuthClient({
    baseURL,
    plugins: [
      adminClient(),
      organizationClient({
        dynamicAccessControl: { enabled: true },
      }),
      twoFactorClient(),
      ...(options.plugins ?? []),
    ],
  });
}
