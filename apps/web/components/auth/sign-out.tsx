"use client";

import { useAuth, useSignOut } from "@better-auth-ui/react";
import { useEffect, useRef } from "react";

/**
 * Auto-signs out the current user on mount and redirects to sign-in.
 * No UI needed — just a brief flash while the mutation runs.
 */
export function SignOut() {
  const { authClient, basePaths, viewPaths, navigate } = useAuth();

  const { mutate: signOut } = useSignOut(authClient, {
    onError: () => {
      navigate({
        to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
        replace: true,
      });
    },
    onSuccess: () => {
      navigate({
        to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
        replace: true,
      });
    },
  });

  const hasSignedOut = useRef(false);

  useEffect(() => {
    if (hasSignedOut.current) return;
    hasSignedOut.current = true;
    signOut();
  }, [signOut]);

  return null;
}
