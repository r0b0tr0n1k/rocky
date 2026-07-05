"use client";

import { useAuth, useRequestPasswordReset } from "@better-auth-ui/react";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Input } from "@rocky/ui/components/input";
import { Label } from "@rocky/ui/components/label";
import Link from "next/link";
import { type SyntheticEvent, useState } from "react";

export function ForgotPassword() {
  const { authClient, baseURL, basePaths, localization, viewPaths } = useAuth();

  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { mutate: requestPasswordReset, isPending } = useRequestPasswordReset(authClient, {
    onError: (err) => {
      setError(err.error?.message ?? err.message);
    },
    onSuccess: () => {
      setSuccess(true);
    },
  });

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    requestPasswordReset({
      email,
      redirectTo: `${baseURL}${basePaths.auth}/${viewPaths.auth.resetPassword}`,
    });
  };

  if (success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{localization.auth.forgotPassword}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{localization.auth.passwordResetEmailSent}</p>
          <Link
            href={`${basePaths.auth}/${viewPaths.auth.signIn}`}
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            {localization.auth.signIn}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{localization.auth.forgotPassword}</CardTitle>
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "..." : localization.auth.sendResetLink}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {localization.auth.rememberYourPassword}{" "}
          <Link href={`${basePaths.auth}/${viewPaths.auth.signIn}`} className="underline underline-offset-4">
            {localization.auth.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
