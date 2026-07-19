"use client";

import { useAuth, useSignInEmail } from "@better-auth-ui/react";
import { Button } from "@rocky/ui/components/button";
import { Card } from "@rocky/ui/components/card";
import { Input } from "@rocky/ui/components/input";
import { Label } from "@rocky/ui/components/label";
import Link from "next/link";
import { type SyntheticEvent, useState } from "react";

export function SignIn() {
  const { authClient, basePaths, localization, redirectTo, viewPaths, navigate } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { mutate: signInEmail, isPending } = useSignInEmail(authClient, {
    onError: (err) => {
      console.error("[SIGN-IN ERROR]", {
        message: err.error?.message ?? err.message,
        status: err.status,
        fullError: err,
        errorBody: err.error,
      });
      setError(err.error?.message ?? err.message);
      setPassword("");
    },
    onSuccess: () => navigate({ to: redirectTo }),
  });

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    console.info("[SIGN-IN] Attempting sign-in with email:", email);
    signInEmail({ email, password });
  };

  return (
    <Card className="w-full max-w-3xl gap-0 overflow-hidden py-0 lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between border-r bg-muted p-8 lg:flex">
        <div className="flex items-center gap-2">
          <img src="/rocky-goat.svg" alt="Rocky" className="h-8 w-auto rocky-logo" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Animal Identification &amp; Movement Control</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage farms, animals, movements and inspections.</p>
        </div>
        <p className="text-xs text-muted-foreground/70">© 2026 AIMCS. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{localization.auth.signIn}</h2>
          <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{localization.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={localization.auth.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{localization.auth.password}</Label>
              <Link
                href={`${basePaths.auth}/${viewPaths.auth.forgotPassword}`}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {localization.auth.forgotPasswordLink}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={localization.auth.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "..." : localization.auth.signIn}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {localization.auth.needToCreateAnAccount}{" "}
          <Link
            href={`${basePaths.auth}/${viewPaths.auth.signUp}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {localization.auth.signUp}
          </Link>
        </p>
      </div>
    </Card>
  );
}
