// ── Shared Auth Client Factory ──
// Creates a better-auth client for any platform (Next.js, Expo, etc.).
//
// Identity-Only Boundary (ADR-0021): Better Auth answers "who are you?".
// Organization / RBAC / farm membership live in @rocky/authorization
// (PrincipalResolver + RLS `SET LOCAL app.current_org_id`). We therefore do
// NOT register Better Auth's organization() or twoFactor() plugins -- those
// would spawn competing tables and split the source of truth. The client
// carries only adminClient() (user/role admin surface) plus caller-supplied
// plugins (e.g. expoClient on native).
//
// Usage (Next.js):
//   const authClient = createRockyAuthClient();
//   const { data } = await authClient.getSession();
//
// Usage (Expo):
//   import { expoClient } from "@better-auth/expo/client";
//   import * as SecureStore from "expo-secure-store";
//   const authClient = createRockyAuthClient({
//     disableDefaultFetchPlugins: true, // RN: bypass default redirect plugin
//     plugins: [expoClient({ scheme: "mobile", storage: SecureStore })],
//   });

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export interface RockyAuthClientOptions {
  baseURL?: string;
  /** Extra plugins (expoClient for mobile, etc.) */
  // biome-ignore lint/suspicious/noExplicitAny: better-auth plugins have complex union types
  plugins?: any[];
  /**
   * Forwarded to better-auth's createAuthClient. Used to inject edge-auth
   * headers (e.g. Cloudflare Access Service Token) on every request so the
   * client clears an Access shield without an interactive login (WO-144).
   */
  fetchOptions?: {
    headers?: Record<string, string>;
    // biome-ignore lint/suspicious/noExplicitAny: better-auth customFetch signature
    customFetch?: (url: string, init: any) => Promise<Response>;
  };
  /**
   * Disable better-auth's default fetch plugins (e.g. the redirect plugin).
   * Recommended for React Native, where the default redirect plugin misbehaves.
   */
  disableDefaultFetchPlugins?: boolean;
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
    fetchOptions: options.fetchOptions,
    ...(options.disableDefaultFetchPlugins ? { disableDefaultFetchPlugins: options.disableDefaultFetchPlugins } : {}),
    plugins: [adminClient(), ...(options.plugins ?? [])],
  });
}
