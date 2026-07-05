import { expoClient } from "@better-auth/expo/client";
import { createRockyAuthClient } from "@rocky/auth/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export const authClient = createRockyAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080",
  plugins: [
    expoClient({
      scheme: typeof Constants.expoConfig?.scheme === "string" ? Constants.expoConfig.scheme : "mobile",
      cookiePrefix: "rocky",
      storagePrefix: "mobile",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, signOut, resetPassword, getSession, useSession } = authClient;
