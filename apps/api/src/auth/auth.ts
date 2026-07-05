// ── Auth Configuration & Instance ──
// Provides auth config to AuthModule.register() and the auth instance
// to @thallesp/nestjs-better-auth's AuthModule.forRoot().
//
// SINGLE INSTANCE: Auth.getInstance() is idempotent — calling it multiple
// times with the same config returns the same singleton.

import { Auth, type AuthConfig } from "@rocky/auth";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set");
}

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",")
  : ["http://localhost:4000", "mobile://"];

export const authConfig: AuthConfig = {
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.BASE_SERVICE_URL ?? "http://localhost:8080",
  secret,
  trustedOrigins,
};

// Create the singleton instance — Auth.getInstance() is idempotent
export const auth = Auth.getInstance(authConfig);
