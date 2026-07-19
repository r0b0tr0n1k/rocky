import { expoClient } from "@better-auth/expo/client";
import { createRockyAuthClient } from "@rocky/auth/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Cloudflare Access Service Token — lets the better-auth client (login, session)
// clear the Access shield without an interactive login, mirroring trpc-provider.tsx.
// Empty when EXPO_PUBLIC_CF_* are unset (no Cloudflare in front).
const cfFetchOptions = (() => {
  const clientId = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET;
  if (!clientId && !clientSecret) return undefined;
  return {
    customFetch: async (url: string, init: RequestInit) => {
      const headers = new Headers(init.headers);
      if (clientId) headers.set("CF-Access-Client-Id", clientId);
      if (clientSecret) headers.set("CF-Access-Client-Secret", clientSecret);
      return fetch(url, { ...init, headers });
    },
  };
})();

export const authClient = createRockyAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080",
  fetchOptions: cfFetchOptions,
  // React Native: bypass better-auth's default redirect plugin (docs rec).
  disableDefaultFetchPlugins: true,
  plugins: [
    ...(Platform.OS !== "web"
      ? [
          expoClient({
            scheme: typeof Constants.expoConfig?.scheme === "string" ? Constants.expoConfig.scheme : "mobile",
            cookiePrefix: "rocky",
            storagePrefix: "mobile",
            storage: SecureStore,
          }),
        ]
      : []),
  ],
});

export const { signIn, signUp, signOut, resetPassword, getSession, useSession } = authClient;
