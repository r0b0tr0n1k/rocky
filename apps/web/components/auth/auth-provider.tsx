"use client";

// biome-ignore assist/source/organizeImports: ok
import { authClient } from "#lib/auth-client";
import type { AuthClient } from "@better-auth-ui/react";
import { AuthProvider as AuthUIProvider } from "@better-auth-ui/react";
import { useRouter } from "next/navigation";

/**
 * Wraps the app with Better Auth UI's AuthProvider so all
 * `useAuth()` / `useSignInEmail()` / `useSignUpEmail()` hooks work.
 *
 * No server-side betterAuth(), no database, no backend imports.
 * Auth is delegated entirely to the API container via proxy rewrites.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient as unknown as AuthClient}
      redirectTo="/dashboard"
      navigate={({ to, replace }) => {
        if (replace) router.replace(to);
        else router.push(to);
      }}
    >
      {children}
    </AuthUIProvider>
  );
}
