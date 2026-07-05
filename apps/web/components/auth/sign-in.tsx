"use client";

import { useAuth, useSignInEmail } from "@better-auth-ui/react";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
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
      setError(err.error?.message ?? err.message);
      setPassword("");
    },
    onSuccess: () => navigate({ to: redirectTo }),
  });

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    signInEmail({ email, password });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{localization.auth.signIn}</CardTitle>
      </CardHeader>
      <CardContent>
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
            <Label htmlFor="password">{localization.auth.password}</Label>
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

        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <Link
            href={`${basePaths.auth}/${viewPaths.auth.forgotPassword}`}
            className="underline-offset-4 hover:underline"
          >
            {localization.auth.forgotPasswordLink}
          </Link>
          <p className="text-muted-foreground">
            {localization.auth.needToCreateAnAccount}{" "}
            <Link href={`${basePaths.auth}/${viewPaths.auth.signUp}`} className="underline underline-offset-4">
              {localization.auth.signUp}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
