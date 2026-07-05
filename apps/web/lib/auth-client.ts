// ── Container-Safe Auth Client ──
// Pure client-side better-auth. NO database imports, NO drizzle, NO backend deps.
// All auth API calls go through the Next.js proxy → backend (no direct DB access).
// This runs safely in a container with only the API URL, no PostgreSQL needed.

import { createAuthClient } from "better-auth/client";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:8080",
  plugins: [
    adminClient(),
    organizationClient({
      dynamicAccessControl: { enabled: true },
    }),
    twoFactorClient(),
  ],
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
