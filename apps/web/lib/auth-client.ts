// ── Container-Safe Auth Client ──
// Pure client-side better-auth. Uses shared factory from @rocky/auth/client.
// All auth API calls go through the Next.js proxy → backend (no direct DB access).

import { createRockyAuthClient } from "@rocky/auth/client";

export const authClient = createRockyAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
