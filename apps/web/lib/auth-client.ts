// ── Container-Safe Auth Client ──
// Pure client-side better-auth. Uses shared factory from @rocky/auth/client.
//
// GATEWAY ARCHITECTURE (same as tRPC): in the browser we ONLY ever talk to
// the Next.js origin. /api/auth/* is rewritten by next.config.ts -> the API.
//
// We use `window.location.origin` in the browser rather than NEXT_PUBLIC_API_URL:
// that var is build-time-baked, so a stale image built with the localhost:8080
// default makes the browser call the wrong host -> "NetworkError when attempting to
// fetch resource". Going same-origin through the proxy removes that footgun entirely.
// SSR (no window) falls back to the direct API URL.

import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";

const _baseURL =
  typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080");

if (typeof window !== "undefined") {
  console.info("[AUTH-CLIENT] baseURL:", _baseURL);
}

export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient({ dynamicAccessControl: { enabled: true } }), twoFactorClient()],
  baseURL: _baseURL,
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
